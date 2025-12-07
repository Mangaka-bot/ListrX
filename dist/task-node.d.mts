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
    static "__#private@#idCounter": number;
    /**
     * @param {TaskConfig} config
     * @param {TaskNode|null} parent
     * @param {Object} defaults
     */
    constructor(config: TaskConfig, parent?: TaskNode | null, defaults?: any);
    /** @returns {string} */
    get id(): string;
    /** @returns {number} */
    get level(): number;
    /** @returns {TaskNode|null} */
    get parent(): TaskNode | null;
    /** @returns {TaskConfig} */
    get config(): TaskConfig;
    /** @returns {Error|null} */
    get error(): Error | null;
    /** @returns {TaskNode[]} */
    get children(): TaskNode[];
    /** @returns {number} */
    get childCount(): number;
    /** @returns {Object} */
    get defaults(): any;
    /** @returns {boolean} */
    get executed(): boolean;
    /** @returns {boolean} */
    get setupExecuted(): boolean;
    /** @param {string} value */
    set title(value: string);
    /** @returns {string} */
    get title(): string;
    /** @param {string} value */
    set output(value: string);
    /** @returns {string} */
    get output(): string;
    /** @param {SpinnerColor} value */
    set spinnerColor(value: SpinnerColor);
    /** @returns {SpinnerColor} */
    get spinnerColor(): SpinnerColor;
    /** @returns {TaskState} */
    get state(): TaskState;
    /** @returns {number|null} */
    get duration(): number | null;
    /** @returns {import('rxjs').Observable<TaskState>} */
    get state$(): import("rxjs").Observable<TaskState>;
    /** @returns {import('rxjs').Observable<string>} */
    get title$(): import("rxjs").Observable<string>;
    /** @returns {import('rxjs').Observable<string>} */
    get output$(): import("rxjs").Observable<string>;
    /** @returns {import('rxjs').Observable<SpinnerColor>} */
    get spinnerColor$(): import("rxjs").Observable<SpinnerColor>;
    /** @returns {import('rxjs').Observable<TaskNode>} */
    get childAdded$(): import("rxjs").Observable<TaskNode>;
    /**
     * Combined observable for any changes in this node
     * @returns {import('rxjs').Observable<{state: TaskState, title: string, output: string, spinnerColor: SpinnerColor, node: TaskNode}>}
     */
    get changes$(): import("rxjs").Observable<{
        state: TaskState;
        title: string;
        output: string;
        spinnerColor: SpinnerColor;
        node: TaskNode;
    }>;
    /**
     * @param {TaskState} newState
     * @returns {void}
     */
    setState(newState: TaskState): void;
    /**
     * @param {Error} error
     * @returns {void}
     */
    setError(error: Error): void;
    /** @returns {void} */
    markExecuted(): void;
    /** @returns {void} */
    markSetupExecuted(): void;
    /**
     * Mark task as succeeded/completed
     * @param {string} [message] - Optional message to set as title
     * @returns {TaskNode}
     */
    succeed(message?: string): TaskNode;
    /**
     * Mark task as failed
     * @param {string} [message] - Optional message to set as title
     * @returns {TaskNode}
     */
    fail(message?: string): TaskNode;
    /**
     * Mark task with warning state
     * @param {string} [message] - Optional message to set as title
     * @returns {TaskNode}
     */
    warn(message?: string): TaskNode;
    /**
     * Mark task with info state
     * @param {string} [message] - Optional message to set as title
     * @returns {TaskNode}
     */
    info(message?: string): TaskNode;
    /**
     * Add child task(s)
     * @param {TaskConfig|TaskConfig[]} configOrArray
     * @returns {TaskNode|TaskNode[]|null}
     */
    add(configOrArray: TaskConfig | TaskConfig[]): TaskNode | TaskNode[] | null;
    /**
     * Get all descendant nodes recursively
     * @returns {TaskNode[]}
     */
    getAllDescendants(): TaskNode[];
    /**
     * Cleanup observables
     * @returns {void}
     */
    dispose(): void;
    #private;
}
export type TaskConfig = import("./types.mjs").TaskConfig;
export type TaskState = import("./types.mjs").TaskState;
export type SpinnerColor = import("./types.mjs").SpinnerColor;
