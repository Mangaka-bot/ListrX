/**
 * @typedef {import('./types.mjs').TaskConfig} TaskConfig
 */
/**
 * Subtask - Wrapper class for API compatibility
 */
export class Subtask {
    /**
     * Create a Subtask wrapper from an existing TaskNode
     * @param {TaskNode} node
     * @param {Object} [defaults]
     * @param {Function} [onChildAdded]
     * @returns {Subtask}
     * @internal
     */
    static _fromNode(node: TaskNode, defaults?: any, onChildAdded?: Function): Subtask;
    /**
     * @param {TaskConfig|TaskNode} configOrNode
     * @param {Object} [defaults]
     * @param {Symbol} [internalMarker]
     * @param {Function} [onChildAdded]
     */
    constructor(configOrNode: TaskConfig | TaskNode, defaults?: any, internalMarker?: Symbol, onChildAdded?: Function);
    /**
     * Add nested subtask(s)
     * @param {TaskConfig|TaskConfig[]} configOrArray
     * @returns {Subtask|Subtask[]|null}
     */
    add(configOrArray: TaskConfig | TaskConfig[]): Subtask | Subtask[] | null;
    /**
     * Mark subtask as succeeded/completed
     * @param {string} [message]
     * @returns {Subtask}
     */
    succeed(message?: string): Subtask;
    /**
     * Mark subtask as failed
     * @param {string} [message]
     * @returns {Subtask}
     */
    fail(message?: string): Subtask;
    /**
     * Mark subtask with warning state
     * @param {string} [message]
     * @returns {Subtask}
     */
    warn(message?: string): Subtask;
    /**
     * Mark subtask with info state
     * @param {string} [message]
     * @returns {Subtask}
     */
    info(message?: string): Subtask;
    set title(value: string);
    get title(): string;
    set output(value: string);
    get output(): string;
    set spinnerColor(value: import("./types.mjs").SpinnerColor);
    get spinnerColor(): import("./types.mjs").SpinnerColor;
    get childCount(): number;
    get config(): import("./types.mjs").TaskConfig;
    get executed(): boolean;
    /** @internal */
    _getNode(): TaskNode;
    #private;
}
export type TaskConfig = import("./types.mjs").TaskConfig;
import { TaskNode } from './task-node.mjs';
