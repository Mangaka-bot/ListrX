/**
 * Valid spinner colors
 * @typedef {'black'|'red'|'green'|'yellow'|'blue'|'magenta'|'cyan'|'white'|'gray'|'grey'|'redBright'|'greenBright'|'yellowBright'|'blueBright'|'magentaBright'|'cyanBright'|'whiteBright'} SpinnerColor
 */
/**
 * @typedef {'pending'|'processing'|'completed'|'failed'|'skipped'|'warning'|'info'} TaskState
 */
/**
 * @typedef {Object} TaskConfig
 * @property {string} title - Display title (required)
 * @property {(ctx: Object, task: TaskNode) => Promise<any>} [setup] - Setup function that runs first, before main task and subtasks
 * @property {(ctx: Object, task: TaskNode) => Promise<any>} [task] - Task executor
 * @property {Object} [options] - Subtask execution options
 * @property {boolean} [options.concurrent] - Run subtasks concurrently
 * @property {boolean} [options.exitOnError] - Stop on first error
 * @property {'before'|'after'} [mode] - Execution mode (default: 'before')
 * @property {number} [autoComplete] - Auto-complete after ms of idle
 * @property {number} [autoExecute] - Auto-execute after ms of no new subtasks
 * @property {(ctx: Object, task: TaskNode) => Promise<void>} [rollback] - Rollback on failure
 * @property {(ctx: Object) => boolean|string} [skip] - Skip condition
 * @property {{tries: number, delay?: number}} [retry] - Retry configuration
 * @property {boolean} [showTimer] - Show execution time
 * @property {number} [batchDebounceMs] - Batch debounce time
 * @property {Object} [defaultSubtaskOptions] - Default options for subtasks
 * @property {Object} [rendererOptions] - Renderer options
 * @property {'default'|'simple'|'silent'} [rendererOptions.renderer] - Renderer type
 * @property {SpinnerColor} [spinnerColor] - Spinner color
 */
export const Types: {};
/**
 * Valid spinner colors
 */
export type SpinnerColor = "black" | "red" | "green" | "yellow" | "blue" | "magenta" | "cyan" | "white" | "gray" | "grey" | "redBright" | "greenBright" | "yellowBright" | "blueBright" | "magentaBright" | "cyanBright" | "whiteBright";
export type TaskState = "pending" | "processing" | "completed" | "failed" | "skipped" | "warning" | "info";
export type TaskConfig = {
    /**
     * - Display title (required)
     */
    title: string;
    /**
     * - Setup function that runs first, before main task and subtasks
     */
    setup?: (ctx: any, task: TaskNode) => Promise<any>;
    /**
     * - Task executor
     */
    task?: (ctx: any, task: TaskNode) => Promise<any>;
    /**
     * - Subtask execution options
     */
    options?: {
        concurrent?: boolean;
        exitOnError?: boolean;
    };
    /**
     * - Execution mode (default: 'before')
     */
    mode?: "before" | "after";
    /**
     * - Auto-complete after ms of idle
     */
    autoComplete?: number;
    /**
     * - Auto-execute after ms of no new subtasks
     */
    autoExecute?: number;
    /**
     * - Rollback on failure
     */
    rollback?: (ctx: any, task: TaskNode) => Promise<void>;
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
     * - Renderer options
     */
    rendererOptions?: {
        renderer?: "default" | "simple" | "silent";
    };
    /**
     * - Spinner color
     */
    spinnerColor?: SpinnerColor;
};
