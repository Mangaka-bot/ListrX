/**
 * Global Renderer Manager - Singleton that coordinates all active renderers
 */
export class RendererManager {
    /** @type {RendererManager|null} */
    static "__#private@#instance": RendererManager | null;
    /** @type {WeakRef<RendererManager>|null} */
    static "__#private@#weakInstance": WeakRef<RendererManager> | null;
    /** @type {FinalizationRegistry|null} */
    static "__#private@#registry": FinalizationRegistry | null;
    /**
     * Get the singleton instance
     * Creates a new instance if none exists or previous was disposed
     * @returns {RendererManager}
     */
    static getInstance(): RendererManager;
    /**
     * Check if manager is currently active
     * @returns {boolean}
     */
    static isActive(): boolean;
    /**
     * Get count of active renderers
     * @returns {number}
     */
    static getActiveCount(): number;
    /**
     * Force reset the singleton instance
     * Useful for testing or when you need a fresh start
     * @param {boolean} [force=false] - Force reset even if renderers are active
     */
    static reset(force?: boolean): void;
    /**
     * Register a renderer to be managed
     * @param {import('./task-renderer.js').TaskRenderer|import('./loader.js').Loader} renderer
     */
    register(renderer: import("./task-renderer.js").TaskRenderer | import("./loader.js").Loader): void;
    /**
     * Unregister a renderer
     * @param {import('./task-renderer.js').TaskRenderer|import('./loader.js').Loader} renderer
     */
    unregister(renderer: import("./task-renderer.js").TaskRenderer | import("./loader.js").Loader): void;
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
    /**
     * Dispose of this manager instance
     * Cleans up all resources and restores original console/stream behavior
     */
    dispose(): void;
    /**
     * Check if this instance has been disposed
     * @returns {boolean}
     */
    get isDisposed(): boolean;
    #private;
}
