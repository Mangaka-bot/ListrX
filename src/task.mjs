import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TaskNode } from './task-node.mjs';
import { TaskRenderer } from './task-renderer.mjs';
import { Subtask } from './subtask.mjs';
import { delay } from './helpers.mjs';

/**
 * @typedef {import('./types.mjs').TaskConfig} TaskConfig
 * @typedef {import('./types.mjs').TaskState} TaskState
 */

/**
 * Task - Main task container with dynamic subtask injection
 */
class Task {
  /** @type {TaskConfig} */
  #config;

  /** @type {Object} */
  #ctx = {};

  /** @type {TaskNode} */
  #rootNode;

  /** @type {TaskRenderer} */
  #renderer;

  /** @type {TaskState} */
  #state = 'pending';

  /** @type {Function[]} */
  #stateListeners = [];

  /** @type {Function[]} */
  #subtaskListeners = [];

  /** @type {boolean} */
  #isShuttingDown = false;

  /** @type {boolean} */
  #rendererStarted = false;

  /** @type {boolean} */
  #mainTaskExecuted = false;

  /** @type {boolean} */
  #setupExecuted = false;

  /** @type {Promise<void>|null} */
  #completionPromise = null;

  /** @type {Function|null} */
  #completionResolve = null;

  /** @type {Function|null} */
  #completionReject = null;

  /** @type {NodeJS.Timeout|null} */
  #autoCompleteTimer = null;

  /** @type {NodeJS.Timeout|null} */
  #autoExecuteTimer = null;

  /** @type {Subject<void>} */
  #destroy$ = new Subject();

  /** @type {boolean} */
  #isProcessingQueue = false;

  /** @type {TaskNode[]} */
  #pendingNodes = [];

  /** @type {Error|null} */
  #fatalError = null;

  /** @type {Set<TaskNode>} */
  #executingNodes = new Set();

  /**
   * @param {TaskConfig} config
   */
  constructor(config) {
    if (!config?.title) {
      throw new Error('Task title is required');
    }

    this.#config = {
      mode: 'before',
      batchDebounceMs: 50,
      options: { exitOnError: true, concurrent: false },
      defaultSubtaskOptions: {},
      showTimer: false,
      spinnerColor: 'cyan',
      rendererOptions: {},
      ...config
    };

    if (Object.keys(this.#config.defaultSubtaskOptions).length === 0) {
      this.#config.defaultSubtaskOptions = { ...this.#config.options };
    }

    this.#rootNode = new TaskNode({
      title: this.#config.title,
      setup: this.#config.setup,
      task: this.#config.task,
      skip: this.#config.skip,
      retry: this.#config.retry,
      rollback: this.#config.rollback,
      showTimer: this.#config.showTimer,
      spinnerColor: this.#config.spinnerColor,
      options: this.#config.options,
      mode: this.#config.mode
    }, null, this.#config.defaultSubtaskOptions);

    this.#renderer = new TaskRenderer(this.#rootNode, this.#config.rendererOptions);

