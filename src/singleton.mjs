import { DynamicTaskQueue } from './task-queue.mjs';

/** @type {DynamicTaskQueue|null} */
let singletonInstance = null;

/** @type {Object|null} */
let singletonOptions = null;

/**
 * Get or create the singleton queue instance
 * @param {Object} [options] - Queue options (only used on first call)
 * @returns {DynamicTaskQueue}
 */
export function getQueue(options = {}) {
  if (!singletonInstance) {
    singletonOptions = options;
    singletonInstance = new DynamicTaskQueue(options);
  }
  return singletonInstance;
}

/**
 * Reset the singleton instance (useful for testing)
 * @returns {Promise<void>}
 */
export async function resetQueue() {
  if (singletonInstance) {
    if (!singletonInstance.isCompleted) {
      await singletonInstance.complete();
    }
    singletonInstance = null;
    singletonOptions = null;
  }
}

/**
 * Shorthand for getQueue().add()
 * @param {string} title - Task title
 * @param {Function} taskFn - Task function
 * @returns {Promise<any>}
 */
export function addTask(title, taskFn) {
  return getQueue().add(title, taskFn);
}