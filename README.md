<div align="center">

# 🚀 ListrX <a name="-listrx"></a>

### Beautiful CLI task management with runtime task injection

[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![listr2](https://img.shields.io/badge/listr2-9.x-blue?style=for-the-badge)](https://github.com/listr2/listr2)
[![RxJS](https://img.shields.io/badge/RxJS-7.x-B7178C?style=for-the-badge&logo=reactivex&logoColor=white)](https://rxjs.dev/)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

A powerful Node.js utility that combines **listr2**'s beautiful CLI output with **RxJS**'s reactive streams to create an easy to use dynamic task queue system. Add tasks from anywhere in your code (e.g. event handlers, API callbacks, or async workflows) and watch them execute with elegant terminal feedback.

[Features](#-features) •
[Installation](#-installation) •
[Quick Start](#-quick-start) •
[API](#-api-reference) •
[Examples](#-examples)

---

<img src="not-available-yet" alt="Terminal Demo" width="600">

</div>

---

## ✨ Features

<table>
<tr>
<td width="50%">

### 🎯 Core Capabilities

- **Dynamic Task Injection** — Add tasks at runtime from anywhere
- **RxJS-Powered** — Built on reactive streams for maximum flexibility
- **Beautiful Output** — Leverages listr2's polished terminal UI
- **Promise-Based** — Every task returns a trackable promise
- **Automatic Batching** — Groups rapidly-added tasks efficiently

</td>
<td width="50%">

### 🛠️ Developer Experience

- **Minimal API** — Just `queue.add(title, fn)` to get started
- **TypeScript Ready** — Full JSDoc annotations included
- **State Observable** — React to queue state changes
- **Graceful Shutdown** — Clean completion handling
- **Singleton Support** — Optional global instance pattern

</td>
</tr>
</table>

---

## 📦 Installation

```bash
# Using npm
npm install listrx

# Using yarn
yarn add listrx

# Using pnpm
pnpm add listrx
```

### Prerequisites

- Node.js **20.0.0** or higher
- ES Modules support (the package uses `.mjs` extensions)

### Peer Dependencies

The library requires these packages (installed automatically):

```json
{
  "listr2": "^9.0.5",
  "rxjs": "^7.8.2"
}
```

---

## 🚀 Quick Start

### The Simplest Example

```javascript
import { createQueue } from 'dynamic-task-queue';

// Create a queue
const queue = createQueue();

// Add tasks from anywhere!
queue.add('Say Hello', async () => {
  console.log('Hello, World!');
});

queue.add('Do Something Async', async () => {
  await fetch('https://api.example.com/data');
});

// Signal completion when done adding tasks
await queue.complete();
```

### What You'll See

```
  ✔ Say Hello
  ✔ Do Something Async
```

---

## 📖 API Reference

### Factory Functions

| Function | Description | Returns |
|----------|-------------|---------|
| `createQueue(options?)` | Create a new independent queue instance | `DynamicTaskQueue` |
| `getQueue(options?)` | Get/create singleton instance | `DynamicTaskQueue` |
| `resetQueue()` | Reset the singleton instance | `Promise<void>` |
| `addTask(title, fn)` | Shorthand for `getQueue().add()` | `Promise<any>` |

---

### `createQueue(options?)`

Creates a new task queue instance with the specified configuration.

```javascript
import { createQueue } from 'dynamic-task-queue';

const queue = createQueue({
  concurrent: true,
  exitOnError: false,
  batchDebounceMs: 50,
  rendererOptions: {
    showTimer: true
  }
});
```

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `concurrent` | `boolean` | `false` | Run tasks in parallel instead of sequentially |
| `exitOnError` | `boolean` | `false` | Stop the entire queue if a task fails |
| `batchDebounceMs` | `number` | `50` | Milliseconds to wait before processing a batch |
| `rendererOptions` | `object` | `{}` | Listr2 renderer configuration |

#### Renderer Options

```javascript
{
  rendererOptions: {
    showTimer: true,           // Show duration for each task
    collapseSubtasks: false,   // Keep subtasks expanded
    showSubtasks: true,        // Display subtask details
    removeEmptyLines: false,   // Preserve spacing
    formatOutput: 'wrap'       // Output text wrapping
  }
}
```

---

### Instance Methods

#### `queue.add(title, taskFn)`

Add a task to the queue. Returns a promise that resolves with the task's return value.

```javascript
const result = await queue.add('Process Data', async (ctx, task) => {
  task.output = 'Working...';
  const data = await processData();
  return data;
});

console.log(result); // Whatever processData() returned
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `title` | `string` | Display title shown in the terminal |
| `taskFn` | `(ctx, task) => Promise<any>` | Async function to execute |

**Task Function Arguments:**

| Argument | Type | Description |
|----------|------|-------------|
| `ctx` | `object` | Shared context object across all tasks in a batch |
| `task` | `ListrTaskWrapper` | Listr task object for output/title updates |

**Task Object Properties:**

```javascript
queue.add('Example', async (ctx, task) => {
  task.output = 'Status message';     // Update the task's output line
  task.title = 'New Title';           // Change the task's title
  
  // Skip the task
  task.skip('Reason for skipping');
  
  // Access Listr's full API
  task.stdout();  // Get stdout stream
});
```

---

#### `queue.addMany(tasks)`

Add multiple tasks at once. Returns a promise that resolves with all results.

```javascript
const results = await queue.addMany([
  { title: 'Task 1', task: async () => 'result1' },
  { title: 'Task 2', task: async () => 'result2' },
  { title: 'Task 3', task: async () => 'result3' }
]);

console.log(results); // ['result1', 'result2', 'result3']
```

---

#### `queue.complete()`

Signal that no more tasks will be added and wait for all pending tasks to finish.

```javascript
// Add your tasks...
queue.add('Task 1', async () => { /* ... */ });
queue.add('Task 2', async () => { /* ... */ });

// Wait for everything to complete
await queue.complete();

console.log('All done!');
```

> ⚠️ **Important:** After calling `complete()`, no new tasks can be added to the queue.

---

#### `queue.forceShutdown(reason?)`

Immediately stop the queue and reject all pending tasks.

```javascript
// Gracefully handle SIGINT
process.on('SIGINT', () => {
  queue.forceShutdown('User interrupted');
  process.exit(1);
});
```

---

### Instance Properties

| Property | Type | Description |
|----------|------|-------------|
| `state` | `string` | Current state: `'idle'` \| `'processing'` \| `'completing'` \| `'completed'` |
| `state$` | `Observable<string>` | RxJS Observable of state changes |
| `isIdle` | `boolean` | `true` if queue is idle |
| `isProcessing` | `boolean` | `true` if queue is processing tasks |
| `isCompleted` | `boolean` | `true` if queue has completed |
| `pendingCount` | `number` | Number of tasks waiting to be processed |
| `stats` | `object` | Statistics: `{ processed, failed, pending }` |

#### Reactive State Monitoring

```javascript
import { filter } from 'rxjs/operators';

// Subscribe to all state changes
queue.state$.subscribe(state => {
  console.log(`Queue is now: ${state}`);
});

// React to specific states
queue.state$.pipe(
  filter(state => state === 'completed')
).subscribe(() => {
  console.log('Queue finished!');
});
```

---

## 📚 Examples

### 🔹 Basic Sequential Tasks

```javascript
import { createQueue } from 'dynamic-task-queue';

async function deployApplication() {
  const queue = createQueue();

  queue.add('📦 Installing dependencies', async (ctx, task) => {
    await runCommand('npm install');
    task.output = 'Installed 847 packages';
  });

  queue.add('🔨 Building application', async (ctx, task) => {
    task.output = 'Compiling TypeScript...';
    await runCommand('npm run build');
    task.output = 'Build complete!';
  });

  queue.add('🧪 Running tests', async (ctx, task) => {
    const results = await runCommand('npm test');
    task.output = `${results.passed} passed, ${results.failed} failed`;
    ctx.testResults = results;
  });

  queue.add('🚀 Deploying', async (ctx, task) => {
    if (ctx.testResults.failed > 0) {
      task.skip('Skipping deploy due to test failures');
      return;
    }
    await deploy();
  });

  await queue.complete();
}
```

---

### 🔹 Concurrent Task Processing

```javascript
import { createQueue } from 'dynamic-task-queue';

async function processImages(images) {
  const queue = createQueue({ 
    concurrent: true  // Process all images in parallel!
  });

  for (const image of images) {
    queue.add(`🖼️  Process ${image.name}`, async (ctx, task) => {
      task.output = 'Resizing...';
      await resize(image);
      
      task.output = 'Optimizing...';
      await optimize(image);
      
      task.output = 'Uploading...';
      await upload(image);
      
      return { name: image.name, status: 'complete' };
    });
  }

  await queue.complete();
}
```

---

### 🔹 Event-Driven Task Injection

Perfect for file watchers, webhooks, or any event-based workflow:

```javascript
import { createQueue } from 'dynamic-task-queue';
import { watch } from 'chokidar';

// Create a long-running queue
const queue = createQueue({ concurrent: true });

// Watch for file changes
const watcher = watch('./src/**/*.ts');

watcher.on('change', (path) => {
  // Dynamically add a task when a file changes!
  queue.add(`🔄 Rebuild ${path}`, async (ctx, task) => {
    task.output = 'Compiling...';
    await compile(path);
    
    task.output = 'Running tests...';
    await runTests(path);
  });
});

// Handle graceful shutdown
process.on('SIGINT', async () => {
  watcher.close();
  await queue.complete();
  process.exit(0);
});
```

---

### 🔹 With RxJS Streams

Leverage the full power of RxJS:

```javascript
import { createQueue } from 'dynamic-task-queue';
import { interval, fromEvent } from 'rxjs';
import { take, map, mergeMap } from 'rxjs/operators';

const queue = createQueue();

// Create a stream of tasks from an interval
interval(1000).pipe(
  take(5),
  map(i => ({
    title: `⏰ Scheduled task #${i + 1}`,
    work: async () => {
      await performScheduledWork(i);
    }
  }))
).subscribe(({ title, work }) => {
  queue.add(title, work);
});

// Also handle DOM events (in Electron, for example)
fromEvent(button, 'click').pipe(
  mergeMap(() => queue.add('🖱️  Handle click', async () => {
    await processClick();
  }))
).subscribe();
```

---

### 🔹 Error Handling

```javascript
import { createQueue } from 'dynamic-task-queue';

const queue = createQueue({ exitOnError: false });

// Method 1: Handle errors per-task
queue.add('Risky Operation', async () => {
  throw new Error('Something went wrong!');
}).catch(error => {
  console.error('Task failed:', error.message);
});

// Method 2: Try-catch inside the task
queue.add('Safe Operation', async (ctx, task) => {
  try {
    await riskyOperation();
  } catch (error) {
    task.output = `Failed: ${error.message}`;
    // Optionally skip or handle gracefully
  }
});

// Method 3: Track all results
const results = await Promise.allSettled([
  queue.add('Task 1', async () => 'success'),
  queue.add('Task 2', async () => { throw new Error('fail'); }),
  queue.add('Task 3', async () => 'success')
]);

console.log(results);
// [
//   { status: 'fulfilled', value: 'success' },
//   { status: 'rejected', reason: Error('fail') },
//   { status: 'fulfilled', value: 'success' }
// ]
```

---

### 🔹 Using the Singleton Pattern

For application-wide task management:

```javascript
// queue.mjs — Setup file
import { getQueue } from 'dynamic-task-queue';

export const queue = getQueue({
  concurrent: true,
  rendererOptions: { showTimer: true }
});
```

```javascript
// anywhere-in-your-app.mjs
import { addTask } from 'dynamic-task-queue';

// Uses the same singleton instance!
addTask('Background Job', async () => {
  await doWork();
});
```

```javascript
// main.mjs — Entry point
import { getQueue } from 'dynamic-task-queue';
import './setup-event-handlers.mjs';

// When your app is shutting down
process.on('beforeExit', async () => {
  await getQueue().complete();
});
```

---

### 🔹 Progress Updates and Subtasks

```javascript
queue.add('📊 Processing large dataset', async (ctx, task) => {
  const items = await fetchItems();
  const total = items.length;
  
  for (let i = 0; i < items.length; i++) {
    // Update progress in the output
    task.output = `Processing item ${i + 1}/${total} (${Math.round((i/total) * 100)}%)`;
    await processItem(items[i]);
  }
  
  task.output = `Completed ${total} items`;
});
```

---

## 🔧 Advanced Configuration

### Custom Renderer

```javascript
import { createQueue } from 'dynamic-task-queue';

// Use the "simple" renderer for CI environments
const queue = createQueue({
  renderer: process.env.CI ? 'simple' : 'default',
  rendererOptions: {
    showTimer: true,
    formatOutput: 'wrap'
  }
});
```

### Conditional Renderer Selection

```javascript
import { createQueue } from 'dynamic-task-queue';

const queue = createQueue({
  renderer: process.env.CI ? 'simple' : 'default',
  rendererFallback: 'simple',  // Fallback for non-TTY
  rendererSilent: process.env.SILENT === 'true'
});
```

---

## 📊 State Machine

The queue follows a predictable state lifecycle:

```
                    ┌─────────────────────┐
                    │                     │
                    ▼                     │
    ┌───────┐   add()  ┌────────────┐ (batch complete, more pending)
    │ IDLE  │ ───────► │ PROCESSING │ ───┘
    └───────┘          └────────────┘
        ▲                     │
        │                     │ complete()
        │                     ▼
        │              ┌────────────┐
        └────────────  │ COMPLETING │
       (new tasks)     └────────────┘
                              │
                              │ (all tasks done)
                              ▼
                       ┌────────────┐
                       │ COMPLETED  │
                       └────────────┘
```

| State | Description |
|-------|-------------|
| `idle` | Queue is empty and waiting for tasks |
| `processing` | Actively running tasks |
| `completing` | `complete()` called, finishing remaining tasks |
| `completed` | All tasks finished, queue is closed |

---

## 🧪 Testing

When testing code that uses the task queue:

```javascript
import { createQueue } from 'dynamic-task-queue';

describe('MyFeature', () => {
  let queue;

  beforeEach(() => {
    // Create a fresh queue for each test
    queue = createQueue({
      renderer: 'silent'  // Disable output during tests
    });
  });

  afterEach(async () => {
    // Always clean up
    if (!queue.isCompleted) {
      await queue.complete();
    }
  });

  it('should process tasks', async () => {
    const result = await queue.add('Test Task', async () => {
      return 42;
    });

    expect(result).toBe(42);
  });
});
```

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Setup

```bash
git clone https://github.com/yourusername/dynamic-task-queue.git
cd dynamic-task-queue
npm install
npm run example:basic
```

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [listr2](https://github.com/listr2/listr2) — For the beautiful terminal task interface
- [RxJS](https://rxjs.dev/) — For reactive streams that power the queue

---

<div align="center">

**Made with ❤️ for the Node.js CLI community**

[⬆ Back to Top](#-listrx)

</div>