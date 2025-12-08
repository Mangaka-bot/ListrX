import chalk from 'chalk';
import { RendererManager } from './renderer-manager.js';
import { getChalkColor } from './helpers.js';

/**
 * @typedef {import('./types.js').SpinnerColor} SpinnerColor
 * @typedef {import('./types.js').TaskState} TaskState
 */

/**
 * Loader - Simple spinner similar to ora
 */
export class Loader {
  /** @type {string} */
  #title;

  /** @type {SpinnerColor} */
  #color = 'cyan';

  /** @type {boolean} */
  #isActive = false;

  /** @type {TaskState} */
  #finalState = null;

  /** @type {string} */
  #finalText = '';

  /** @type {RendererManager|null} */
  #manager = null;

  /**
   * @param {string} [title='']
   */
  constructor(title = '') {
    this.#title = title;
  }

  /**
   * Start the spinner
   * @param {string} [title]
   * @returns {Loader}
   */
  start(title) {
    if (title !== undefined) {
      this.#title = title;
    }
    
    if (this.#isActive) return this;
    
    this.#isActive = true;
    this.#finalState = null;
    this.#manager = RendererManager.getInstance();
    this.#manager.register(this);
    
    return this;
  }

  /**
   * Stop the spinner without a final state
   * @returns {Loader}
   */
  stop() {
    if (!this.#isActive) return this;
    
    this.#isActive = false;
    
    if (this.#manager) {
      this.#manager.unregister(this);
      this.#manager = null;
    }
    
    return this;
  }

  /**
   * Stop with success state
   * @param {string} [text]
   * @returns {Loader}
   */
  succeed(text) {
    this.#finalState = 'completed';
    this.#finalText = text !== undefined ? text : this.#title;
    this.#persistAndStop();
    return this;
  }

  /**
   * Stop with failure state
   * @param {string} [text]
   * @returns {Loader}
   */
  fail(text) {
    this.#finalState = 'failed';
    this.#finalText = text !== undefined ? text : this.#title;
    this.#persistAndStop();
    return this;
  }

  /**
   * Stop with warning state
   * @param {string} [text]
   * @returns {Loader}
   */
  warn(text) {
    this.#finalState = 'warning';
    this.#finalText = text !== undefined ? text : this.#title;
    this.#persistAndStop();
    return this;
  }

  /**
   * Stop with info state
   * @param {string} [text]
   * @returns {Loader}
   */
  info(text) {
    this.#finalState = 'info';
    this.#finalText = text !== undefined ? text : this.#title;
    this.#persistAndStop();
    return this;
  }

  /**
   * Persist final state and stop
   */
  #persistAndStop() {
    if (!this.#isActive) {
      console.log(this.#getFinalLine());
      return;
    }

    this.#isActive = false;
    
    if (this.#manager) {
      this.#manager.scheduleRender();
      
      setTimeout(() => {
        console.log(this.#getFinalLine());
        this.#manager?.unregister(this);
        this.#manager = null;
        this.#finalState = null;
      }, 20);
    }
  }

  /**
   * Get the final line with icon
   * @returns {string}
   */
  #getFinalLine() {
    const icon = this.#getStateIcon(this.#finalState);
    const coloredText = this.#colorText(this.#finalText, this.#finalState);
    return `${icon} ${coloredText}`;
  }

  /**
   * Get icon for state
   * @param {TaskState} state
   * @returns {string}
   */
  #getStateIcon(state) {
    switch (state) {
      case 'completed': return chalk.green('✔');
      case 'failed': return chalk.red('✖');
      case 'warning': return chalk.yellow('⚠');
      case 'info': return chalk.blue('ℹ');
      default: return chalk.gray('○');
    }
  }

  /**
   * Color text based on state
   * @param {string} text
   * @param {TaskState} state
   * @returns {string}
   */
  #colorText(text, state) {
    switch (state) {
      case 'completed': return chalk.white(text);
      case 'failed': return chalk.red(text);
      case 'warning': return chalk.yellow(text);
      case 'info': return chalk.blue(text);
      default: return text;
    }
  }

  // Getters and Setters

  get title() { return this.#title; }
  set title(value) {
    this.#title = value;
    if (this.#manager) {
      this.#manager.scheduleRender();
    }
  }

  get text() { return this.#title; }
  set text(value) {
    this.#title = value;
    if (this.#manager) {
      this.#manager.scheduleRender();
    }
  }

  get color() { return this.#color; }
  set color(value) {
    this.#color = value;
    if (this.#manager) {
      this.#manager.scheduleRender();
    }
  }

  get isSpinning() { return this.#isActive; }

  /**
   * Render to string (called by RendererManager)
   * @returns {string}
   */
  renderToString() {
    if (this.#finalState) {
      return '';
    }
    
    const manager = RendererManager.getInstance();
    const frame = manager.getSpinnerFrame();
    const colorFn = getChalkColor(this.#color);
    const spinner = colorFn(frame);
    const title = chalk.white(this.#title);
    
    return `${spinner} ${title}`;
  }
}

/**
 * Factory function to create a loader (ora-like spinner)
 * @param {string} [title='']
 * @returns {Loader}
 */
export function loader(title = '') {
  return new Loader(title);
}