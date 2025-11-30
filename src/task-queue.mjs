import { Listr } from 'listr2';
import { Subject, BehaviorSubject, firstValueFrom, interval } from 'rxjs';
import { filter, take, takeUntil, bufferTime, tap } from 'rxjs/operators';

/**
 * @typedef {Object} TaskDefinition
 * @property {string} title - Display title for the task
 * @property {Function} executor - Async function to execute
 * @property {Function} resolve - Promise resolver
 * @property {Function} reject - Promise rejecter
 */

/**
 * @typedef {'idle'|'processing'|'completing'|'completed'} QueueState
 */

/**
 * DynamicTaskQueue - A queue system that allows runtime task injection
 * using RxJS Subjects and listr2 for beautiful CLI output
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
  
  /**
   * Create a new DynamicTaskQueue
   * @param {Object} options - Configuration options
   * @param {boolean} [options.concurrent=false] - Run tasks concurrently
   * @param {boolean} [options.exitOnError=false] - Stop queue on first error
   * @param {number} [options.batchDebounceMs=50] - Debounce time for batching tasks
   * @param {Object} [options.rendererOptions] - Listr2 renderer options
   */
  constructor(options = {}) {
    const {
      batchDebounceMs = 50,
      concurrent = false,
      exitOnError = false,
      rendererOptions = {},
      ...listrOptions
    } = options;
    
    this.#batchDebounceMs = batchDebounceMs;
    
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
    // Buffer incoming tasks with debounce for batching
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
          // Handle final batch when subject completes
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
   * Main processing loop for the task queue
   * @private
   * @returns {Promise<void>}
   */
  async #processQueue() {
    this.#stateSubject.next('processing');
    
    try {
      while (this.#taskBuffer.length > 0) {
        // Drain current buffer
        const batch = this.#taskBuffer.splice(0);
        
        if (batch.length === 0) continue;
        
        // Build listr task array from batch
        const listrTasks = batch.map(taskDef => ({
          title: taskDef.title,
          task: async (ctx, task) => {
            try {
              const result = await taskDef.executor(ctx, task);
              taskDef.resolve(result);
              this.#tasksProcessed++;
              return result;
            } catch (error) {
              this.#tasksFailed++;
              taskDef.reject(error);
              throw error;
            }
          }
        }));
        
        // Create and run Listr instance for this batch
        const listr = new Listr(listrTasks, {
          ...this.#listrOptions,
          ctx: { queueState: this.#stateSubject.value }
        });
        
        try {
          await listr.run();
        } catch (error) {
          // Errors are already handled per-task
          // Only throw if exitOnError is true
          if (this.#listrOptions.exitOnError) {
            throw error;
          }
        }
        
        // Small delay to allow new tasks to batch
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
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise<void>}
   */
  #delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Add a new task to the queue
   * @param {string} title - Task display title
   * @param {Function} taskFn - Async function to execute
   *   Receives (ctx, task) where task is the Listr task object
   * @returns {Promise<any>} Promise that resolves with the task result
   * @throws {Error} If queue is shutting down or completed
   * 
   * @example
   * await queue.add('Process file', async (ctx, task) => {
   *   task.output = 'Processing...';
   *   await someAsyncWork();
   *   return 'done';
   * });
   */
  add(title, taskFn) {
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
    
    return new Promise((resolve, reject) => {
      /** @type {TaskDefinition} */
      const taskDef = {
        title,
        executor: taskFn,
        resolve,
        reject
      };
      
      this.#taskSubject.next(taskDef);
    });
  }
  
  /**
   * Add multiple tasks at once
   * @param {Array<{title: string, task: Function}>} tasks - Array of task definitions
   * @returns {Promise<any[]>} Promise that resolves with all task results
   */
  addMany(tasks) {
    return Promise.all(
      tasks.map(({ title, task }) => this.add(title, task))
    );
  }
  
  /**
   * Signal that no more tasks will be added and wait for completion
   * @returns {Promise<void>} Resolves when all tasks have finished
   */
  async complete() {
    if (this.#stateSubject.value === 'completed') {
      return;
    }
    
    this.#isShuttingDown = true;
    this.#stateSubject.next('completing');
    
    // Complete the task subject
    this.#taskSubject.complete();
    
    // Process any remaining buffered tasks
    if (this.#taskBuffer.length > 0) {
      await this.#processQueue();
    }
    
    // Wait for any in-flight processing
    if (this.#processingPromise) {
      await this.#processingPromise;
    }
    
    // Wait for completed state
    if (this.#stateSubject.value !== 'completed') {
      await firstValueFrom(
        this.#stateSubject.pipe(
          filter(state => state === 'completed'),
          take(1)
        )
      );
    }
    
    // Cleanup
    this.#shutdownSignal.next();
    this.#shutdownSignal.complete();
  }
  
  /**
   * Force shutdown the queue, rejecting any pending tasks
   * @param {string} [reason='Queue force shutdown'] - Reason for shutdown
   */
  forceShutdown(reason = 'Queue force shutdown') {
    this.#isShuttingDown = true;
    
    // Reject all pending tasks
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
  
  /**
   * Observable of queue state changes
   * @returns {Observable<QueueState>}
   */
  get state$() {
    return this.#stateSubject.asObservable();
  }
  
  /**
   * Current queue state
   * @returns {QueueState}
   */
  get state() {
    return this.#stateSubject.value;
  }
  
  /**
   * Whether the queue is currently idle
   * @returns {boolean}
   */
  get isIdle() {
    return this.#stateSubject.value === 'idle';
  }
  
  /**
   * Whether the queue is currently processing tasks
   * @returns {boolean}
   */
  get isProcessing() {
    return this.#stateSubject.value === 'processing';
  }
  
  /**
   * Whether the queue has completed
   * @returns {boolean}
   */
  get isCompleted() {
    return this.#stateSubject.value === 'completed';
  }
  
  /**
   * Number of tasks waiting to be processed
   * @returns {number}
   */
  get pendingCount() {
    return this.#taskBuffer.length;
  }
  
  /**
   * Statistics about processed tasks
   * @returns {{processed: number, failed: number, pending: number}}
   */
  get stats() {
    return {
      processed: this.#tasksProcessed,
      failed: this.#tasksFailed,
      pending: this.#taskBuffer.length
    };
  }
}