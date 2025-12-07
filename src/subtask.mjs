import { TaskNode } from './task-node.mjs';
import { INTERNAL_MARKER } from './constants.mjs';

/**
 * @typedef {import('./types.mjs').TaskConfig} TaskConfig
 */

/**
 * Subtask - Wrapper class for API compatibility
 */
export class Subtask {
  /** @type {TaskNode} */
  #node;

  /** @type {Object} */
  #defaults;

  /** @type {Function|null} */
  #onChildAdded;

  /**
   * @param {TaskConfig|TaskNode} configOrNode
   * @param {Object} [defaults]
   * @param {Symbol} [internalMarker]
   * @param {Function} [onChildAdded]
   */
  constructor(configOrNode, defaults = {}, internalMarker = null, onChildAdded = null) {
    this.#defaults = defaults;
    this.#onChildAdded = onChildAdded;

    if (internalMarker === INTERNAL_MARKER && configOrNode instanceof TaskNode) {
      this.#node = configOrNode;
    } else {
      if (!configOrNode?.title) {
        throw new Error('Subtask title is required');
      }
      this.#node = new TaskNode(configOrNode, null, defaults);
    }
  }

  /**
   * Create a Subtask wrapper from an existing TaskNode
   * @param {TaskNode} node
   * @param {Object} [defaults]
   * @param {Function} [onChildAdded]
   * @returns {Subtask}
   * @internal
   */
  static _fromNode(node, defaults = {}, onChildAdded = null) {
    return new Subtask(node, defaults, INTERNAL_MARKER, onChildAdded);
  }

  /**
   * Add nested subtask(s)
   * @param {TaskConfig|TaskConfig[]} configOrArray
   * @returns {Subtask|Subtask[]|null}
   */
  add(configOrArray) {
    const configs = Array.isArray(configOrArray) ? configOrArray : [configOrArray];
    if (configs.length === 0) return null;

    const results = this.#node.add(configs);
    if (!results) return null;

    const nodes = Array.isArray(results) ? results : [results];
    const subtasks = nodes.map(n => {
      const subtask = Subtask._fromNode(n, this.#defaults, this.#onChildAdded);
      if (this.#onChildAdded) {
        this.#onChildAdded(n);
      }
      return subtask;
    });

    return configs.length === 1 ? subtasks[0] : subtasks;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // State Transition Methods (ora-like)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Mark subtask as succeeded/completed
   * @param {string} [message]
   * @returns {Subtask}
   */
  succeed(message) {
    this.#node.succeed(message);
    return this;
  }

  /**
   * Mark subtask as failed
   * @param {string} [message]
   * @returns {Subtask}
   */
  fail(message) {
    this.#node.fail(message);
    return this;
  }

  /**
   * Mark subtask with warning state
   * @param {string} [message]
   * @returns {Subtask}
   */
  warn(message) {
    this.#node.warn(message);
    return this;
  }

  /**
   * Mark subtask with info state
   * @param {string} [message]
   * @returns {Subtask}
   */
  info(message) {
    this.#node.info(message);
    return this;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Properties
  // ═══════════════════════════════════════════════════════════════════════════

  get title() { return this.#node.title; }
  set title(value) { this.#node.title = value; }

  get output() { return this.#node.output; }
  set output(value) { this.#node.output = value; }

  get spinnerColor() { return this.#node.spinnerColor; }
  set spinnerColor(value) { this.#node.spinnerColor = value; }

  get childCount() { return this.#node.childCount; }
  get config() { return this.#node.config; }

  get executed() {
    return ['completed', 'failed', 'skipped', 'warning', 'info'].includes(this.#node.state);
  }

  /** @internal */
  _getNode() { return this.#node; }
}