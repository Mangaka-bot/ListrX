import { Listr } from 'listr2';
import { Subject, BehaviorSubject, firstValueFrom } from 'rxjs';
import { filter, take, takeUntil, bufferTime, tap } from 'rxjs/operators';

/**
 * @typedef {Object} SubtaskDefinition
 * @property {string} title - Display title for the subtask
 * @property {Function} [task] - Async function (ctx, task) => Promise<any>
 * @property {boolean|Function} [enabled] - Whether subtask is enabled
 * @property {boolean|string|Function} [skip] - Skip condition or message
 * @property {number|{tries: number, delay?: number}} [retry] - Retry config
 * @property {Function} [rollback] - Rollback function on failure
 * @property {SubtaskDefinition[]} [subtasks] - Nested subtasks
 * @property {SubtaskOptions} [options] - Options for this subtask's children
 * @property {any} [exitAfterRollback] - Exit behavior after rollback
 */

/**
 * @typedef {Object} SubtaskOptions
 * @property {boolean} [concurrent=false] - Run subtasks concurrently
 * @property {boolean} [exitOnError=true] - Stop on first error
 * @property {boolean} [collectErrors=false] - Collect all errors
 * @property {Object} [rendererOptions] - Renderer options for subtasks
 */

/**
 * @typedef {Object} TaskOptions
 * @property {SubtaskDefinition[]} [subtasks] - Static subtasks
 * @property {SubtaskOptions} [subtaskOptions] - Options for subtasks
 * @property {'before'|'after'|'only'|'wrap'} [subtaskMode='after'] - Execution mode
 */

/**
 * @typedef {Object} FullTaskDefinition  
 * @property {string} title - Task title
 * @property {Function} [task] - Task executor function
 * @property {SubtaskDefinition[]} [subtasks] - Subtasks array
 * @property {SubtaskOptions} [options] - Subtask options
 * @property {boolean|Function} [enabled] - Enable condition
 * @property {boolean|string|Function} [skip] - Skip condition
 * @property {number|{tries: number, delay?: number}} [retry] - Retry config
 * @property {Function} [rollback] - Rollback function
 */

/**
 * @typedef {Object} TaskDefinition
 * @property {string} title
 * @property {Function} [executor]
 * @property {SubtaskDefinition[]} [subtasks]
 * @property {SubtaskOptions} [subtaskOptions]
 * @property {'before'|'after'|'only'|'wrap'} [subtaskMode]
 * @property {Object} [listrOptions] - Additional listr task options
 * @property {Function} resolve
 * @property {Function} reject
 */

/**
 * @typedef {'idle'|'processing'|'completing'|'completed'} QueueState
 */

/**
 * DynamicTaskQueue - A queue system that allows runtime task injection
 * with full subtask support using RxJS Subjects and listr2
 */
export class DynamicTaskQueue {
  /** @type {TaskDefinition[]} */
  #taskBuffer = [];
  
  /** @type {Subject<TaskDefinition>} */
  #taskSubject = new Subject();
  
  /** @type {BehaviorSubject<QueueState>} */
  #stateSubject = new BehaviorSubject('idle');
  
  /** @type {Subject<void>} */
  #shutdownSignal = new Subject();
  
  /** @type {boolean} */
  #isShuttingDown = false;
  
  /** @type {Promise<void>|null} */
  #processingPromise = null;
  
  /** @type {Object} */
  #listrOptions;
  
  /** @type {number} */
  #batchDebounceMs;
  
  /** @type {number} */
  #tasksProcessed = 0;
  
  /** @type {number} */
  #tasksFailed = 0;

  /** @type {SubtaskOptions} */
  #defaultSubtaskOptions;
  
