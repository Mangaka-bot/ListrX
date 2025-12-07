/**
 * @typedef {import('./types.mjs').TaskState} TaskState
 * @typedef {import('./types.mjs').SpinnerColor} SpinnerColor
 * @typedef {import('./task-node.mjs').TaskNode} TaskNode
 */
/**
 * TaskRenderer - Renders task tree with animations
 */
export class TaskRenderer {
    /**
     * @param {TaskNode} root
     * @param {Object} options
     */
    constructor(root: TaskNode, options?: any);
    start(): void;
    stop(): void;
    /**
     * Render the task tree to a string (called by RendererManager)
     * @returns {string}
     */
    renderToString(): string;
    #private;
}
export type TaskState = import("./types.mjs").TaskState;
export type SpinnerColor = import("./types.mjs").SpinnerColor;
export type TaskNode = import("./task-node.mjs").TaskNode;
