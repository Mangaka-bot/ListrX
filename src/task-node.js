import { Subject, BehaviorSubject, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * @typedef {import('./types.js').TaskConfig} TaskConfig
 * @typedef {import('./types.js').TaskState} TaskState
 * @typedef {import('./types.js').SpinnerColor} SpinnerColor
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

  /** @type {BehaviorSubject<TaskState>|null} */
  #state$ = null;

  /** @type {BehaviorSubject<string>|null} */
  #title$ = null;

  /** @type {BehaviorSubject<string>|null} */
  #output$ = null;

  /** @type {BehaviorSubject<SpinnerColor>|null} */
  #spinnerColor$ = null;

  /** @type {Subject<TaskNode>} */
  #childAdded$ = new Subject();

  /** @type {boolean} */
  #executed = false;

  /** @type {boolean} */
  #setupExecuted = false;

  /** @type {number|null} Cached descendant count */
  #cachedDescendantCount = null;

  /** @type {boolean} Flag indicating if cache is valid */
  #descendantCacheValid = false;

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
    this.#title$?.next(value);
  }

  /** @returns {string} */
  get output() { return this.#output; }
  
  /** @param {string} value */
  set output(value) {
    this.#output = value;
    this.#output$?.next(value);
  }

  /** @returns {SpinnerColor} */
  get spinnerColor() { return this.#spinnerColor; }
  
  /** @param {SpinnerColor} value */
  set spinnerColor(value) {
    this.#spinnerColor = value;
    this.#spinnerColor$?.next(value);
  }

  /** @returns {TaskState} */
  get state() { return this.#state; }

  /** @returns {number|null} */
  get duration() {
    if (!this.#startTime) return null;
    const end = this.#endTime || Date.now();
    return end - this.#startTime;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Lazy Observable Initialization
  // ═══════════════════════════════════════════════════════════════════════════

  /** @returns {import('rxjs').Observable<TaskState>} */
  get state$() {
    if (!this.#state$) {
      this.#state$ = new BehaviorSubject(this.#state);
    }
    return this.#state$.asObservable();
  }
  
  /** @returns {import('rxjs').Observable<string>} */
  get title$() {
    if (!this.#title$) {
      this.#title$ = new BehaviorSubject(this.#title);
    }
    return this.#title$.asObservable();
  }
  
  /** @returns {import('rxjs').Observable<string>} */
  get output$() {
    if (!this.#output$) {
      this.#output$ = new BehaviorSubject(this.#output);
    }
    return this.#output$.asObservable();
  }
  
  /** @returns {import('rxjs').Observable<SpinnerColor>} */
  get spinnerColor$() {
    if (!this.#spinnerColor$) {
      this.#spinnerColor$ = new BehaviorSubject(this.#spinnerColor);
    }
    return this.#spinnerColor$.asObservable();
  }
  
  /** @returns {import('rxjs').Observable<TaskNode>} */
  get childAdded$() { return this.#childAdded$.asObservable(); }

  /**
   * Combined observable for any changes in this node
   * @returns {import('rxjs').Observable<{state: TaskState, title: string, output: string, spinnerColor: SpinnerColor, node: TaskNode}>}
   */
  get changes$() {
    // Ensure all subjects are initialized
    this.state$;
    this.title$;
    this.output$;
    this.spinnerColor$;

    return combineLatest([
      this.#state$,
      this.#title$,
      this.#output$,
      this.#spinnerColor$
    ]).pipe(
      map(([state, title, output, spinnerColor]) => ({ 
        state, title, output, spinnerColor, node: this 
      }))
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
    this.#state$?.next(newState);
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
   * Invalidate descendant cache for this node and all ancestors
   */
  #invalidateDescendantCache() {
    this.#descendantCacheValid = false;
    this.#cachedDescendantCount = null;
    
    // Invalidate parent's cache too
    if (this.#parent) {
      this.#parent.#invalidateDescendantCache();
    }
  }

  /**
   * Add child task(s)
   * @param {TaskConfig|TaskConfig[]} configOrArray
   * @returns {TaskNode|TaskNode[]|null}
   */
  add(configOrArray) {
    const configs = Array.isArray(configOrArray) ? configOrArray : [configOrArray];
    if (configs.length === 0) return null;

    // Invalidate cache before adding
    this.#invalidateDescendantCache();

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

  // ═══════════════════════════════════════════════════════════════════════════
  // Optimized Descendant Methods
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get all descendant nodes using iterative depth-first traversal
   * Optimized to avoid recursion and minimize allocations
   * @returns {TaskNode[]}
   */
  getAllDescendants() {
    const descendants = [];
    
    // Early exit if no children
    if (this.#children.length === 0) {
      return descendants;
    }

    // Use a stack for iterative traversal (avoids recursion)
    // Pre-allocate with estimated size to reduce reallocations
    const stack = new Array(this.#children.length);
    let stackSize = 0;

    // Push children in reverse order so we process left-to-right
    for (let i = this.#children.length - 1; i >= 0; i--) {
      stack[stackSize++] = this.#children[i];
    }

    // Process stack iteratively
    while (stackSize > 0) {
      const node = stack[--stackSize];
      descendants.push(node);

      // Add children in reverse order
      const children = node.#children;
      for (let i = children.length - 1; i >= 0; i--) {
        // Grow stack if needed
        if (stackSize >= stack.length) {
          stack.length *= 2;
        }
        stack[stackSize++] = children[i];
      }
    }

    return descendants;
  }

  /**
   * Get descendant count without creating array
   * Uses caching for repeated calls
   * @returns {number}
   */
  getDescendantCount() {
    if (this.#descendantCacheValid) {
      return this.#cachedDescendantCount;
    }

    let count = 0;
    
    if (this.#children.length === 0) {
      this.#cachedDescendantCount = 0;
      this.#descendantCacheValid = true;
      return 0;
    }

    // Iterative counting without creating array
    const stack = [...this.#children];
    
    while (stack.length > 0) {
      const node = stack.pop();
      count++;
      
      // Push children directly to stack
      for (let i = node.#children.length - 1; i >= 0; i--) {
        stack.push(node.#children[i]);
      }
    }

    this.#cachedDescendantCount = count;
    this.#descendantCacheValid = true;
    return count;
  }

  /**
   * Find descendants matching a predicate
   * Uses generator for memory efficiency on large trees
   * @param {(node: TaskNode) => boolean} predicate
   * @returns {TaskNode[]}
   */
  findDescendants(predicate) {
    const results = [];
    
    if (this.#children.length === 0) {
      return results;
    }

    const stack = [...this.#children].reverse();
    
    while (stack.length > 0) {
      const node = stack.pop();
      
      if (predicate(node)) {
        results.push(node);
      }
      
      // Add children in reverse order
      for (let i = node.#children.length - 1; i >= 0; i--) {
        stack.push(node.#children[i]);
      }
    }

    return results;
  }

  /**
   * Generator for iterating descendants without creating array
   * Memory efficient for very large trees
   * @yields {TaskNode}
   */
  *descendants() {
    if (this.#children.length === 0) {
      return;
    }

    const stack = [...this.#children].reverse();
    
    while (stack.length > 0) {
      const node = stack.pop();
      yield node;
      
      // Add children in reverse order
      for (let i = node.#children.length - 1; i >= 0; i--) {
        stack.push(node.#children[i]);
      }
    }
  }

  /**
   * Check if any descendant matches predicate (short-circuits)
   * @param {(node: TaskNode) => boolean} predicate
   * @returns {boolean}
   */
  hasDescendant(predicate) {
    for (const node of this.descendants()) {
      if (predicate(node)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Count descendants matching predicate
   * @param {(node: TaskNode) => boolean} predicate
   * @returns {number}
   */
  countDescendants(predicate) {
    let count = 0;
    for (const node of this.descendants()) {
      if (predicate(node)) {
        count++;
      }
    }
    return count;
  }

  /**
   * Cleanup observables
   * @returns {void}
   */
  dispose() {
    this.#state$?.complete();
    this.#title$?.complete();
    this.#output$?.complete();
    this.#spinnerColor$?.complete();
    this.#childAdded$.complete();
    
    // Clear references
    this.#state$ = null;
    this.#title$ = null;
    this.#output$ = null;
    this.#spinnerColor$ = null;
    
    // Dispose children
    for (const child of this.#children) {
      child.dispose();
    }
    
    // Clear children array
    this.#children.length = 0;
    this.#descendantCacheValid = false;
    this.#cachedDescendantCount = null;
  }
}