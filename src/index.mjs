import { DynamicTaskQueue } from './task-queue.mjs';

/**
 * Factory function to create a new independent queue
 * @param {Object} [options] - Queue configuration options
 * @returns {DynamicTaskQueue}
 */
export function createQueue(options = {}) {
  return new DynamicTaskQueue(options);
}

/**
 * Helper to create a subtask definition
 * @param {string} title - Subtask title
 * @param {Function} task - Task function
 * @param {Object} [options] - Additional options
 * @returns {SubtaskDefinition}
 */
export function subtask(title, task, options = {}) {
  return { title, task, ...options };
}

/**
 * Helper to create nested subtasks
 * @param {string} title - Parent title
 * @param {SubtaskDefinition[]} subtasks - Child subtasks
 * @param {Object} [options] - Options for children
 * @returns {SubtaskDefinition}
 */
export function nestedSubtasks(title, subtasks, options = {}) {
  return { title, subtasks, options };
}

// Re-export for convenience
export { Listr } from 'listr2';
export { Subject, BehaviorSubject, Observable } from 'rxjs';