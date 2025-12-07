import { Subject, BehaviorSubject, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * @typedef {import('./types.mjs').TaskConfig} TaskConfig
 * @typedef {import('./types.mjs').TaskState} TaskState
 * @typedef {import('./types.mjs').SpinnerColor} SpinnerColor
 */

/**
 * TaskNode - Represents a single node in the task tree
 * @class TaskNode
 */
export class TaskNode {
  /** @type {string} */
  #id;

  /** @type {string} */
  #title;

  /** @type {TaskState} */
  #state = 'pending';

  /** @type {string} */
  #output = '';

  /** @type {SpinnerColor} */
  #spinnerColor = 'cyan';

  /** @type {TaskConfig} */
  #config;

  /** @type {TaskNode[]} */
  #children = [];

  /** @type {TaskNode|null} */
  #parent = null;

  /** @type {number} */
  #level = 0;

  /** @type {number|null} */
  #startTime = null;

  /** @type {number|null} */
  #endTime = null;

  /** @type {Error|null} */
  #error = null;

  /** @type {Object} */
  #defaults;

  /** @type {BehaviorSubject<TaskState>} */
  #state$;

  /** @type {BehaviorSubject<string>} */
  #title$;

  /** @type {BehaviorSubject<string>} */
  #output$;

  /** @type {BehaviorSubject<SpinnerColor>} */
  #spinnerColor$;

  /** @type {Subject<TaskNode>} */
  #childAdded$ = new Subject();

  /** @type {boolean} */
  #executed = false;

  /** @type {boolean} */
  #setupExecuted = false;

  static #idCounter = 0;

  /**
   * @param {TaskConfig} config
   * @param {TaskNode|null} parent
   * @param {Object} defaults
   */
  constructor(config, parent = null, defaults = {}) {
    if (!config?.title) {
      throw new Error('Task title is required');
    }

    this.#id = `task_${++TaskNode.#idCounter}`;
    this.#config = { ...config };
    this.#title = config.title;
    this.#parent = parent;
    this.#level = parent ? parent.level + 1 : 0;
    this.#defaults = defaults;
    this.#spinnerColor = config.spinnerColor || 'cyan';

    // Initialize RxJS subjects
    this.#state$ = new BehaviorSubject('pending');
    this.#title$ = new BehaviorSubject(config.title);
    this.#output$ = new BehaviorSubject('');
    this.#spinnerColor$ = new BehaviorSubject(this.#spinnerColor);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Public Getters
  // ═══════════════════════════════════════════════════════════════════════════

  /** @returns {string} */
  get id() { return this.#id; }
  
  /** @returns {number} */
  get level() { return this.#level; }
  
  /** @returns {TaskNode|null} */
  get parent() { return this.#parent; }
  
  /** @returns {TaskConfig} */
  get config() { return this.#config; }
  
  /** @returns {Error|null} */
  get error() { return this.#error; }
  
  /** @returns {TaskNode[]} */
  get children() { return [...this.#children]; }
  
  /** @returns {number} */
  get childCount() { return this.#children.length; }
  
  /** @returns {Object} */
  get defaults() { return this.#defaults; }
  
  /** @returns {boolean} */
  get executed() { return this.#executed; }
  
  /** @returns {boolean} */
  get setupExecuted() { return this.#setupExecuted; }

  /** @returns {string} */
  get title() { return this.#title; }
  
  /** @param {string} value */
  set title(value) {
    this.#title = value;
    this.#title$.next(value);
  }

  /** @returns {string} */
  get output() { return this.#output; }
  
  /** @param {string} value */
  set output(value) {
    this.#output = value;
    this.#output$.next(value);
  }

  /** @returns {SpinnerColor} */
  get spinnerColor() { return this.#spinnerColor; }
  
  /** @param {SpinnerColor} value */
  set spinnerColor(value) {
    this.#spinnerColor = value;
    this.#spinnerColor$.next(value);
  }

  /** @returns {TaskState} */
  get state() { return this.#state; }

  /** @returns {number|null} */
  get duration() {
    if (!this.#startTime) return null;
    const end = this.#endTime || Date.now();
    return end - this.#startTime;
  }

  // Observable streams
  /** @returns {import('rxjs').Observable<TaskState>} */
  get state$() { return this.#state$.asObservable(); }
  
  /** @returns {import('rxjs').Observable<string>} */
  get title$() { return this.#title$.asObservable(); }
  
  /** @returns {import('rxjs').Observable<string>} */
  get output$() { return this.#output$.asObservable(); }
  
  /** @returns {import('rxjs').Observable<SpinnerColor>} */
  get spinnerColor$() { return this.#spinnerColor$.asObservable(); }
  
  /** @returns {import('rxjs').Observable<TaskNode>} */
  get childAdded$() { return this.#childAdded$.asObservable(); }

  /**
   * Combined observable for any changes in this node
   * @returns {import('rxjs').Observable<{state: TaskState, title: string, output: string, spinnerColor: SpinnerColor, node: TaskNode}>}
   */
  get changes$() {
    return combineLatest([
      this.#state$,
      this.#title$,
      this.#output$,
      this.#spinnerColor$
    ]).pipe(
      map(([state, title, output, spinnerColor]) => ({ state, title, output, spinnerColor, node: this }))
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // State Management
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * @param {TaskState} newState
   * @returns {void}
   */
  setState(newState) {
    if (newState === 'processing' && !this.#startTime) {
      this.#startTime = Date.now();
    }
    if (['completed', 'failed', 'skipped', 'warning', 'info'].includes(newState) && !this.#endTime) {
      this.#endTime = Date.now();
    }
    this.#state = newState;
    this.#state$.next(newState);
  }

  /**
   * @param {Error} error
   * @returns {void}
   */
  setError(error) {
    this.#error = error;
  }

  /** @returns {void} */
  markExecuted() {
    this.#executed = true;
  }

  /** @returns {void} */
  markSetupExecuted() {
    this.#setupExecuted = true;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // State Transition Methods (ora-like)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Mark task as succeeded/completed
   * @param {string} [message] - Optional message to set as title
   * @returns {TaskNode}
   */
  succeed(message) {
    if (message !== undefined) {
      this.title = message;
    }
    this.setState('completed');
    this.markExecuted();
    return this;
  }

  /**
   * Mark task as failed
   * @param {string} [message] - Optional message to set as title
   * @returns {TaskNode}
   */
  fail(message) {
    if (message !== undefined) {
      this.title = message;
    }
    this.setState('failed');
    this.markExecuted();
    return this;
  }

  /**
   * Mark task with warning state
   * @param {string} [message] - Optional message to set as title
   * @returns {TaskNode}
   */
  warn(message) {
    if (message !== undefined) {
      this.title = message;
    }
    this.setState('warning');
    this.markExecuted();
    return this;
  }

  /**
   * Mark task with info state
   * @param {string} [message] - Optional message to set as title
   * @returns {TaskNode}
   */
  info(message) {
    if (message !== undefined) {
      this.title = message;
    }
    this.setState('info');
    this.markExecuted();
    return this;
  }

  /**
   * Add child task(s)
   * @param {TaskConfig|TaskConfig[]} configOrArray
   * @returns {TaskNode|TaskNode[]|null}
   */
  add(configOrArray) {
    const configs = Array.isArray(configOrArray) ? configOrArray : [configOrArray];
    if (configs.length === 0) return null;

    /** @type {TaskNode[]} */
    const addedNodes = configs.map(config => {
      const mergedConfig = {
        showTimer: this.#config.showTimer,
        spinnerColor: this.#spinnerColor,
        ...config,
        options: { ...this.#defaults, ...config.options }
      };
      const node = new TaskNode(mergedConfig, this, this.#defaults);
      this.#children.push(node);
      this.#childAdded$.next(node);
      return node;
    });

    return configs.length === 1 ? addedNodes[0] : addedNodes;
  }

  /**
   * Get all descendant nodes recursively
   * @returns {TaskNode[]}
   */
  getAllDescendants() {
    /** @type {TaskNode[]} */
    const descendants = [];
    
    /**
     * @param {TaskNode} node
     */
    const traverse = (node) => {
      for (const child of node.children) {
        descendants.push(child);
        traverse(child);
      }
    };
    traverse(this);
    return descendants;
  }

  /**
   * Cleanup observables
   * @returns {void}
   */
  dispose() {
    this.#state$.complete();
    this.#title$.complete();
    this.#output$.complete();
    this.#spinnerColor$.complete();
    this.#childAdded$.complete();
    this.#children.forEach(child => child.dispose());
  }
}