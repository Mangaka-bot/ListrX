import chalk from 'chalk';

/**
 * Format duration for display
 * @param {number} ms
 * @returns {string}
 */
export const formatDuration = (ms) => {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const mins = Math.floor(ms / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  return `${mins}m ${secs}s`;
};

/**
 * Delay helper
 * @param {number} ms
 * @returns {Promise<void>}
 */
export const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Get chalk color function by name
 * @param {import('./types.mjs').SpinnerColor} color
 * @returns {Function}
 */
export const getChalkColor = (color) => {
  const colors = {
    black: chalk.black,
    red: chalk.red,
    green: chalk.green,
    yellow: chalk.yellow,
    blue: chalk.blue,
    magenta: chalk.magenta,
    cyan: chalk.cyan,
    white: chalk.white,
    gray: chalk.gray,
    grey: chalk.grey,
    redBright: chalk.redBright,
    greenBright: chalk.greenBright,
    yellowBright: chalk.yellowBright,
    blueBright: chalk.blueBright,
    magentaBright: chalk.magentaBright,
    cyanBright: chalk.cyanBright,
    whiteBright: chalk.whiteBright
  };
  return colors[color] || chalk.cyan;
};