import logUpdate from 'log-update';
import { SPINNER_FRAMES, SPINNER_INTERVAL } from './constants.js';

/**
 * Global Renderer Manager - Singleton that coordinates all active renderers
 */
export class RendererManager {
  /** @type {RendererManager|null} */
  static #instance = null;

  /** @type {WeakRef<RendererManager>|null} */
  static #weakInstance = null;

  /** @type {Set<import('./task-renderer.js').TaskRenderer|import('./loader.js').Loader>} */
  #activeRenderers = new Set();

  /** @type {Object<string, Function>} */
  #originalConsole = {};

  /** @type {Function|null} */
  #originalStdoutWrite = null;

  /** @type {Function|null} */
  #originalStderrWrite = null;

  /** @type {Array<{method: string, args: any[], stream: 'stdout'|'stderr'}>} */
  #logBuffer = [];

  /** @type {boolean} */
  #isInternalWrite = false;

  /** @type {boolean} */
  #intercepted = false;

  /** @type {boolean} */
  #renderScheduled = false;

  /** @type {number} */
  #spinnerIndex = 0;

  /** @type {NodeJS.Timeout|null} */
  #spinnerInterval = null;

  /** @type {boolean} */
  #isDisposed = false;

  /** @type {FinalizationRegistry|null} */
  static #registry = null;

  /**
   * Private constructor - use getInstance()
   */
  constructor() {
    // Prevent direct instantiation
    if (RendererManager.#instance && !RendererManager.#instance.#isDisposed) {
      throw new Error('Use RendererManager.getInstance() instead');
    }
  }

