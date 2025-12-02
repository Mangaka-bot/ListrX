/**
 * Factory function to create a new Task
 * @param {TaskConfig} config
 * @returns {Task}
 */
export function createTask(config: TaskConfig): Task;
/**
 * @typedef {'pending'|'processing'|'completed'|'failed'} TaskState
 */
/**
 * @typedef {Object} TaskConfig
 * @property {string} title - Display title (required)
 * @property {Object} [options] - Subtask execution options
 * @property {boolean} [options.concurrent] - Run subtasks concurrently
 * @property {boolean} [options.exitOnError] - Stop on first error
 * @property {(ctx: Object) => Promise<any>} [task] - Main task executor
 * @property {'before'|'after'} [mode] - Execution mode (default: 'before')
 * @property {number} [autoComplete] - Auto-complete after ms of idle (post-execution)
 * @property {number} [autoExecute] - Auto-execute after ms of no new subtasks
 * @property {(ctx: Object, task: Object) => Promise<void>} [rollback] - Rollback on failure
 * @property {(ctx: Object) => boolean|string} [skip] - Skip condition
 * @property {{tries: number, delay?: number}} [retry] - Retry configuration
 * @property {boolean} [showTimer] - Show execution time
 * @property {number} [batchDebounceMs] - Batch debounce time
 * @property {Object} [defaultSubtaskOptions] - Default options for subtasks
 * @property {Object} [rendererOptions] - Listr2 renderer options
 */
/**
 * Subtask class - represents a subtask that can have nested children
 */
export class Subtask {
    /**
     * @param {TaskConfig} config
     * @param {Object} [defaults]
     */
    constructor(config: TaskConfig, defaults?: any);
    /**
     * Add nested subtask(s)
     * @param {TaskConfig|TaskConfig[]} configOrArray
     * @returns {Subtask|Subtask[]}
     */
    add(configOrArray: TaskConfig | TaskConfig[]): Subtask | Subtask[];
    /** @returns {string} */
    get title(): string;
    /** @returns {number} */
    get childCount(): number;
    /** @returns {TaskConfig} */
    get config(): TaskConfig;
    /** @returns {boolean} */
    get executed(): boolean;
    /**
     * Mark as executed (internal)
     * @internal
     */
    _markExecuted(): void;
    /**
     * Convert to Listr task definition (internal)
     * @returns {Object}
     * @internal
     */
    _toListrTask(): any;
    #private;
}
/**
 * Task class - main task container with dynamic subtask injection
 */
export class Task {
    /**
     * @param {TaskConfig} config
     */
    constructor(config: TaskConfig);
    /**
     * Add subtask(s) to the task
     * @param {TaskConfig|TaskConfig[]} configOrArray
     * @returns {Subtask|Subtask[]|null}
     */
    add(configOrArray: TaskConfig | TaskConfig[]): Subtask | Subtask[] | null;
    /**
     * Signal completion - no more subtasks will be added
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
    /** @returns {number} */
    get subtaskCount(): number;
    /** @returns {number} */
    get pendingSubtaskCount(): number;
    /** @returns {string} */
    get title(): string;
    /** @returns {'before'|'after'} */
    get mode(): "before" | "after";
    /** @returns {Function|undefined} */
    get task(): Function | undefined;
    /** @returns {Object} */
    get ctx(): any;
    /** @returns {Promise<void>} */
    get promise(): Promise<void>;
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
export type TaskState = "pending" | "processing" | "completed" | "failed";
export type TaskConfig = {
    /**
     * - Display title (required)
     */
    title: string;
    /**
     * - Subtask execution options
     */
    options?: {
        concurrent?: boolean;
        exitOnError?: boolean;
    };
    /**
     * - Main task executor
     */
    task?: (ctx: any) => Promise<any>;
    /**
     * - Execution mode (default: 'before')
     */
    mode?: "before" | "after";
    /**
     * - Auto-complete after ms of idle (post-execution)
     */
    autoComplete?: number;
    /**
     * - Auto-execute after ms of no new subtasks
     */
    autoExecute?: number;
    /**
     * - Rollback on failure
     */
    rollback?: (ctx: any, task: any) => Promise<void>;
    /**
     * - Skip condition
     */
    skip?: (ctx: any) => boolean | string;
    /**
     * - Retry configuration
     */
    retry?: {
        tries: number;
        delay?: number;
    };
    /**
     * - Show execution time
     */
    showTimer?: boolean;
    /**
     * - Batch debounce time
     */
    batchDebounceMs?: number;
    /**
     * - Default options for subtasks
     */
    defaultSubtaskOptions?: any;
    /**
     * - Listr2 renderer options
     */
    rendererOptions?: any;
};
