/**
 * Factory function to create a new Task
 * @param {TaskConfig} config
 * @returns {Task}
 */
export function createTask(config: TaskConfig): Task;
export type TaskConfig = any;
export type TaskState = any;
/**
 * @typedef {import('./types.mjs').TaskConfig} TaskConfig
 * @typedef {import('./types.mjs').TaskState} TaskState
 */
/**
 * Task - Main task container with dynamic subtask injection
 */
declare class Task {
    /**
     * @param {TaskConfig} config
     */
    constructor(config: TaskConfig);
    /**
     * Add subtask(s) to the main task
     * @param {TaskConfig|TaskConfig[]} configOrArray
     * @returns {Subtask|Subtask[]|null}
     */
    add(configOrArray: TaskConfig | TaskConfig[]): Subtask | Subtask[] | null;
    /**
     * Signal completion - no more subtasks will be added
     * Execution order: setup → task → subtasks → finally
     * @returns {Promise<void>}
     */
    complete(): Promise<void>;
    /**
     * Force shutdown the task
     * @param {string} [reason]
     */
    forceShutdown(reason?: string): void;
    /**
     * Subscribe to state changes
     * @param {(state: TaskState) => void} callback
     * @returns {() => void} Unsubscribe function
     */
    state$(callback: (state: TaskState) => void): () => void;
    /**
     * Subscribe to subtask additions
     * @param {(subtask: Subtask) => void} callback
     * @returns {() => void} Unsubscribe function
     */
    subtasks$(callback: (subtask: Subtask) => void): () => void;
    /** @returns {TaskState} */
    get state(): TaskState;
    /** @returns {string} */
    get title(): string;
    /** @returns {Function|undefined} */
    get task(): Function | undefined;
    /** @returns {Function|undefined} */
    get setup(): Function | undefined;
    /** @returns {Function|undefined} */
    get afterEach(): Function | undefined;
    /** @returns {Function|undefined} */
    get finally(): Function | undefined;
    /** @returns {Object} */
    get ctx(): any;
    /** @returns {Promise<void>} */
    get promise(): Promise<void>;
    /** @returns {number} */
    get subtaskCount(): number;
    /** @returns {number} */
    get pendingSubtaskCount(): number;
    /** @returns {boolean} */
    get isPending(): boolean;
    /** @returns {boolean} */
    get isProcessing(): boolean;
    /** @returns {boolean} */
    get isCompleted(): boolean;
    /** @returns {boolean} */
    get isFailed(): boolean;
    #private;
}
export {};
