/**
 * @typedef {import('./types.js').TaskState} TaskState
 * @typedef {import('./types.js').SpinnerColor} SpinnerColor
 * @typedef {import('./task-node.js').TaskNode} TaskNode
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
export type TaskState = import("./types.js").TaskState;
export type SpinnerColor = import("./types.js").SpinnerColor;
export type TaskNode = import("./task-node.js").TaskNode;