  /**
   * Create a new DynamicTaskQueue
   * @param {Object} options - Configuration options
   * @param {boolean} [options.concurrent=false] - Run tasks concurrently
   * @param {boolean} [options.exitOnError=false] - Stop queue on first error
   * @param {number} [options.batchDebounceMs=50] - Debounce time for batching
   * @param {SubtaskOptions} [options.defaultSubtaskOptions] - Default options for subtasks
   * @param {Object} [options.rendererOptions] - Listr2 renderer options
   */
  constructor(options = {}) {
    const {
      batchDebounceMs = 50,
      concurrent = false,
      exitOnError = false,
      defaultSubtaskOptions = {},
      rendererOptions = {},
      ...listrOptions
    } = options;
    
    this.#batchDebounceMs = batchDebounceMs;
    
    this.#defaultSubtaskOptions = {
      concurrent: false,
      exitOnError: true,
      rendererOptions: {
        collapseSubtasks: false,
        ...defaultSubtaskOptions.rendererOptions
      },
      ...defaultSubtaskOptions
    };
    
    this.#listrOptions = {
      concurrent,
      exitOnError,
      collectErrors: 'minimal',
      forceColor: true,
      rendererOptions: {
        collapseSubtasks: false,
        showSubtasks: true,
        removeEmptyLines: false,
        formatOutput: 'wrap',
        ...rendererOptions
      },
      ...listrOptions
    };
    
    this.#initializeTaskProcessing();
  }
  
  /**
   * Initialize the RxJS pipeline for task processing
   * @private
   */
  #initializeTaskProcessing() {
    this.#taskSubject
      .pipe(
        takeUntil(this.#shutdownSignal),
        tap(task => this.#taskBuffer.push(task)),
        bufferTime(this.#batchDebounceMs),
        filter(batch => batch.length > 0 || this.#taskBuffer.length > 0)
      )
      .subscribe({
        next: () => this.#triggerProcessing(),
        error: (err) => console.error('Task subject error:', err),
        complete: () => {
          if (this.#taskBuffer.length > 0) {
            this.#triggerProcessing();
          }
        }
      });
  }
  
  /**
   * Trigger queue processing if not already running
   * @private
   */
  #triggerProcessing() {
    if (this.#stateSubject.value !== 'processing' && this.#taskBuffer.length > 0) {
      this.#processingPromise = this.#processQueue();
    }
  }

  /**
   * Build a listr-compatible subtask array from SubtaskDefinitions
   * @private
   * @param {SubtaskDefinition[]} subtasks - Subtask definitions
   * @param {SubtaskOptions} options - Subtask options
   * @returns {Array} Listr-compatible task array
   */
  #buildSubtaskArray(subtasks, options = {}) {
    const mergedOptions = { ...this.#defaultSubtaskOptions, ...options };
    
    return subtasks.map(subtask => this.#buildSubtaskItem(subtask, mergedOptions));
  }

  /**
   * Build a single listr-compatible subtask item
   * @private
   * @param {SubtaskDefinition} subtask - Subtask definition
   * @param {SubtaskOptions} parentOptions - Parent subtask options
   * @returns {Object} Listr-compatible task object
   */
  #buildSubtaskItem(subtask, parentOptions = {}) {
    const {
      title,
      task: taskFn,
      subtasks: nestedSubtasks,
      options: nestedOptions,
      enabled,
      skip,
      retry,
      rollback,
      exitAfterRollback
    } = subtask;

    const item = {
      title,
      enabled,
      skip,
      retry,
      rollback,
      exitAfterRollback
    };

    // Handle nested subtasks
    if (nestedSubtasks && nestedSubtasks.length > 0) {
      const childOptions = { ...parentOptions, ...nestedOptions };
      
      item.task = async (ctx, task) => {
        // Execute the task function first if it exists
        let result;
        if (taskFn) {
          result = await taskFn(ctx, task);
        }
        
        // Then run nested subtasks
        const nestedListrTasks = this.#buildSubtaskArray(nestedSubtasks, childOptions);
        return task.newListr(nestedListrTasks, {
          concurrent: childOptions.concurrent,
          exitOnError: childOptions.exitOnError,
          rendererOptions: childOptions.rendererOptions
        });
      };
    } else if (taskFn) {
      item.task = taskFn;
    } else {
      // Empty task placeholder
      item.task = async () => {};
    }

    return item;
  }

  /**
   * Build the complete task executor with subtask support
   * @private
   * @param {TaskDefinition} taskDef - Task definition
   * @returns {Function} Combined executor function
   */
  #buildTaskExecutor(taskDef) {
    const { executor, subtasks, subtaskOptions, subtaskMode = 'after' } = taskDef;
    
    return async (ctx, task) => {
      let result;
      const hasSubtasks = subtasks && subtasks.length > 0;
      const hasExecutor = typeof executor === 'function';

      if (!hasSubtasks && !hasExecutor) {
        return undefined;
      }

      // Mode: only - just run subtasks
      if (subtaskMode === 'only' && hasSubtasks) {
        const subtaskArray = this.#buildSubtaskArray(subtasks, subtaskOptions);
        return task.newListr(subtaskArray, {
          concurrent: subtaskOptions?.concurrent ?? this.#defaultSubtaskOptions.concurrent,
          exitOnError: subtaskOptions?.exitOnError ?? this.#defaultSubtaskOptions.exitOnError,
          rendererOptions: subtaskOptions?.rendererOptions ?? this.#defaultSubtaskOptions.rendererOptions
        });
      }

      // Mode: before - subtasks first, then executor
      if (subtaskMode === 'before' && hasSubtasks) {
        const subtaskArray = this.#buildSubtaskArray(subtasks, subtaskOptions);
        await task.newListr(subtaskArray, {
          concurrent: subtaskOptions?.concurrent ?? this.#defaultSubtaskOptions.concurrent,
          exitOnError: subtaskOptions?.exitOnError ?? this.#defaultSubtaskOptions.exitOnError,
          rendererOptions: subtaskOptions?.rendererOptions ?? this.#defaultSubtaskOptions.rendererOptions
        }).run();
      }

      // Run main executor
      if (hasExecutor) {
        result = await executor(ctx, task);
        
        // If executor returns a Listr instance, let listr2 handle it
        if (result instanceof Listr) {
          return result;
        }
      }

      // Mode: after (default) - executor first, then subtasks
      if ((subtaskMode === 'after' || subtaskMode === 'wrap') && hasSubtasks) {
        const subtaskArray = this.#buildSubtaskArray(subtasks, subtaskOptions);
        await task.newListr(subtaskArray, {
          concurrent: subtaskOptions?.concurrent ?? this.#defaultSubtaskOptions.concurrent,
          exitOnError: subtaskOptions?.exitOnError ?? this.#defaultSubtaskOptions.exitOnError,
          rendererOptions: subtaskOptions?.rendererOptions ?? this.#defaultSubtaskOptions.rendererOptions
        }).run();
      }

      return result;
    };
  }
  
  /**
   * Main processing loop for the task queue
   * @private
   * @returns {Promise<void>}
   */
  async #processQueue() {
    this.#stateSubject.next('processing');
    
    try {
      while (this.#taskBuffer.length > 0) {
        const batch = this.#taskBuffer.splice(0);
        
        if (batch.length === 0) continue;
        
        const listrTasks = batch.map(taskDef => {
          const combinedExecutor = this.#buildTaskExecutor(taskDef);
          
          return {
            title: taskDef.title,
            enabled: taskDef.listrOptions?.enabled,
            skip: taskDef.listrOptions?.skip,
            retry: taskDef.listrOptions?.retry,
            rollback: taskDef.listrOptions?.rollback,
            exitAfterRollback: taskDef.listrOptions?.exitAfterRollback,
            task: async (ctx, task) => {
              try {
                const result = await combinedExecutor(ctx, task);
                taskDef.resolve(result);
                this.#tasksProcessed++;
                return result;
              } catch (error) {
                this.#tasksFailed++;
                taskDef.reject(error);
                throw error;
              }
            }
          };
        });
        
        const listr = new Listr(listrTasks, {
          ...this.#listrOptions,
          ctx: { queueState: this.#stateSubject.value }
        });
        
        try {
          await listr.run();
        } catch (error) {
          if (this.#listrOptions.exitOnError) {
            throw error;
          }
        }
        
        if (!this.#isShuttingDown) {
          await this.#delay(this.#batchDebounceMs);
        }
      }
    } finally {
      if (this.#isShuttingDown && this.#taskBuffer.length === 0) {
        this.#stateSubject.next('completed');
      } else if (!this.#isShuttingDown) {
        this.#stateSubject.next('idle');
      }
    }
  }
  
  /**
   * Utility delay function
   * @private
   * @param {number} ms
   * @returns {Promise<void>}
   */
  #delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Add a new task to the queue
   * @param {string} title - Task display title
   * @param {Function} taskFn - Async function (ctx, task) => Promise<any>
   * @param {TaskOptions} [options] - Task options including subtasks
   * @returns {Promise<any>} Promise resolving with task result
   * 
   * @example
   * // Simple task
   * await queue.add('Simple task', async (ctx, task) => {
   *   task.output = 'Working...';
   *   return 'done';
   * });
   * 
   * @example
   * // Task with static subtasks
   * await queue.add('Parent task', async (ctx, task) => {
   *   task.output = 'Preparing...';
   * }, {
   *   subtasks: [
   *     { title: 'Subtask 1', task: async () => {} },
   *     { title: 'Subtask 2', task: async () => {} }
   *   ],
   *   subtaskOptions: { concurrent: true }
   * });
   * 
   * @example
   * // Dynamic subtasks via task.newListr()
   * await queue.add('Dynamic subtasks', async (ctx, task) => {
   *   return task.newListr([
   *     { title: 'Dynamic 1', task: async () => {} },
   *     { title: 'Dynamic 2', task: async () => {} }
   *   ]);
   * });
   */
  add(title, taskFn, options = {}) {
    if (this.#isShuttingDown) {
      return Promise.reject(
        new Error('Queue is shutting down - cannot add new tasks')
      );
    }
    
    if (this.#stateSubject.value === 'completed') {
      return Promise.reject(
        new Error('Queue has completed - cannot add new tasks')
      );
    }
    
    const { subtasks, subtaskOptions, subtaskMode, ...listrOptions } = options;
    
    return new Promise((resolve, reject) => {
      /** @type {TaskDefinition} */
      const taskDef = {
        title,
        executor: taskFn,
        subtasks,
        subtaskOptions,
        subtaskMode,
        listrOptions,
        resolve,
        reject
      };
      
      this.#taskSubject.next(taskDef);
    });
  }

  /**
   * Add a task with subtasks (subtasks-first API)
   * @param {string} title - Parent task title
   * @param {SubtaskDefinition[]} subtasks - Array of subtask definitions
   * @param {Object} [options] - Options
   * @param {Function} [options.task] - Optional parent task executor
   * @param {SubtaskOptions} [options.subtaskOptions] - Subtask options
   * @param {'before'|'after'|'only'|'wrap'} [options.subtaskMode='only'] - When to run subtasks
   * @returns {Promise<any>}
   * 
   * @example
   * await queue.addWithSubtasks('Build project', [
   *   { 
   *     title: 'Compile TypeScript',
   *     task: async (ctx, task) => {
   *       task.output = 'Compiling...';
   *       await compile();
   *     }
   *   },
   *   { 
   *     title: 'Bundle modules',
   *     task: async () => await bundle()
   *   },
   *   {
   *     title: 'Optimize',
   *     subtasks: [
   *       { title: 'Minify JS', task: async () => {} },
   *       { title: 'Minify CSS', task: async () => {} }
   *     ],
   *     options: { concurrent: true }
   *   }
   * ], {
   *   subtaskOptions: { concurrent: false }
   * });
   */
  addWithSubtasks(title, subtasks, options = {}) {
    const { task: taskFn, subtaskOptions, subtaskMode = 'only', ...rest } = options;
    
    return this.add(title, taskFn, {
      subtasks,
      subtaskOptions,
      subtaskMode: taskFn ? subtaskMode : 'only',
      ...rest
    });
  }

  /**
   * Add a task using a full task definition object
   * @param {FullTaskDefinition} definition - Complete task definition
   * @returns {Promise<any>}
   * 
   * @example
   * await queue.addTask({
   *   title: 'Complex task',
   *   task: async (ctx, task) => {
   *     ctx.result = 'prepared';
   *   },
   *   subtasks: [
   *     {
   *       title: 'Step 1',
   *       task: async (ctx) => {
   *         console.log(ctx.result); // 'prepared'
   *       },
   *       skip: (ctx) => ctx.skipStep1
   *     },
   *     {
   *       title: 'Step 2',
   *       task: async () => {},
   *       retry: { tries: 3, delay: 1000 }
   *     }
   *   ],
   *   options: {
   *     concurrent: false,
   *     exitOnError: true
   *   }
   * });
   */
  addTask(definition) {
    const {
      title,
      task: taskFn,
      subtasks,
      options: subtaskOptions,
      enabled,
      skip,
      retry,
      rollback,
      exitAfterRollback,
      subtaskMode = 'after'
    } = definition;

    return this.add(title, taskFn, {
      subtasks,
      subtaskOptions,
      subtaskMode,
      enabled,
      skip,
      retry,
      rollback,
      exitAfterRollback
    });
  }
  
  /**
   * Add multiple tasks at once
   * @param {Array<{title: string, task: Function, subtasks?: SubtaskDefinition[], options?: TaskOptions}>} tasks
   * @returns {Promise<any[]>}
   */
  addMany(tasks) {
    return Promise.all(
      tasks.map(({ title, task, subtasks, ...options }) => {
        if (subtasks) {
          return this.add(title, task, { subtasks, ...options });
        }
        return this.add(title, task, options);
      })
    );
  }

  /**
   * Add multiple task definitions at once
   * @param {FullTaskDefinition[]} definitions - Array of task definitions
   * @returns {Promise<any[]>}
   */
  addTasks(definitions) {
    return Promise.all(definitions.map(def => this.addTask(def)));
  }
  
  /**
   * Signal completion and wait for all tasks
   * @returns {Promise<void>}
   */
  async complete() {
    if (this.#stateSubject.value === 'completed') {
      return;
    }
    
    this.#isShuttingDown = true;
    this.#stateSubject.next('completing');
    
    this.#taskSubject.complete();
    
    if (this.#taskBuffer.length > 0) {
      await this.#processQueue();
    }
    
    if (this.#processingPromise) {
      await this.#processingPromise;
    }
    
    if (this.#stateSubject.value !== 'completed') {
      await firstValueFrom(
        this.#stateSubject.pipe(
          filter(state => state === 'completed'),
          take(1)
        )
      );
    }
    
    this.#shutdownSignal.next();
    this.#shutdownSignal.complete();
  }
  
  /**
   * Force shutdown, rejecting pending tasks
   * @param {string} [reason='Queue force shutdown']
   */
  forceShutdown(reason = 'Queue force shutdown') {
    this.#isShuttingDown = true;
    
    const error = new Error(reason);
    for (const task of this.#taskBuffer) {
      task.reject(error);
    }
    this.#taskBuffer = [];
    
    this.#taskSubject.complete();
    this.#shutdownSignal.next();
    this.#shutdownSignal.complete();
    this.#stateSubject.next('completed');
  }
  
  /** @returns {Observable<QueueState>} */
  get state$() {
    return this.#stateSubject.asObservable();
  }
  
  /** @returns {QueueState} */
  get state() {
    return this.#stateSubject.value;
  }
  
  /** @returns {boolean} */
  get isIdle() {
    return this.#stateSubject.value === 'idle';
  }
  
  /** @returns {boolean} */
  get isProcessing() {
    return this.#stateSubject.value === 'processing';
  }
  
  /** @returns {boolean} */
  get isCompleted() {
    return this.#stateSubject.value === 'completed';
  }
  
  /** @returns {number} */
  get pendingCount() {
    return this.#taskBuffer.length;
  }
  
  /** @returns {{processed: number, failed: number, pending: number}} */
  get stats() {
    return {
      processed: this.#tasksProcessed,
      failed: this.#tasksFailed,
      pending: this.#taskBuffer.length
    };
  }
}