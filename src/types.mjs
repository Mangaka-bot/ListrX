
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

// Re-export for documentation purposes
export const Types = {};