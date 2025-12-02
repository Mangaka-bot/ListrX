import { Listr } from 'listr2';

/**
 * @typedef {'pending'|'processing'|'completed'|'failed'} TaskState
 */

/**
 * @typedef {Object} TaskConfig
 * @property {string} title - Display title (required)
 * @property {Object} [options] - Subtask execution options
 * @property {boolean} [options.concurrent] - Run subtasks concurrently
 * @property {boolean} [options.exitOnError] - Stop on first error
 * @property {(ctx: Object) => Promise<any>} [task] - Main task executor
 * @property {'before'|'after'} [mode] - Execution mode (default: 'before')
 * @property {number} [autoComplete] - Auto-complete after ms of idle (post-execution)
 * @property {number} [autoExecute] - Auto-execute after ms of no new subtasks
 * @property {(ctx: Object, task: Object) => Promise<void>} [rollback] - Rollback on failure
 * @property {(ctx: Object) => boolean|string} [skip] - Skip condition
 * @property {{tries: number, delay?: number}} [retry] - Retry configuration
 * @property {boolean} [showTimer] - Show execution time
 * @property {number} [batchDebounceMs] - Batch debounce time
 * @property {Object} [defaultSubtaskOptions] - Default options for subtasks
 * @property {Object} [rendererOptions] - Listr2 renderer options
 */

/**
 * Subtask class - represents a subtask that can have nested children
 */
export class Subtask {
  /** @type {TaskConfig} */
  #config;

  /** @type {Object} */
  #defaults;

  /** @type {Subtask[]} */
  #children = [];

  /** @type {boolean} */
  #executed = false;

  /**
   * @param {TaskConfig} config
   * @param {Object} [defaults]
   */
  constructor(config, defaults = {}) {
    if (!config?.title) {
      throw new Error('Subtask title is required');
    }

    this.#config = config;
    this.#defaults = defaults;
  }