    this.#completionPromise = new Promise((resolve, reject) => {
      this.#completionResolve = resolve;
      this.#completionReject = reject;
    });

    this.#subscribeToNodeChildren(this.#rootNode);
  }

  /**
   * Subscribe to a node's child additions recursively
   * @param {TaskNode} node
   */
  #subscribeToNodeChildren(node) {
    node.childAdded$.pipe(
      takeUntil(this.#destroy$)
    ).subscribe(childNode => {
      const subtask = Subtask._fromNode(childNode, this.#config.defaultSubtaskOptions, (n) => {
        this.#onNewNode(n);
      });
      this.#notifySubtaskListeners(subtask);

      this.#subscribeToNodeChildren(childNode);
      this.#onNewNode(childNode);
    });
  }

  /**
   * Called when a new node is added anywhere in the tree
   * @param {TaskNode} node
   */
  #onNewNode(node) {
    if (!this.#pendingNodes.includes(node)) {
      this.#pendingNodes.push(node);
    }

    this.#resetAutoExecuteTimer();
    this.#clearAutoCompleteTimer();
    this.#triggerProcessing();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PUBLIC API
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Add subtask(s) to the main task
   * @param {TaskConfig|TaskConfig[]} configOrArray
   * @returns {Subtask|Subtask[]|null}
   */
  add(configOrArray) {
    if (this.#isShuttingDown) {
      console.warn(`Task "${this.#config.title}": Cannot add subtasks - task is shutting down`);
      return null;
    }

    if (this.#state === 'completed' || this.#state === 'failed') {
      console.warn(`Task "${this.#config.title}": Cannot add subtasks - task already finished`);
      return null;
    }

    const configs = Array.isArray(configOrArray) ? configOrArray : [configOrArray];
    if (configs.length === 0) return null;

    const results = this.#rootNode.add(configs);
    if (!results) return null;

    const nodes = Array.isArray(results) ? results : [results];
    const subtasks = nodes.map(n => Subtask._fromNode(n, this.#config.defaultSubtaskOptions, (node) => {
      this.#onNewNode(node);
    }));

    return configs.length === 1 ? subtasks[0] : subtasks;
  }

  /**
   * Signal completion - no more subtasks will be added
   * @returns {Promise<void>}
   */
  async complete() {
    if (this.#state === 'completed' || this.#state === 'failed') {
      return this.#completionPromise;
    }

    this.#isShuttingDown = true;
    this.#clearAutoExecuteTimer();
    this.#clearAutoCompleteTimer();

    this.#ensureRendererStarted();

    // Execute setup first (always runs before everything else)
    await this.#executeSetup();

    if (this.#fatalError) {
      this.#finalize();
      return this.#completionPromise;
    }

    // Execute based on mode
    if (this.#config.mode === 'before') {
      if (!this.#mainTaskExecuted) {
        await this.#executeMainTask();
      }
      await this.#waitForAllNodes();
    } else {
      await this.#waitForAllNodes();
      if (!this.#mainTaskExecuted) {
        await this.#executeMainTask();
      }
    }

    this.#finalize();

    return this.#completionPromise;
  }

  /**
   * Force shutdown the task
   * @param {string} [reason]
   */
  forceShutdown(reason = 'Task force shutdown') {
    if (this.#state === 'completed') return;

    this.#isShuttingDown = true;
    this.#clearAllTimers();

    this.#renderer.stop();
    this.#rootNode.dispose();
    this.#destroy$.next();
    this.#destroy$.complete();

    this.#setState('failed');
    this.#completionReject(new Error(reason));
  }

  /**
   * Subscribe to state changes
   * @param {(state: TaskState) => void} callback
   * @returns {() => void} Unsubscribe function
   */
  state$(callback) {
    if (typeof callback !== 'function') return () => {};

    this.#stateListeners.push(callback);
    callback(this.#state);

    return () => {
      const idx = this.#stateListeners.indexOf(callback);
      if (idx > -1) this.#stateListeners.splice(idx, 1);
    };
  }

  /**
   * Subscribe to subtask additions
   * @param {(subtask: Subtask) => void} callback
   * @returns {() => void} Unsubscribe function
   */
  subtasks$(callback) {
    if (typeof callback !== 'function') return () => {};

    this.#subtaskListeners.push(callback);

    return () => {
      const idx = this.#subtaskListeners.indexOf(callback);
      if (idx > -1) this.#subtaskListeners.splice(idx, 1);
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GETTERS
  // ═══════════════════════════════════════════════════════════════════════════

  /** @returns {TaskState} */
  get state() { return this.#state; }

  /** @returns {string} */
  get title() { return this.#config.title; }

  /** @returns {'before'|'after'} */
  get mode() { return this.#config.mode; }

  /** @returns {Function|undefined} */
  get task() { return this.#config.task; }

  /** @returns {Function|undefined} */
  get setup() { return this.#config.setup; }

  /** @returns {Object} */
  get ctx() { return this.#ctx; }

  /** @returns {Promise<void>} */
  get promise() { return this.#completionPromise; }

  /** @returns {number} */
  get subtaskCount() {
    return this.#rootNode.getAllDescendants().length;
  }

  /** @returns {number} */
  get pendingSubtaskCount() {
    return this.#rootNode.getAllDescendants()
      .filter(n => n.state === 'pending').length;
  }

  /** @returns {boolean} */
  get isPending() { return this.#state === 'pending'; }

  /** @returns {boolean} */
  get isProcessing() { return this.#state === 'processing'; }

  /** @returns {boolean} */
  get isCompleted() { return this.#state === 'completed'; }

  /** @returns {boolean} */
  get isFailed() { return this.#state === 'failed'; }

  // ═══════════════════════════════════════════════════════════════════════════
  // PRIVATE METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * @param {TaskState} newState
   */
  #setState(newState) {
    if (this.#state === newState) return;

    this.#state = newState;
    this.#stateListeners.forEach(cb => {
      try { cb(newState); }
      catch (e) { /* ignore listener errors */ }
    });
  }

  /**
   * @param {Subtask} subtask
   */
  #notifySubtaskListeners(subtask) {
    this.#subtaskListeners.forEach(cb => {
      try { cb(subtask); }
      catch (e) { /* ignore listener errors */ }
    });
  }

  #ensureRendererStarted() {
    if (!this.#rendererStarted) {
      this.#rendererStarted = true;
      this.#rootNode.setState('processing');
      this.#setState('processing');
      this.#renderer.start();
    }
  }

  /**
   * Execute the setup function (runs first, before everything else)
   */
  async #executeSetup() {
    if (this.#setupExecuted) return;
    this.#setupExecuted = true;

    if (typeof this.#config.setup !== 'function') return;

    try {
      await this.#config.setup(this.#ctx, this.#rootNode);
    } catch (error) {
      this.#rootNode.setError(error);
      
      // Execute rollback if defined
      if (typeof this.#config.rollback === 'function') {
        try {
          this.#rootNode.output = 'Rolling back...';
          await this.#config.rollback(this.#ctx, this.#rootNode);
        } catch (rollbackError) {
          // Rollback failed silently
        }
      }

      if (this.#config.options?.exitOnError !== false) {
        this.#fatalError = error;
      }
    }
  }

  #triggerProcessing() {
    if (this.#isProcessingQueue || this.#fatalError) return;

    this.#ensureRendererStarted();
    this.#processNextBatch();
  }

  async #processNextBatch() {
    if (this.#isProcessingQueue) return;
    this.#isProcessingQueue = true;

    try {
      while (this.#pendingNodes.length > 0 && !this.#fatalError) {
        const readyNodes = this.#pendingNodes.filter(node => {
          if (node.executed) return false;
          if (node.parent === this.#rootNode) return true;
          if (node.parent && node.parent.executed) return true;
          if (node.parent && this.#executingNodes.has(node.parent)) return false;
          return true;
        });

        if (readyNodes.length === 0) {
          await delay(10);
          continue;
        }

        for (const node of readyNodes) {
          const idx = this.#pendingNodes.indexOf(node);
          if (idx > -1) this.#pendingNodes.splice(idx, 1);
        }

        const byParent = new Map();
        for (const node of readyNodes) {
          const parent = node.parent || this.#rootNode;
          if (!byParent.has(parent)) {
            byParent.set(parent, []);
          }
          byParent.get(parent).push(node);
        }

        for (const [parent, nodes] of byParent) {
          const options = { ...this.#config.options, ...parent.config?.options };

          if (options.concurrent) {
            await Promise.all(nodes.map(node => this.#executeNode(node)));
          } else {
            for (const node of nodes) {
              if (this.#fatalError) break;
              await this.#executeNode(node);
            }
          }
        }

        await delay(this.#config.batchDebounceMs);
      }
    } finally {
      this.#isProcessingQueue = false;
    }

    if (this.#pendingNodes.length > 0 && !this.#fatalError) {
      this.#processNextBatch();
    } else if (!this.#isShuttingDown && !this.#fatalError) {
      this.#startAutoCompleteTimer();
    }
  }

  /**
   * Execute a node's setup function
   * @param {TaskNode} node
   */
  async #executeNodeSetup(node) {
    if (node.setupExecuted) return true;
    node.markSetupExecuted();

    if (typeof node.config.setup !== 'function') return true;

    try {
      await node.config.setup(this.#ctx, node);
      return true;
    } catch (error) {
      node.setError(error);
      node.setState('failed');
      node.markExecuted();
      this.#executingNodes.delete(node);

      // Execute rollback if defined
      if (typeof node.config.rollback === 'function') {
        try {
          node.output = 'Rolling back...';
          await node.config.rollback(this.#ctx, node);
        } catch (rollbackError) {
          // Rollback failed silently
        }
      }

      const exitOnError = node.config.options?.exitOnError ??
                          this.#config.options?.exitOnError ??
                          true;

      if (exitOnError) {
        this.#fatalError = error;
      }

      return false;
    }
  }

  /**
   * @param {TaskNode} node
   */
  async #executeNode(node) {
    if (node.executed || node.state !== 'pending') return;

    // Check skip condition
    if (typeof node.config.skip === 'function') {
      try {
        const skipResult = node.config.skip(this.#ctx);
        if (skipResult) {
          node.setState('skipped');
          if (typeof skipResult === 'string') {
            node.output = skipResult;
          }
          node.markExecuted();
          return;
        }
      } catch (e) {
        // Skip check failed, continue execution
      }
    }

    node.setState('processing');
    this.#executingNodes.add(node);

    // Execute setup first (always runs before the task)
    const setupSuccess = await this.#executeNodeSetup(node);
    if (!setupSuccess) return;

    const retryConfig = node.config.retry || { tries: 1, delay: 0 };
    let lastError = null;

    for (let attempt = 0; attempt < retryConfig.tries; attempt++) {
      try {
        if (typeof node.config.task === 'function') {
          await node.config.task(this.#ctx, node);
        }

        await this.#executeNodeChildren(node);

        // Only set completed if not already set to a final state
        if (!['completed', 'failed', 'skipped', 'warning', 'info'].includes(node.state)) {
          node.setState('completed');
        }
        node.markExecuted();
        this.#executingNodes.delete(node);
        return;

      } catch (error) {
        lastError = error;

        if (attempt < retryConfig.tries - 1) {
          const retryDelay = retryConfig.delay || 0;
          if (retryDelay > 0) {
            node.output = `Retrying in ${retryDelay}ms... (attempt ${attempt + 2}/${retryConfig.tries})`;
            await delay(retryDelay);
          }
          continue;
        }
      }
    }

    node.setError(lastError);
    node.setState('failed');
    node.markExecuted();
    this.#executingNodes.delete(node);

    if (typeof node.config.rollback === 'function') {
      try {
        node.output = 'Rolling back...';
        await node.config.rollback(this.#ctx, node);
      } catch (rollbackError) {
        // Rollback failed silently
      }
    }

    const exitOnError = node.config.options?.exitOnError ??
                        this.#config.options?.exitOnError ??
                        true;

    if (exitOnError) {
      this.#fatalError = lastError;
    }
  }

  /**
   * @param {TaskNode} node
   */
  async #executeNodeChildren(node) {
    const children = node.children.filter(c => !c.executed && c.state === 'pending');
    if (children.length === 0) return;

    const options = { ...this.#config.options, ...node.config.options };

    if (options.concurrent) {
      await Promise.all(children.map(child => this.#executeNode(child)));
    } else {
      for (const child of children) {
        if (this.#fatalError) break;
        await this.#executeNode(child);
      }
    }
  }

  async #executeMainTask() {
    if (this.#mainTaskExecuted) return;
    this.#mainTaskExecuted = true;

    if (typeof this.#config.task !== 'function') return;

    const retryConfig = this.#config.retry || { tries: 1, delay: 0 };
    let lastError = null;

    for (let attempt = 0; attempt < retryConfig.tries; attempt++) {
      try {
        await this.#config.task(this.#ctx, this.#rootNode);
        return;
      } catch (error) {
        lastError = error;

        if (attempt < retryConfig.tries - 1) {
          const retryDelay = retryConfig.delay || 0;
          if (retryDelay > 0) {
            this.#rootNode.output = `Retrying in ${retryDelay}ms... (attempt ${attempt + 2}/${retryConfig.tries})`;
            await delay(retryDelay);
          }
          continue;
        }
      }
    }

    this.#rootNode.setError(lastError);

    if (typeof this.#config.rollback === 'function') {
      try {
        this.#rootNode.output = 'Rolling back...';
        await this.#config.rollback(this.#ctx, this.#rootNode);
      } catch (rollbackError) {
        // Rollback failed silently
      }
    }

    if (this.#config.options?.exitOnError !== false) {
      this.#fatalError = lastError;
    }
  }

  async #waitForAllNodes() {
    while (
      (this.#pendingNodes.length > 0 || this.#isProcessingQueue || this.#executingNodes.size > 0)
      && !this.#fatalError
    ) {
      await delay(50);
    }
  }

  #finalize() {
    this.#renderer.stop();
    this.#rootNode.dispose();
    this.#destroy$.next();
    this.#destroy$.complete();

    if (this.#fatalError) {
      this.#rootNode.setState('failed');
      this.#setState('failed');
      this.#completionReject(this.#fatalError);
    } else {
      this.#rootNode.setState('completed');
      this.#setState('completed');
      this.#completionResolve();
    }
  }

  #resetAutoExecuteTimer() {
    this.#clearAutoExecuteTimer();

    const delayMs = this.#config.autoExecute;
    if (!delayMs || this.#isShuttingDown) return;

    this.#autoExecuteTimer = setTimeout(async () => {
      if (!this.#isShuttingDown && !this.#mainTaskExecuted) {
        this.#ensureRendererStarted();

        // Execute setup first
        await this.#executeSetup();

        if (this.#fatalError) {
          this.#finalize();
          return;
        }

        if (this.#config.mode === 'before') {
          await this.#executeMainTask();
          await this.#waitForAllNodes();
        } else {
          await this.#waitForAllNodes();
          await this.#executeMainTask();
        }

        this.#startAutoCompleteTimer();
      }
    }, delayMs);
  }

  #startAutoCompleteTimer() {
    this.#clearAutoCompleteTimer();

    const delayMs = this.#config.autoComplete;
    if (!delayMs || this.#isShuttingDown) return;

    if (this.#pendingNodes.length > 0 || this.#isProcessingQueue || this.#executingNodes.size > 0) {
      return;
    }

    this.#autoCompleteTimer = setTimeout(async () => {
      if (!this.#isShuttingDown &&
          this.#pendingNodes.length === 0 &&
          !this.#isProcessingQueue &&
          this.#executingNodes.size === 0) {
        this.#isShuttingDown = true;

        // Execute setup first
        await this.#executeSetup();

        if (this.#fatalError) {
          this.#finalize();
          return;
        }

        if (!this.#mainTaskExecuted) {
          if (this.#config.mode === 'before') {
            await this.#executeMainTask();
            await this.#waitForAllNodes();
          } else {
            await this.#waitForAllNodes();
            await this.#executeMainTask();
          }
        }

        this.#finalize();
      }
    }, delayMs);
  }

  #clearAutoExecuteTimer() {
    if (this.#autoExecuteTimer) {
      clearTimeout(this.#autoExecuteTimer);
      this.#autoExecuteTimer = null;
    }
  }

  #clearAutoCompleteTimer() {
    if (this.#autoCompleteTimer) {
      clearTimeout(this.#autoCompleteTimer);
      this.#autoCompleteTimer = null;
    }
  }

  #clearAllTimers() {
    this.#clearAutoExecuteTimer();
    this.#clearAutoCompleteTimer();
  }
}

/**
 * Factory function to create a new Task
 * @param {TaskConfig} config
 * @returns {Task}
 */
export function createTask(config) {
  return new Task(config);
}