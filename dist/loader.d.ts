/**
 * Factory function to create a loader (ora-like spinner)
 * @param {string} [title='']
 * @returns {Loader}
 */
export function loader(title?: string): Loader;
/**
 * @typedef {import('./types.js').SpinnerColor} SpinnerColor
 * @typedef {import('./types.js').TaskState} TaskState
 */
/**
 * Loader - Simple spinner similar to ora
 */
export class Loader {
    /**
     * @param {string} [title='']
     */
    constructor(title?: string);
    /**
     * Start the spinner
     * @param {string} [title]
     * @returns {Loader}
     */
    start(title?: string): Loader;
    /**
     * Stop the spinner without a final state
     * @returns {Loader}
     */
    stop(): Loader;
    /**
     * Stop with success state
     * @param {string} [text]
     * @returns {Loader}
     */
    succeed(text?: string): Loader;
    /**
     * Stop with failure state
     * @param {string} [text]
     * @returns {Loader}
     */
    fail(text?: string): Loader;
    /**
     * Stop with warning state
     * @param {string} [text]
     * @returns {Loader}
     */
    warn(text?: string): Loader;
    /**
     * Stop with info state
     * @param {string} [text]
     * @returns {Loader}
     */
    info(text?: string): Loader;
    set title(value: string);
    get title(): string;
    set text(value: string);
    get text(): string;
    set color(value: import("./types.js").SpinnerColor);
    get color(): import("./types.js").SpinnerColor;
    get isSpinning(): boolean;
    /**
     * Render to string (called by RendererManager)
     * @returns {string}
     */
    renderToString(): string;
    #private;
}
export type SpinnerColor = import("./types.js").SpinnerColor;
export type TaskState = import("./types.js").TaskState;
