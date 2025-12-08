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

export const Types = {};