  /**
   * Add nested subtask(s)
   * @param {TaskConfig|TaskConfig[]} configOrArray
   * @returns {Subtask|Subtask[]}
   */
  add(configOrArray) {
    if (this.#executed) {
      console.warn(`Subtask "${this.#config.title}": Cannot add children to an executed subtask`);
      return null;
    }

    const configs = Array.isArray(configOrArray) ? configOrArray : [configOrArray];

    if (configs.length === 0) {
      return null;
    }

    const addedSubtasks = configs.map(config => {
      const subtask = new Subtask(config, this.#defaults);
      this.#children.push(subtask);
      return subtask;
    });

    return configs.length === 1 ? addedSubtasks[0] : addedSubtasks;
  }

  /** @returns {string} */
  get title() {
    return this.#config.title;
  }

  /** @returns {number} */
  get childCount() {
    return this.#children.length;
  }

  /** @returns {TaskConfig} */
  get config() {
    return this.#config;
  }

  /** @returns {boolean} */
  get executed() {
    return this.#executed;
  }

  /**
   * Mark as executed (internal)
   * @internal
   */
  _markExecuted() {
    this.#executed = true;
  }

  /**
   * Convert to Listr task definition (internal)
   * @returns {Object}
   * @internal
   */
  _toListrTask() {
    const children = this.#children.map(c => c._toListrTask());
    const options = { ...this.#defaults, ...this.#config.options };

    const taskDef = {
      title: this.#config.title,
      skip: this.#config.skip,
      retry: this.#config.retry,
      rollback: this.#config.rollback,
      exitAfterRollback: this.#config.exitAfterRollback
    };

    taskDef.task = async (ctx, task) => {
      // Run this subtask's executor
      if (typeof this.#config.task === 'function') {
        await this.#config.task(ctx);
      }

      // Mark as executed
      this._markExecuted();

      // Then run children if any
      if (children.length > 0) {
        return task.newListr(children, {
          concurrent: options.concurrent || false,
          exitOnError: options.exitOnError ?? true,
          rendererOptions: options.rendererOptions
        });
      }
    };

    return taskDef;
  }
}

/**
 * Task class - main task container with dynamic subtask injection
 */
export class Task {
  /** @type {TaskConfig} */
  #config;

  /** @type {Object} */
  #ctx = {};

  /** @type {Subtask[]} */
  #pendingSubtasks = [];

  /** @type {Subtask[]} */
  #executedSubtasks = [];

  /** @type {TaskState} */
  #state = 'pending';

  /** @type {Function[]} */
  #stateListeners = [];

  /** @type {Function[]} */
  #subtaskListeners = [];

  /** @type {boolean} */
  #isShuttingDown = false;

  /** @type {boolean} */
  #isProcessing = false;

  /** @type {boolean} */
  #mainTaskExecuted = false;

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

  /** @type {Promise<void>|null} */
  #processingPromise = null;

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
      options: {},
      defaultSubtaskOptions: {},
      rendererOptions: {},
      ...config
    };

    // Merge defaultSubtaskOptions with main options if not specified
    if (Object.keys(this.#config.defaultSubtaskOptions).length === 0) {
      this.#config.defaultSubtaskOptions = { ...this.#config.options };
    }

    // Create completion promise
    this.#completionPromise = new Promise((resolve, reject) => {
      this.#completionResolve = resolve;
      this.#completionReject = reject;
    });
  }

  /**
   * Add subtask(s) to the task
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

    if (configs.length === 0) {
      return null;
    }

    const addedSubtasks = configs.map(config => {
      const subtask = new Subtask(config, this.#config.defaultSubtaskOptions);
      this.#pendingSubtasks.push(subtask);
      this.#notifySubtaskListeners(subtask);
      return subtask;
    });

    // Reset autoExecute timer (triggers after no new subtasks for duration)
    this.#resetAutoExecuteTimer();

    // Cancel autoComplete timer since new subtasks were added
    this.#clearAutoCompleteTimer();

    // Start processing if not already
    this.#triggerProcessing();

    return configs.length === 1 ? addedSubtasks[0] : addedSubtasks;
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

    // If we have pending subtasks or haven't run main task, process them
    if (this.#pendingSubtasks.length > 0 || !this.#mainTaskExecuted) {
      await this.#processAll();
    }

    // Wait for any ongoing processing
    if (this.#processingPromise) {
      await this.#processingPromise;
    }

    // Finalize
    if (this.#state !== 'failed') {
      this.#setState('completed');
      this.#completionResolve();
    }

    return this.#completionPromise;
  }

  /**
   * Force shutdown the task
   * @param {string} [reason]
   */
  forceShutdown(reason = 'Task force shutdown') {
    if (this.#state === 'completed') {
      return;
    }

    this.#isShuttingDown = true;
    this.#clearAutoExecuteTimer();
    this.#clearAutoCompleteTimer();

    this.#setState('failed');
    this.#completionReject(new Error(reason));
  }

  /**
   * Subscribe to state changes
   * @param {(state: TaskState) => void} callback
   * @returns {() => void} Unsubscribe function
   */
  state$(callback) {
    if (typeof callback === 'function') {
      this.#stateListeners.push(callback);
      // Immediately call with current state
      callback(this.#state);

      // Return unsubscribe function
      return () => {
        const idx = this.#stateListeners.indexOf(callback);
        if (idx > -1) {
          this.#stateListeners.splice(idx, 1);
        }
      };
    }
    return () => {};
  }

  /**
   * Subscribe to subtask additions
   * @param {(subtask: Subtask) => void} callback
   * @returns {() => void} Unsubscribe function
   */
  subtasks$(callback) {
    if (typeof callback === 'function') {
      this.#subtaskListeners.push(callback);

      // Return unsubscribe function
      return () => {
        const idx = this.#subtaskListeners.indexOf(callback);
        if (idx > -1) {
          this.#subtaskListeners.splice(idx, 1);
        }
      };
    }
    return () => {};
  }

  // ═══════════════════════════════════════════════════════════════
  // GETTERS
  // ═══════════════════════════════════════════════════════════════

  /** @returns {TaskState} */
  get state() {
    return this.#state;
  }

  /** @returns {number} */
  get subtaskCount() {
    return this.#pendingSubtasks.length + this.#executedSubtasks.length;
  }

  /** @returns {number} */
  get pendingSubtaskCount() {
    return this.#pendingSubtasks.length;
  }

  /** @returns {string} */
  get title() {
    return this.#config.title;
  }

  /** @returns {'before'|'after'} */
  get mode() {
    return this.#config.mode;
  }

  /** @returns {Function|undefined} */
  get task() {
    return this.#config.task;
  }

  /** @returns {Object} */
  get ctx() {
    return this.#ctx;
  }

  /** @returns {Promise<void>} */
  get promise() {
    return this.#completionPromise;
  }

  /** @returns {boolean} */
  get isPending() {
    return this.#state === 'pending';
  }

  /** @returns {boolean} */
  get isProcessing() {
    return this.#state === 'processing';
  }

  /** @returns {boolean} */
  get isCompleted() {
    return this.#state === 'completed';
  }

  /** @returns {boolean} */
  get isFailed() {
    return this.#state === 'failed';
  }

  // ═══════════════════════════════════════════════════════════════
  // PRIVATE METHODS
  // ═══════════════════════════════════════════════════════════════

  /**
   * @param {TaskState} newState
   * @private
   */
  #setState(newState) {
    if (this.#state !== newState) {
      this.#state = newState;
      this.#stateListeners.forEach(cb => {
        try {
          cb(newState);
        } catch (e) {
          console.error('State listener error:', e);
        }
      });
    }
  }

  /**
   * @param {Subtask} subtask
   * @private
   */
  #notifySubtaskListeners(subtask) {
    this.#subtaskListeners.forEach(cb => {
      try {
        cb(subtask);
      } catch (e) {
        console.error('Subtask listener error:', e);
      }
    });
  }

  /**
   * @private
   */
  #triggerProcessing() {
    if (this.#isProcessing) {
      return;
    }

    // For mode 'before', we need to wait until main task runs first
    // For mode 'after', we can start processing subtasks immediately
    if (this.#config.mode === 'after') {
      this.#scheduleProcessing();
    } else if (this.#config.mode === 'before') {
      // For 'before' mode, start processing (which will run main task first)
      this.#scheduleProcessing();
    }
  }

  /**
   * @private
   */
  #scheduleProcessing() {
    if (this.#isProcessing || this.#state === 'completed' || this.#state === 'failed') {
      return;
    }

    // Debounce processing to batch rapid additions
    setTimeout(() => {
      if (!this.#isProcessing && this.#pendingSubtasks.length > 0) {
        this.#processingPromise = this.#processBatch();
      }
    }, this.#config.batchDebounceMs);
  }

  /**
   * @private
   */
  async #processBatch() {
    if (this.#pendingSubtasks.length === 0) {
      this.#isProcessing = false;
      this.#onBatchComplete();
      return;
    }

    this.#isProcessing = true;
    this.#setState('processing');

    try {
      // For mode 'before', run main task first (only once)
      if (this.#config.mode === 'before' && !this.#mainTaskExecuted) {
        await this.#executeMainTask();
      }

      // Process current batch of subtasks
      const batch = this.#pendingSubtasks.splice(0);
      
      if (batch.length > 0) {
        await this.#executeSubtasks(batch);
        
        // Move to executed list
        this.#executedSubtasks.push(...batch);
      }

      this.#isProcessing = false;

      // Check if more subtasks were added while processing
      if (this.#pendingSubtasks.length > 0) {
        this.#processingPromise = this.#processBatch();
      } else {
        this.#onBatchComplete();
      }
    } catch (error) {
      this.#isProcessing = false;
      
      if (this.#config.options?.exitOnError !== false) {
        this.#setState('failed');
        this.#completionReject(error);
        throw error;
      } else {
        // Continue processing even on error
        if (this.#pendingSubtasks.length > 0) {
          this.#processingPromise = this.#processBatch();
        } else {
          this.#onBatchComplete();
        }
      }
    }
  }

  /**
   * Called when a batch of subtasks completes and no more pending
   * @private
   */
  #onBatchComplete() {
    // If shutting down (complete() was called), don't start timers
    if (this.#isShuttingDown) {
      return;
    }

    // For mode 'after', check if we should run main task via autoExecute
    // autoExecute timer is already managed by add()

    // Start autoComplete timer
    this.#startAutoCompleteTimer();
  }

  /**
   * @private
   */
  async #processAll() {
    // For mode 'before', ensure main task runs
    if (this.#config.mode === 'before' && !this.#mainTaskExecuted) {
      this.#setState('processing');
      await this.#executeMainTask();
    }

    // Process all pending subtasks
    while (this.#pendingSubtasks.length > 0) {
      const batch = this.#pendingSubtasks.splice(0);
      
      if (batch.length > 0) {
        await this.#executeSubtasks(batch);
        this.#executedSubtasks.push(...batch);
      }
    }

    // For mode 'after', run main task at the end
    if (this.#config.mode === 'after' && !this.#mainTaskExecuted) {
      await this.#executeMainTask();
    }
  }

  /**
   * @private
   */
  async #executeMainTask() {
    if (this.#mainTaskExecuted || typeof this.#config.task !== 'function') {
      this.#mainTaskExecuted = true;
      return;
    }

    this.#mainTaskExecuted = true;

    const listrConfig = {
      title: this.#config.title,
      skip: this.#config.skip,
      retry: this.#config.retry,
      rollback: this.#config.rollback,
      task: async (ctx) => {
        await this.#config.task(ctx);
      }
    };

    const listr = new Listr([listrConfig], {
      concurrent: false,
      exitOnError: this.#config.options?.exitOnError ?? true,
      collectErrors: 'minimal',
      forceColor: true,
      rendererOptions: {
        showTimer: this.#config.showTimer,
        collapseSubtasks: false,
        showSubtasks: true,
        ...this.#config.rendererOptions
      }
    });

    await listr.run(this.#ctx);
  }

  /**
   * @param {Subtask[]} subtasks
   * @private
   */
  async #executeSubtasks(subtasks) {
    if (subtasks.length === 0) {
      return;
    }

    const listrTasks = subtasks.map(st => st._toListrTask());

    const listr = new Listr(listrTasks, {
      concurrent: this.#config.options?.concurrent || false,
      exitOnError: this.#config.options?.exitOnError ?? true,
      collectErrors: 'minimal',
      forceColor: true,
      rendererOptions: {
        showTimer: this.#config.showTimer,
        collapseSubtasks: false,
        showSubtasks: true,
        ...this.#config.rendererOptions
      }
    });

    await listr.run(this.#ctx);
  }

  /**
   * Reset autoExecute timer - fires after no new subtasks for duration
   * @private
   */
  #resetAutoExecuteTimer() {
    this.#clearAutoExecuteTimer();

    const delay = this.#config.autoExecute;
    if (!delay || this.#isShuttingDown) {
      return;
    }

    this.#autoExecuteTimer = setTimeout(async () => {
      // Only relevant for mode 'after' - triggers main task execution
      if (this.#config.mode === 'after' && !this.#mainTaskExecuted && !this.#isShuttingDown) {
        try {
          // Process any remaining subtasks first
          if (this.#pendingSubtasks.length > 0) {
            await this.#processBatch();
            // Wait for processing to complete
            if (this.#processingPromise) {
              await this.#processingPromise;
            }
          }

          // Then execute main task
          this.#setState('processing');
          await this.#executeMainTask();
          
          // Start autoComplete timer after main task
          this.#startAutoCompleteTimer();
        } catch (err) {
          console.error('Auto-execute error:', err);
          this.#setState('failed');
          this.#completionReject(err);
        }
      }
    }, delay);
  }

  /**
   * @private
   */
  #clearAutoExecuteTimer() {
    if (this.#autoExecuteTimer) {
      clearTimeout(this.#autoExecuteTimer);
      this.#autoExecuteTimer = null;
    }
  }

  /**
   * Start autoComplete timer - fires after all subtasks done + idle duration
   * @private
   */
  #startAutoCompleteTimer() {
    this.#clearAutoCompleteTimer();

    const delay = this.#config.autoComplete;
    if (!delay || this.#isShuttingDown) {
      return;
    }

    // Only start if no pending subtasks
    if (this.#pendingSubtasks.length > 0) {
      return;
    }

    // For mode 'after', only start after main task executed
    if (this.#config.mode === 'after' && !this.#mainTaskExecuted) {
      return;
    }

    this.#autoCompleteTimer = setTimeout(() => {
      // Double-check no new subtasks were added
      if (this.#pendingSubtasks.length === 0 && !this.#isShuttingDown) {
        this.#isShuttingDown = true;
        this.#setState('completed');
        this.#completionResolve();
      }
    }, delay);
  }

  /**
   * @private
   */
  #clearAutoCompleteTimer() {
    if (this.#autoCompleteTimer) {
      clearTimeout(this.#autoCompleteTimer);
      this.#autoCompleteTimer = null;
    }
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