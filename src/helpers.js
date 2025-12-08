import { COLOR_MAP } from './constants.js'
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
 * @param {import('./types.js').SpinnerColor} color
 * @returns {Function}
 */
export const getChalkColor = (color) => COLOR_MAP[color] || COLOR_MAP.cyan;