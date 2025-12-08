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
 * @property {(ctx: Object, task: TaskNode) => Promise<any>} [setup] - Runs first, initialization
 * @property {(ctx: Object, task: TaskNode) => Promise<any>} [task] - Runs after setup, before subtasks
 * @property {(ctx: Object, completedSubtask: TaskNode, mainTask: TaskNode) => Promise<void>} [afterEach] - Runs after each subtask/main task completes
 * @property {(ctx: Object, task: TaskNode) => Promise<void>} [finally] - Runs at the end after all subtasks
 * @property {Object} [options] - Subtask execution options
 * @property {boolean} [options.concurrent] - Run subtasks concurrently
 * @property {boolean} [options.exitOnError] - Stop on first error
 * @property {number} [autoExecute] - Execute task after ms of no new subtasks (task stays open, can run multiple times)
 * @property {number} [autoComplete] - Complete after ms of idle (runs finally, closes task)
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
     * - Runs first, initialization
     */
    setup?: (ctx: any, task: TaskNode) => Promise<any>;
    /**
     * - Runs after setup, before subtasks
     */
    task?: (ctx: any, task: TaskNode) => Promise<any>;
    /**
     * - Runs after each subtask/main task completes
     */
    afterEach?: (ctx: any, completedSubtask: TaskNode, mainTask: TaskNode) => Promise<void>;
    /**
     * - Runs at the end after all subtasks
     */
    finally?: (ctx: any, task: TaskNode) => Promise<void>;
    /**
     * - Subtask execution options
     */
    options?: {
        concurrent?: boolean;
        exitOnError?: boolean;
    };
    /**
     * - Execute task after ms of no new subtasks (task stays open, can run multiple times)
     */
    autoExecute?: number;
    /**
     * - Complete after ms of idle (runs finally, closes task)
     */
    autoComplete?: number;
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
