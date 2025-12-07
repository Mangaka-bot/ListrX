import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import chalk from 'chalk';
import { RendererManager } from './renderer-manager.mjs';
import { formatDuration, getChalkColor } from './helpers.mjs';

/**
 * @typedef {import('./types.mjs').TaskState} TaskState
 * @typedef {import('./types.mjs').SpinnerColor} SpinnerColor
 * @typedef {import('./task-node.mjs').TaskNode} TaskNode
 */

/**
 * TaskRenderer - Renders task tree with animations
 */
export class TaskRenderer {
  /** @type {TaskNode} */
  #root;

  /** @type {Subject<void>} */
  #stop$ = new Subject();

  /** @type {boolean} */
  #isActive = false;

  /** @type {Object} */
  #options;

  /** @type {'default'|'simple'|'silent'} */
  #rendererType;

  /** @type {RendererManager|null} */
  #manager = null;

  /**
   * @param {TaskNode} root
   * @param {Object} options
   */
  constructor(root, options = {}) {
    this.#root = root;
    this.#options = {
      showSubtasks: true,
      collapseCompleted: false,
      ...options
    };
    this.#rendererType = options?.renderer || 'default';
  }

  start() {
    if (this.#isActive || this.#rendererType === 'silent') return;
    this.#isActive = true;

    if (this.#rendererType === 'default') {
      this.#manager = RendererManager.getInstance();
      this.#manager.register(this);
      this.#subscribeToChanges(this.#root);
    }

    this.#triggerRender();
  }

  #subscribeToChanges(node) {
    if (this.#rendererType !== 'default') return;

    node.changes$.pipe(
      takeUntil(this.#stop$)
    ).subscribe(() => {
      this.#triggerRender();
    });

    for (const child of node.children) {
      this.#subscribeToChanges(child);
    }

    node.childAdded$.pipe(
      takeUntil(this.#stop$)
    ).subscribe(newChild => {
      this.#subscribeToChanges(newChild);
      this.#triggerRender();
    });
  }

  #triggerRender() {
    if (this.#rendererType === 'silent') return;

    if (this.#rendererType === 'simple') {
      this.#renderSimple();
      return;
    }

    if (this.#manager) {
      this.#manager.scheduleRender();
    }
  }

  stop() {
    if (this.#rendererType === 'silent') return;

    if (!this.#isActive) {
      if (this.#rendererType === 'simple') {
        this.#renderSimple();
      }
      return;
    }

    this.#isActive = false;
    this.#stop$.next();
    this.#stop$.complete();

    if (this.#rendererType === 'default' && this.#manager) {
      this.#manager.scheduleRender();
      
      setTimeout(() => {
        this.#manager.unregister(this);
        this.#manager = null;
      }, 50);
    }
  }

  /**
   * Render the task tree to a string (called by RendererManager)
   * @returns {string}
   */
  renderToString() {
    return this.#renderNode(this.#root, '', true, true);
  }

  #renderSimple() {
    const lines = [];
    const traverse = (node, indent = '') => {
      const indicator = this.#getSimpleIndicator(node.state);
      lines.push(`${indent}${indicator} ${node.title}`);

      if (node.output && node.state === 'processing') {
        lines.push(`${indent}  → ${node.output}`);
      }

      for (const child of node.children) {
        traverse(child, indent + '  ');
      }
    };
    traverse(this.#root);
    console.log(lines.join('\n'));
  }

  #getSimpleIndicator(state) {
    switch (state) {
      case 'pending': return '○';
      case 'processing': return '●';
      case 'completed': return '✔';
      case 'failed': return '✖';
      case 'skipped': return '↓';
      case 'warning': return '⚠';
      case 'info': return 'ℹ';
      default: return '○';
    }
  }

  /**
   * @param {TaskNode} node
   * @param {string} prefix
   * @param {boolean} isLast
   * @param {boolean} isRoot
   * @returns {string}
   */
  #renderNode(node, prefix, isLast, isRoot) {
    const lines = [];

    const branch = isRoot ? '' : (isLast ? '└── ' : '├── ');
    const childPrefix = isRoot ? '' : prefix + (isLast ? '    ' : '│   ');

    const indicator = this.#getIndicator(node.state, node.spinnerColor);
    const coloredTitle = this.#colorTitle(node.title, node.state);

    let line = `${prefix}${branch}${indicator} ${coloredTitle}`;

    if (node.config.showTimer && node.duration !== null) {
      if (node.state === 'completed' || node.state === 'failed') {
        line += chalk.gray(` [${formatDuration(node.duration)}]`);
      } else if (node.state === 'processing') {
        line += chalk.dim(` [${formatDuration(node.duration)}]`);
      }
    }

    lines.push(line);

    if (node.output && (node.state === 'processing' || node.state === 'skipped')) {
      const outputLine = `${childPrefix}${chalk.gray('→')} ${chalk.dim(node.output)}`;
      lines.push(outputLine);
    }

    if (node.error && node.state === 'failed') {
      const errorLine = `${childPrefix}${chalk.red('✖')} ${chalk.red(node.error.message)}`;
      lines.push(errorLine);
    }

    if (this.#options.showSubtasks) {
      const children = node.children;
      children.forEach((child, index) => {
        const isLastChild = index === children.length - 1;
        lines.push(this.#renderNode(child, childPrefix, isLastChild, false));
      });
    }

    return lines.join('\n');
  }

  /**
   * @param {TaskState} state
   * @param {SpinnerColor} spinnerColor
   * @returns {string}
   */
  #getIndicator(state, spinnerColor = 'cyan') {
    const manager = RendererManager.getInstance();
    
    switch (state) {
      case 'pending':
        return chalk.gray('○');
      case 'processing':
        const colorFn = getChalkColor(spinnerColor);
        return colorFn(manager.getSpinnerFrame());
      case 'completed':
        return chalk.green('✔');
      case 'failed':
        return chalk.red('✖');
      case 'skipped':
        return chalk.yellow('↓');
      case 'warning':
        return chalk.yellow('⚠');
      case 'info':
        return chalk.blue('ℹ');
      default:
        return chalk.gray('○');
    }
  }

  /**
   * @param {string} title
   * @param {TaskState} state
   * @returns {string}
   */
  #colorTitle(title, state) {
    switch (state) {
      case 'pending':
        return chalk.gray(title);
      case 'processing':
        return chalk.white.bold(title);
      case 'completed':
        return chalk.white(title);
      case 'failed':
        return chalk.red(title);
      case 'skipped':
        return chalk.yellow.dim(title);
      case 'warning':
        return chalk.yellow(title);
      case 'info':
        return chalk.blue(title);
      default:
        return title;
    }
  }
}