  /**
   * Get the singleton instance
   * Creates a new instance if none exists or previous was disposed
   * @returns {RendererManager}
   */
  static getInstance() {
    // Check if existing instance is still valid
    if (RendererManager.#instance && !RendererManager.#instance.#isDisposed) {
      return RendererManager.#instance;
    }

    // Create new instance
    RendererManager.#instance = new RendererManager();
    
    // Set up finalization registry for automatic cleanup
    if (typeof FinalizationRegistry !== 'undefined' && !RendererManager.#registry) {
      RendererManager.#registry = new FinalizationRegistry(() => {
        // Instance was garbage collected, clean up static reference
        RendererManager.#instance = null;
      });
    }

    return RendererManager.#instance;
  }

  /**
   * Check if manager is currently active
   * @returns {boolean}
   */
  static isActive() {
    return RendererManager.#instance !== null && 
           !RendererManager.#instance.#isDisposed &&
           RendererManager.#instance.#activeRenderers.size > 0;
  }

  /**
   * Get count of active renderers
   * @returns {number}
   */
  static getActiveCount() {
    if (!RendererManager.#instance || RendererManager.#instance.#isDisposed) {
      return 0;
    }
    return RendererManager.#instance.#activeRenderers.size;
  }

  /**
   * Force reset the singleton instance
   * Useful for testing or when you need a fresh start
   * @param {boolean} [force=false] - Force reset even if renderers are active
   */
  static reset(force = false) {
    if (!RendererManager.#instance) return;

    const instance = RendererManager.#instance;
    
    if (!force && instance.#activeRenderers.size > 0) {
      console.warn(
        `RendererManager: Cannot reset with ${instance.#activeRenderers.size} active renderers. ` +
        'Use reset(true) to force.'
      );
      return;
    }

    instance.dispose();
    RendererManager.#instance = null;
  }

  /**
   * Register a renderer to be managed
   * @param {import('./task-renderer.js').TaskRenderer|import('./loader.js').Loader} renderer
   */
  register(renderer) {
    if (this.#isDisposed) {
      throw new Error('RendererManager has been disposed');
    }

    const wasEmpty = this.#activeRenderers.size === 0;
    this.#activeRenderers.add(renderer);

    if (wasEmpty) {
      this.#startManaging();
    }

    this.scheduleRender();
  }

  /**
   * Unregister a renderer
   * @param {import('./task-renderer.js').TaskRenderer|import('./loader.js').Loader} renderer
   */
  unregister(renderer) {
    if (this.#isDisposed) return;

    this.#activeRenderers.delete(renderer);

    if (this.#activeRenderers.size === 0) {
      this.#stopManaging();
    } else {
      this.scheduleRender();
    }
  }

  /**
   * Get current spinner frame
   * @returns {string}
   */
  getSpinnerFrame() {
    return SPINNER_FRAMES[this.#spinnerIndex];
  }

  /**
   * Get current spinner index
   * @returns {number}
   */
  getSpinnerIndex() {
    return this.#spinnerIndex;
  }

  /**
   * Schedule a render on next tick (batches multiple requests)
   */
  scheduleRender() {
    if (this.#isDisposed || this.#renderScheduled || this.#activeRenderers.size === 0) {
      return;
    }
    
    this.#renderScheduled = true;

    setImmediate(() => {
      if (this.#isDisposed) return;
      this.#renderScheduled = false;
      this.#render();
    });
  }

  /**
   * Dispose of this manager instance
   * Cleans up all resources and restores original console/stream behavior
   */
  dispose() {
    if (this.#isDisposed) return;
    
    this.#isDisposed = true;
    this.#stopManaging();
    this.#activeRenderers.clear();
    this.#logBuffer = [];
  }

  /**
   * Check if this instance has been disposed
   * @returns {boolean}
   */
  get isDisposed() {
    return this.#isDisposed;
  }

  /**
   * Start managing output
   */
  #startManaging() {
    if (this.#intercepted || this.#isDisposed) return;

    this.#interceptConsole();
    this.#interceptStreams();
    this.#intercepted = true;

    this.#spinnerInterval = setInterval(() => {
      if (this.#isDisposed) {
        this.#stopManaging();
        return;
      }
      this.#spinnerIndex = (this.#spinnerIndex + 1) % SPINNER_FRAMES.length;
      this.#render();
    }, SPINNER_INTERVAL);

    // Prevent interval from keeping process alive
    if (this.#spinnerInterval.unref) {
      this.#spinnerInterval.unref();
    }
  }

  /**
   * Stop managing output
   */
  #stopManaging() {
    // Flush any remaining buffered logs
    this.#flushLogBuffer();

    // Clear spinner interval
    if (this.#spinnerInterval) {
      clearInterval(this.#spinnerInterval);
      this.#spinnerInterval = null;
    }

    // Restore console and streams
    if (this.#intercepted) {
      this.#restoreConsole();
      this.#restoreStreams();
      this.#intercepted = false;
      
      try {
        logUpdate.done();
      } catch (e) {
        // logUpdate may throw if stream is already closed
      }
    }

    // Reset spinner index
    this.#spinnerIndex = 0;
  }

  /**
   * Render all active renderers
   */
  #render() {
    if (this.#isDisposed || this.#activeRenderers.size === 0) return;

    this.#flushLogBuffer();

    const outputs = [];
    for (const renderer of this.#activeRenderers) {
      try {
        const output = renderer.renderToString();
        if (output) outputs.push(output);
      } catch (e) {
        // Skip failed renders
      }
    }

    if (outputs.length > 0) {
      this.#internalWrite(() => {
        logUpdate(outputs.join('\n\n'));
      });
    }
  }

  /**
   * Intercept console methods
   */
  #interceptConsole() {
    const methodToStream = {
      log: 'stdout',
      info: 'stdout',
      debug: 'stdout',
      warn: 'stderr',
      error: 'stderr'
    };

    Object.entries(methodToStream).forEach(([method, stream]) => {
      // Store original with proper binding
      this.#originalConsole[method] = console[method].bind(console);

      // Replace with intercepting version
      console[method] = (...args) => {
        if (this.#isDisposed) {
          // If disposed, use original
          this.#originalConsole[method]?.(...args);
          return;
        }
        
        this.#logBuffer.push({ method, args, stream });
        this.scheduleRender();
      };
    });
  }

  /**
   * Intercept raw stream writes
   */
  #interceptStreams() {
    this.#originalStdoutWrite = process.stdout.write.bind(process.stdout);
    this.#originalStderrWrite = process.stderr.write.bind(process.stderr);

    process.stdout.write = (chunk, encoding, callback) => {
      if (this.#isInternalWrite || this.#isDisposed) {
        return this.#originalStdoutWrite(chunk, encoding, callback);
      }

      const str = typeof chunk === 'string' ? chunk : chunk.toString(encoding || 'utf8');
      if (str.trim()) {
        this.#logBuffer.push({ method: 'raw', args: [str], stream: 'stdout' });
        this.scheduleRender();
      }

      if (typeof callback === 'function') callback();
      return true;
    };

    process.stderr.write = (chunk, encoding, callback) => {
      if (this.#isInternalWrite || this.#isDisposed) {
        return this.#originalStderrWrite(chunk, encoding, callback);
      }

      const str = typeof chunk === 'string' ? chunk : chunk.toString(encoding || 'utf8');
      if (str.trim()) {
        this.#logBuffer.push({ method: 'raw', args: [str], stream: 'stderr' });
        this.scheduleRender();
      }

      if (typeof callback === 'function') callback();
      return true;
    };
  }

  /**
   * Restore original console methods
   */
  #restoreConsole() {
    Object.entries(this.#originalConsole).forEach(([method, fn]) => {
      if (fn) {
        console[method] = fn;
      }
    });
    this.#originalConsole = {};
  }

  /**
   * Restore original stream writes
   */
  #restoreStreams() {
    if (this.#originalStdoutWrite) {
      process.stdout.write = this.#originalStdoutWrite;
      this.#originalStdoutWrite = null;
    }
    if (this.#originalStderrWrite) {
      process.stderr.write = this.#originalStderrWrite;
      this.#originalStderrWrite = null;
    }
  }

  /**
   * Flush buffered logs
   */
  #flushLogBuffer() {
    if (this.#logBuffer.length === 0) return;

    // Take snapshot and clear buffer atomically
    const buffer = this.#logBuffer;
    this.#logBuffer = [];

    this.#internalWrite(() => {
      try {
        logUpdate.clear();
      } catch (e) {
        // Ignore if logUpdate fails
      }
    });

    for (const { method, args, stream } of buffer) {
      this.#internalWrite(() => {
        if (method === 'raw') {
          const writer = stream === 'stderr' 
            ? this.#originalStderrWrite 
            : this.#originalStdoutWrite;
          
          if (writer) {
            let str = args[0];
            if (!str.endsWith('\n')) str += '\n';
            try {
              writer(str);
            } catch (e) {
              // Stream may be closed
            }
          }
        } else if (this.#originalConsole[method]) {
          try {
            this.#originalConsole[method](...args);
          } catch (e) {
            // Console method may fail
          }
        }
      });
    }
  }

  /**
   * Execute a write operation marked as internal
   * @param {Function} fn
   */
  #internalWrite(fn) {
    this.#isInternalWrite = true;
    try {
      fn();
    } finally {
      this.#isInternalWrite = false;
    }
  }
}

// Cleanup on process exit
if (typeof process !== 'undefined') {
  const cleanup = () => {
    RendererManager.reset(true);
  };

  process.once('exit', cleanup);
  process.once('SIGINT', () => {
    cleanup();
    process.exit(130);
  });
  process.once('SIGTERM', () => {
    cleanup();
    process.exit(143);
  });
}