/**
 * Global Renderer Manager - Singleton that coordinates all active renderers
 */
export class RendererManager {
    /** @type {RendererManager|null} */
    static "__#private@#instance": RendererManager | null;
    /**
     * Get the singleton instance
     * @returns {RendererManager}
     */
    static getInstance(): RendererManager;
    /**
     * Register a renderer to be managed
     * @param {import('./task-renderer.mjs').TaskRenderer|import('./loader.mjs').Loader} renderer
     */
    register(renderer: import("./task-renderer.mjs").TaskRenderer | import("./loader.mjs").Loader): void;
    /**
     * Unregister a renderer
     * @param {import('./task-renderer.mjs').TaskRenderer|import('./loader.mjs').Loader} renderer
     */
    unregister(renderer: import("./task-renderer.mjs").TaskRenderer | import("./loader.mjs").Loader): void;
    /**
     * Get current spinner frame
     * @returns {string}
     */
    getSpinnerFrame(): string;
    /**
     * Get current spinner index
     * @returns {number}
     */
    getSpinnerIndex(): number;
    /**
     * Schedule a render on next tick (batches multiple requests)
     */
    scheduleRender(): void;
    #private;
}
