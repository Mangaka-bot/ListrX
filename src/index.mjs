import { DynamicTaskQueue } from './task-queue.mjs';

export { DynamicTaskQueue } from './task-queue.mjs';
export { getQueue, resetQueue, addTask } from './singleton.mjs';

/**
 * Factory function to create a new independent queue
 * @param {Object} [options] - Queue configuration options
 * @returns {DynamicTaskQueue}
 */
export function createQueue(options = {}) {
  return new DynamicTaskQueue(options);
}

export { Listr } from 'listr2';
export { Subject, BehaviorSubject, Observable } from 'rxjs';