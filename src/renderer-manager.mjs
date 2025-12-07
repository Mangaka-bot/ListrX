import logUpdate from 'log-update';
import { SPINNER_FRAMES, SPINNER_INTERVAL } from './constants.mjs';

/**
 * Global Renderer Manager - Singleton that coordinates all active renderers
 */
export class RendererManager {
  /** @type {RendererManager|null} */
  static #instance = null;

  /** @type {Set<import('./task-renderer.mjs').TaskRenderer|import('./loader.mjs').Loader>} */
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

  /**
   * Get the singleton instance
   * @returns {RendererManager}
   */
  static getInstance() {
    if (!RendererManager.#instance) {
      RendererManager.#instance = new RendererManager();
    }
    return RendererManager.#instance;
  }

  /**
   * Register a renderer to be managed
   * @param {import('./task-renderer.mjs').TaskRenderer|import('./loader.mjs').Loader} renderer
   */
  register(renderer) {
    const wasEmpty = this.#activeRenderers.size === 0;
    this.#activeRenderers.add(renderer);

    if (wasEmpty) {
      this.#startManaging();
    }

    this.scheduleRender();
  }

  /**
   * Unregister a renderer
   * @param {import('./task-renderer.mjs').TaskRenderer|import('./loader.mjs').Loader} renderer
   */
  unregister(renderer) {
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
    if (this.#renderScheduled || this.#activeRenderers.size === 0) return;
    this.#renderScheduled = true;

    setImmediate(() => {
      this.#renderScheduled = false;
      this.#render();
    });
  }

  /**
   * Start managing output
   */
  #startManaging() {
    if (this.#intercepted) return;

    this.#interceptConsole();
    this.#interceptStreams();
    this.#intercepted = true;

    this.#spinnerInterval = setInterval(() => {
      this.#spinnerIndex = (this.#spinnerIndex + 1) % SPINNER_FRAMES.length;
      this.#render();
    }, SPINNER_INTERVAL);
  }

  /**
   * Stop managing output
   */
  #stopManaging() {
    this.#flushLogBuffer();

    if (this.#spinnerInterval) {
      clearInterval(this.#spinnerInterval);
      this.#spinnerInterval = null;
    }

    if (this.#intercepted) {
      this.#restoreConsole();
      this.#intercepted = false;
      logUpdate.done();
    }
  }

  /**
   * Render all active renderers
   */
  #render() {
    if (this.#activeRenderers.size === 0) return;

    this.#flushLogBuffer();

    const outputs = [];
    for (const renderer of this.#activeRenderers) {
      const output = renderer.renderToString();
      if (output) outputs.push(output);
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
      this.#originalConsole[method] = console[method].bind(console);

      console[method] = (...args) => {
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
      if (this.#isInternalWrite) {
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
      if (this.#isInternalWrite) {
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
   * Restore original console methods and streams
   */
  #restoreConsole() {
    Object.entries(this.#originalConsole).forEach(([method, fn]) => {
      if (fn) console[method] = fn;
    });
    this.#originalConsole = {};

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

    this.#internalWrite(() => logUpdate.clear());

    for (const { method, args, stream } of this.#logBuffer) {
      this.#internalWrite(() => {
        if (method === 'raw') {
          const writer = stream === 'stderr' ? this.#originalStderrWrite : this.#originalStdoutWrite;
          if (writer) {
            let str = args[0];
            if (!str.endsWith('\n')) str += '\n';
            writer(str);
          }
        } else {
          this.#originalConsole[method]?.(...args);
        }
      });
    }

    this.#logBuffer = [];
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