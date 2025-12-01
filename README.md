<div align="center">

# 🚀 ListrX <a name="-listrx"></a>

### Beautiful CLI task management with runtime task injection & subtasks

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![listr2](https://img.shields.io/badge/listr2-8.x-blue?style=for-the-badge)](https://github.com/listr2/listr2)
[![RxJS](https://img.shields.io/badge/RxJS-7.x-B7178C?style=for-the-badge&logo=reactivex&logoColor=white)](https://rxjs.dev/)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

A powerful Node.js utility that combines **listr2**'s beautiful CLI output with **RxJS**'s reactive streams to create an easy to use dynamic task queue system. Add tasks and subtasks from anywhere in your code (e.g. event handlers, API callbacks, or async workflows) and watch them execute with elegant terminal feedback.

[Features](#-features) •
[Installation](#-installation) •
[Quick Start](#-quick-start) •
[Subtasks](#-subtasks) •
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
- **Full Subtask Support** — Static, dynamic, and nested subtasks
- **RxJS-Powered** — Built on reactive streams for maximum flexibility
- **Beautiful Output** — Leverages listr2's polished terminal UI
- **Promise-Based** — Every task returns a trackable promise
- **Automatic Batching** — Groups rapidly-added tasks efficiently

</td>
<td width="50%">

### 🛠️ Developer Experience

- **Minimal API** — Just `queue.add(title, fn)` to get started
- **Flexible Subtasks** — 5 different ways to add subtasks
- **TypeScript Ready** — Full JSDoc annotations included
- **State Observable** — React to queue state changes
- **Graceful Shutdown** — Clean completion handling
- **Helper Functions** — `subtask()` and `nestedSubtasks()` utilities

</td>
</tr>
</table>

---

## 📦 Installation

```bash
# Using npm
npm install @shoru/listrx

# Using yarn
yarn add @shoru/listrx

# Using pnpm
pnpm add @shoru/listrx
```

### Prerequisites

- Node.js **18.0.0** or higher
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
import { createQueue } from '@shoru/listrx';

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

### With Subtasks

```javascript
import { createQueue } from '@shoru/listrx';

const queue = createQueue();

// Add a task with subtasks
queue.addWithSubtasks('🚀 Deploy Application', [
  { title: 'Build project', task: async () => await build() },
  { title: 'Run tests', task: async () => await test() },
  { title: 'Upload to server', task: async () => await upload() }
]);

await queue.complete();
```

### What You'll See

```
  ✔ 🚀 Deploy Application
    ├── ✔ Build project
    ├── ✔ Run tests
    └── ✔ Upload to server
```

---

## 🎭 Subtasks

ListrX provides comprehensive subtask support with multiple ways to define and control them.

### 5 Ways to Add Subtasks

#### 1. Using `add()` with options

```javascript
queue.add('Parent Task', async (ctx, task) => {
  task.output = 'Preparing...';
  ctx.data = await prepare(); // example function
}, {
  subtasks: [
    { title: 'Step 1', task: async (ctx) => await step1(ctx.data) },
    { title: 'Step 2', task: async (ctx) => await step2(ctx.data) }
  ],
  subtaskOptions: { concurrent: true },
  subtaskMode: 'after'  // Run subtasks after main task
});
```

#### 2. Using `addWithSubtasks()`

```javascript
queue.addWithSubtasks('Build Pipeline', [
  { title: 'Compile', task: async () => await compile() },
  { title: 'Bundle', task: async () => await bundle() },
  { title: 'Minify', task: async () => await minify() }
], {
  subtaskOptions: { concurrent: false }
});
```

#### 3. Using `addTask()` with full definition

```javascript
queue.addTask({
  title: 'Complex Operation',
  task: async (ctx) => { ctx.ready = true; },
  subtasks: [
    { title: 'Step 1', task: async () => {}, skip: (ctx) => !ctx.ready },
    { title: 'Step 2', task: async () => {}, retry: { tries: 3, delay: 1000 } }
  ],
  options: { concurrent: true, exitOnError: false }
});
```

#### 4. Using `addTasks()` for batch definitions

```javascript
queue.addTasks([
  {
    title: 'Task 1',
    subtasks: [
      { title: 'Subtask 1a', task: async () => {} },
      { title: 'Subtask 1b', task: async () => {} }
    ]
  },
  {
    title: 'Task 2',
    subtasks: [
      { title: 'Subtask 2a', task: async () => {} },
      { title: 'Subtask 2b', task: async () => {} }
    ]
  }
]);
```

#### 5. Dynamic subtasks with `task.newListr()`

```javascript
queue.add('Process Files', async (ctx, task) => {
  // Discover files at runtime
  const files = await discoverFiles();
  
  // Create subtasks dynamically
  return task.newListr(
    files.map(file => ({
      title: `Process ${file}`,
      task: async () => await processFile(file)
    })),
    { concurrent: true }
  );
});
```

---

### Nested Subtasks

Subtasks can be nested to any depth:

```javascript
queue.addWithSubtasks('🏗️ Full Build', [
  {
    title: 'Frontend',
    subtasks: [
      { title: 'Compile TypeScript', task: async () => {} },
      { title: 'Bundle CSS', task: async () => {} },
      {
        title: 'Optimize',
        subtasks: [
          { title: 'Minify JS', task: async () => {} },
          { title: 'Minify CSS', task: async () => {} },
          { title: 'Compress images', task: async () => {} }
        ],
        options: { concurrent: true }
      }
    ]
  },
  {
    title: 'Backend',
    subtasks: [
      { title: 'Compile', task: async () => {} },
      { title: 'Generate types', task: async () => {} }
    ]
  }
]);
```

**Output:**

```
  ✔ 🏗️ Full Build
    ├── ✔ Frontend
    │   ├── ✔ Compile TypeScript
    │   ├── ✔ Bundle CSS
    │   └── ✔ Optimize
    │       ├── ✔ Minify JS
    │       ├── ✔ Minify CSS
    │       └── ✔ Compress images
    └── ✔ Backend
        ├── ✔ Compile
        └── ✔ Generate types
```

---

### Subtask Modes

Control when subtasks run relative to the main task:

| Mode | Description |
|------|-------------|
| `'after'` | Main task runs first, then subtasks (default) |
| `'before'` | Subtasks run first, then main task |
| `'only'` | Only subtasks run, main task is ignored |
| `'wrap'` | Same as `'after'` |

```javascript
// Run subtasks BEFORE main task
queue.add('Deploy', async () => {
  await deploy();  // Runs after subtasks complete
}, {
  subtasks: [
    { title: 'Validate', task: async () => {} },
    { title: 'Backup', task: async () => {} }
  ],
  subtaskMode: 'before'
});

// Run ONLY subtasks (no main task)
queue.add('Build Steps', null, {
  subtasks: [
    { title: 'Step 1', task: async () => {} },
    { title: 'Step 2', task: async () => {} }
  ],
  subtaskMode: 'only'
});
```

---

### Subtask Features

#### Skip Conditions

```javascript
{
  title: 'Optional Step',
  task: async () => {},
  skip: (ctx) => ctx.skipOptional ? 'Skipped by user' : false
}
```

#### Enable Conditions

```javascript
{
  title: 'Conditional Step',
  task: async () => {},
  enabled: (ctx) => ctx.featureEnabled
}
```

#### Retry on Failure

```javascript
{
  title: 'Flaky Operation',
  task: async () => await flakyApiCall(),
  retry: { tries: 3, delay: 1000 }  // Retry 3 times with 1s delay
}
```

#### Rollback on Failure

```javascript
{
  title: 'Database Migration',
  task: async () => await migrate(),
  rollback: async (ctx, task) => {
    task.output = 'Rolling back...';
    await rollbackMigration();
  }
}
```

---

### Helper Functions

Use helper functions for cleaner subtask definitions:

```javascript
import { createQueue, subtask, nestedSubtasks } from '@shoru/listrx';

const queue = createQueue();

queue.addWithSubtasks('Build Project', [
  subtask('Compile', async () => await compile()),
  subtask('Lint', async () => await lint(), { skip: (ctx) => ctx.skipLint }),
  nestedSubtasks('Optimize', [
    subtask('Minify JS', async () => await minifyJs()),
    subtask('Minify CSS', async () => await minifyCss())
  ], { concurrent: true }),
  subtask('Generate docs', async () => await generateDocs())
]);

await queue.complete();
```

---

## 📖 API Reference

### Exports

```javascript
import { 
  createQueue,        // Factory to create queue instances
  DynamicTaskQueue,   // Queue class (for typing/instanceof)
  subtask,            // Helper to create subtask definitions
  nestedSubtasks,     // Helper to create nested subtasks
  Listr,              // Re-exported from listr2
  Subject,            // Re-exported from rxjs
  BehaviorSubject,    // Re-exported from rxjs
  Observable          // Re-exported from rxjs
} from '@shoru/listrx';
```

---

### `createQueue(options?)`

Creates a new task queue instance with the specified configuration.

```javascript
import { createQueue } from '@shoru/listrx';

const queue = createQueue({
  concurrent: true,
  exitOnError: false,
  batchDebounceMs: 50,
  defaultSubtaskOptions: {
    concurrent: false,
    exitOnError: true
  },
  rendererOptions: {
    showTimer: true,
    collapseSubtasks: false
  }
});
```

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `concurrent` | `boolean` | `false` | Run tasks in parallel instead of sequentially |
| `exitOnError` | `boolean` | `false` | Stop the entire queue if a task fails |
| `batchDebounceMs` | `number` | `50` | Milliseconds to wait before processing a batch |
| `defaultSubtaskOptions` | `object` | `{}` | Default options applied to all subtasks |
| `rendererOptions` | `object` | `{}` | Listr2 renderer configuration |

#### Default Subtask Options

```javascript
{
  defaultSubtaskOptions: {
    concurrent: false,      // Run subtasks sequentially by default
    exitOnError: true,      // Stop subtasks on first error
    rendererOptions: {
      collapseSubtasks: false  // Keep subtasks expanded
    }
  }
}
```

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

### Helper Functions

#### `subtask(title, taskFn, options?)`

Create a subtask definition with a cleaner syntax.

```javascript
import { subtask } from '@shoru/listrx';

const mySubtask = subtask('Process data', async (ctx, task) => {
  task.output = 'Working...';
  await process();
}, {
  retry: { tries: 2 },
  skip: (ctx) => ctx.skipProcessing
});
```

#### `nestedSubtasks(title, subtasks, options?)`

Create a subtask that contains nested subtasks.

```javascript
import { nestedSubtasks, subtask } from '@shoru/listrx';

const optimizeStep = nestedSubtasks('Optimize', [
  subtask('Minify', async () => {}),
  subtask('Compress', async () => {}),
  subtask('Cache', async () => {})
], { concurrent: true });
```

---

### Instance Methods

#### `queue.add(title, taskFn, options?)`

Add a task to the queue with optional subtasks. Returns a promise that resolves with the task's return value.

```javascript
// Simple task
const result = await queue.add('Process Data', async (ctx, task) => {
  task.output = 'Working...';
  return await processData();
});

// Task with subtasks
await queue.add('Build Project', async (ctx, task) => {
  task.output = 'Initializing...';
  ctx.config = await loadConfig();
}, {
  subtasks: [
    { title: 'Compile', task: async (ctx) => await compile(ctx.config) },
    { title: 'Bundle', task: async () => await bundle() }
  ],
  subtaskOptions: { concurrent: false },
  subtaskMode: 'after'
});
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `title` | `string` | Display title shown in the terminal |
| `taskFn` | `(ctx, task) => Promise<any>` | Async function to execute (can be `null` if using subtasks only) |
| `options` | `TaskOptions` | Optional configuration including subtasks |

**Task Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `subtasks` | `SubtaskDefinition[]` | `undefined` | Array of subtask definitions |
| `subtaskOptions` | `SubtaskOptions` | `{}` | Options for subtask execution |
| `subtaskMode` | `'before'\|'after'\|'only'\|'wrap'` | `'after'` | When to run subtasks relative to main task |
| `enabled` | `boolean\|(ctx) => boolean` | `true` | Whether the task is enabled |
| `skip` | `boolean\|string\|(ctx) => boolean\|string` | `false` | Skip condition or message |
| `retry` | `number\|{tries, delay?}` | `undefined` | Retry configuration |
| `rollback` | `(ctx, task) => void` | `undefined` | Rollback function on failure |

---

#### `queue.addWithSubtasks(title, subtasks, options?)`

Add a task that primarily consists of subtasks. This is a cleaner API when subtasks are the main focus.

```javascript
await queue.addWithSubtasks('Deploy Pipeline', [
  {
    title: 'Build',
    task: async (ctx, task) => {
      task.output = 'Compiling...';
      await build();
    }
  },
  {
    title: 'Test',
    task: async () => await runTests(),
    retry: { tries: 2 }
  },
  {
    title: 'Deploy',
    task: async () => await deploy(),
    skip: (ctx) => ctx.testsFailed ? 'Tests failed' : false
  }
], {
  subtaskOptions: { concurrent: false, exitOnError: true },
  task: async (ctx) => { ctx.startTime = Date.now(); }  // Optional parent task
});
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `title` | `string` | Parent task title |
| `subtasks` | `SubtaskDefinition[]` | Array of subtask definitions |
| `options.task` | `function` | Optional parent task executor |
| `options.subtaskOptions` | `SubtaskOptions` | Options for subtasks |
| `options.subtaskMode` | `string` | Defaults to `'only'` unless `task` is provided |

---

#### `queue.addTask(definition)`

Add a task using a complete definition object. Best for complex tasks with many options.

```javascript
await queue.addTask({
  title: '📊 Generate Reports',
  task: async (ctx, task) => {
    task.output = 'Loading data...';
    ctx.data = await loadData();
  },
  subtasks: [
    {
      title: 'User Report',
      task: async (ctx) => await generateUserReport(ctx.data),
      enabled: (ctx) => ctx.data.users.length > 0
    },
    {
      title: 'Sales Report',
      task: async (ctx) => await generateSalesReport(ctx.data),
      retry: { tries: 3, delay: 500 }
    },
    {
      title: 'Email Reports',
      task: async () => await emailReports(),
      skip: (ctx) => ctx.skipEmail ? 'Email disabled' : false
    }
  ],
  options: {
    concurrent: true,
    exitOnError: false
  }
});
```

**Full Task Definition:**

```typescript
interface FullTaskDefinition {
  title: string;
  task?: (ctx, task) => Promise<any>;
  subtasks?: SubtaskDefinition[];
  options?: SubtaskOptions;
  subtaskMode?: 'before' | 'after' | 'only' | 'wrap';
  enabled?: boolean | ((ctx) => boolean);
  skip?: boolean | string | ((ctx) => boolean | string);
  retry?: number | { tries: number; delay?: number };
  rollback?: (ctx, task) => void;
}
```

---

#### `queue.addTasks(definitions)`

Add multiple task definitions at once. Returns a promise that resolves with all results.

```javascript
const results = await queue.addTasks([
  {
    title: 'Database Tasks',
    subtasks: [
      { title: 'Migrate', task: async () => await migrate() },
      { title: 'Seed', task: async () => await seed() }
    ]
  },
  {
    title: 'Cache Tasks',
    subtasks: [
      { title: 'Clear', task: async () => await clearCache() },
      { title: 'Warm', task: async () => await warmCache() }
    ],
    options: { concurrent: true }
  }
]);
```

---

#### `queue.addMany(tasks)`

Add multiple simple tasks at once. Returns a promise that resolves with all results.

```javascript
const results = await queue.addMany([
  { title: 'Task 1', task: async () => 'result1' },
  { title: 'Task 2', task: async () => 'result2' },
  { 
    title: 'Task 3', 
    task: async () => 'result3',
    subtasks: [
      { title: 'Subtask 3a', task: async () => {} }
    ]
  }
]);
```

---

#### `queue.complete()`

Signal that no more tasks will be added and wait for all pending tasks to finish.

```javascript
// Add your tasks...
queue.add('Task 1', async () => { /* ... */ });
queue.addWithSubtasks('Task 2', [/* ... */]);

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

### Subtask Definition

```typescript
interface SubtaskDefinition {
  // Required
  title: string;
  
  // Task executor (optional if subtasks are provided)
  task?: (ctx, task) => Promise<any>;
  
  // Nested subtasks
  subtasks?: SubtaskDefinition[];
  options?: SubtaskOptions;  // Options for nested subtasks
  
  // Conditional execution
  enabled?: boolean | ((ctx) => boolean);
  skip?: boolean | string | ((ctx) => boolean | string);
  
  // Error handling
  retry?: number | { tries: number; delay?: number };
  rollback?: (ctx, task) => void;
  exitAfterRollback?: boolean;
}
```

### Subtask Options

```typescript
interface SubtaskOptions {
  concurrent?: boolean;       // Run subtasks in parallel (default: false)
  exitOnError?: boolean;      // Stop on first error (default: true)
  rendererOptions?: object;   // Listr2 renderer options for subtasks
}
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
import { createQueue } from '@shoru/listrx';

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

### 🔹 Build Pipeline with Subtasks

```javascript
import { createQueue, subtask, nestedSubtasks } from '@shoru/listrx';

async function buildProject() {
  const queue = createQueue({
    rendererOptions: { showTimer: true }
  });

  await queue.addWithSubtasks('🏗️ Build Project', [
    {
      title: 'Install Dependencies',
      task: async (ctx, task) => {
        task.output = 'Running npm install...';
        await exec('npm install');
        ctx.installed = true;
      }
    },
    {
      title: 'Compile Source',
      subtasks: [
        subtask('TypeScript', async () => await exec('tsc')),
        subtask('Sass', async () => await exec('sass src:dist')),
        subtask('Assets', async () => await copyAssets())
      ],
      options: { concurrent: true }
    },
    {
      title: 'Run Tests',
      task: async (ctx, task) => {
        const result = await exec('npm test');
        ctx.testsPassed = result.exitCode === 0;
        task.output = ctx.testsPassed ? 'All tests passed' : 'Some tests failed';
      },
      retry: { tries: 2, delay: 1000 }
    },
    {
      title: 'Optimize Bundle',
      skip: (ctx) => !ctx.testsPassed ? 'Skipped due to test failures' : false,
      subtasks: [
        subtask('Minify JavaScript', async () => await minifyJs()),
        subtask('Minify CSS', async () => await minifyCss()),
        subtask('Optimize Images', async () => await optimizeImages())
      ],
      options: { concurrent: true }
    }
  ]);

  await queue.complete();
  console.log('📊 Stats:', queue.stats);
}
```

---

### 🔹 Dynamic Subtasks Based on Runtime Data

```javascript
import { createQueue } from '@shoru/listrx';

async function processUserData() {
  const queue = createQueue();

  queue.add('📊 Process User Data', async (ctx, task) => {
    // Fetch data at runtime
    task.output = 'Fetching users...';
    const users = await fetchUsers();
    
    task.output = `Processing ${users.length} users...`;
    
    // Create subtasks dynamically based on fetched data
    return task.newListr(
      users.map(user => ({
        title: `Process ${user.name}`,
        task: async (ctx, subtask) => {
          subtask.output = 'Validating...';
          await validateUser(user);
          
          subtask.output = 'Syncing...';
          await syncUser(user);
        }
      })),
      { concurrent: true }  // Process all users in parallel
    );
  });

  await queue.complete();
}
```

---

### 🔹 Mixed Static and Dynamic Subtasks

```javascript
import { createQueue } from '@shoru/listrx';

async function syncDatabase() {
  const queue = createQueue();

  queue.add('🔄 Database Sync', async (ctx, task) => {
    // Discover tables at runtime
    task.output = 'Discovering tables...';
    ctx.tables = await discoverTables();
    
    // Return dynamic subtasks
    return task.newListr(
      ctx.tables.map(table => ({
        title: `Sync: ${table}`,
        task: async (ctx, subtask) => {
          const count = await syncTable(table);
          subtask.output = `Synced ${count} rows`;
        }
      })),
      { concurrent: false }
    );
  }, {
    // Static subtasks run AFTER dynamic ones complete
    subtasks: [
      { 
        title: 'Verify integrity', 
        task: async (ctx, task) => {
          task.output = `Checking ${ctx.tables.length} tables...`;
          await verifyIntegrity();
        }
      },
      { 
        title: 'Update statistics', 
        task: async () => await updateStats() 
      }
    ],
    subtaskMode: 'after'
  });

  await queue.complete();
}
```

---

### 🔹 Concurrent Task Processing

```javascript
import { createQueue } from '@shoru/listrx';

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
import { createQueue } from '@shoru/listrx';
import { watch } from 'chokidar';

// Create a long-running queue
const queue = createQueue({ concurrent: true });

// Watch for file changes
const watcher = watch('./src/**/*.ts');

watcher.on('change', (path) => {
  // Dynamically add a task with subtasks when a file changes!
  queue.addWithSubtasks(`🔄 Rebuild ${path}`, [
    { 
      title: 'Compile', 
      task: async (ctx, task) => {
        task.output = 'Compiling...';
        await compile(path);
      }
    },
    { 
      title: 'Lint', 
      task: async () => await lint(path) 
    },
    { 
      title: 'Test', 
      task: async () => await runTests(path),
      skip: () => process.env.SKIP_TESTS === 'true'
    }
  ], {
    subtaskOptions: { exitOnError: false }
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
import { createQueue } from '@shoru/listrx';
import { interval, merge } from 'rxjs';
import { take, map } from 'rxjs/operators';

const queue = createQueue();

// Stream 1: Scheduled backups
const backups$ = interval(5000).pipe(
  take(3),
  map(i => ({
    title: `💾 Backup #${i + 1}`,
    subtasks: [
      { title: 'Create snapshot', task: async () => await snapshot() },
      { title: 'Compress', task: async () => await compress() },
      { title: 'Upload', task: async () => await upload() }
    ]
  }))
);

// Stream 2: Cache operations
const cache$ = interval(3000).pipe(
  take(4),
  map(i => ({
    title: `🗑️ Clear cache region ${i + 1}`,
    task: async () => await clearCacheRegion(i + 1)
  }))
);

// Merge streams and add to queue
merge(backups$, cache$).subscribe(taskDef => {
  if (taskDef.subtasks) {
    queue.addWithSubtasks(taskDef.title, taskDef.subtasks);
  } else {
    queue.add(taskDef.title, taskDef.task);
  }
});
```

---

### 🔹 Error Handling with Retry and Rollback

```javascript
import { createQueue } from '@shoru/listrx';

const queue = createQueue({ exitOnError: false });

await queue.addWithSubtasks('🗄️ Database Migration', [
  {
    title: 'Backup current state',
    task: async (ctx) => {
      ctx.backupId = await createBackup();
    }
  },
  {
    title: 'Run migrations',
    task: async () => await runMigrations(),
    retry: { tries: 3, delay: 2000 },  // Retry 3 times
    rollback: async (ctx, task) => {
      task.output = 'Rolling back to backup...';
      await restoreBackup(ctx.backupId);
    }
  },
  {
    title: 'Verify schema',
    task: async () => await verifySchema(),
    skip: (ctx) => ctx.migrationFailed ? 'Migration failed' : false
  },
  {
    title: 'Update application',
    task: async () => await restartApp(),
    enabled: (ctx) => !ctx.migrationFailed
  }
], {
  subtaskOptions: { exitOnError: false }
});

await queue.complete();
console.log('Stats:', queue.stats);
```

---

### 🔹 Shared Queue Across Modules

For application-wide task management, create your own shared instance:

```javascript
// lib/queue.js — Shared queue instance
import { createQueue } from '@shoru/listrx';

export const queue = createQueue({
  concurrent: true,
  defaultSubtaskOptions: { concurrent: false },
  rendererOptions: { showTimer: true }
});

// Optional: export helper for convenience
export const addTask = (title, fn, options) => queue.add(title, fn, options);
```

```javascript
// features/user-sync.js
import { queue } from '../lib/queue.js';

export function syncUsers(users) {
  queue.addWithSubtasks('👥 Sync Users', users.map(user => ({
    title: `Sync ${user.name}`,
    task: async () => await syncUser(user)
  })));
}
```

```javascript
// features/cache.js
import { addTask } from '../lib/queue.js';

export function clearCache() {
  addTask('🗑️ Clear Cache', async (ctx, task) => {
    task.output = 'Clearing...';
    await cache.clear();
  });
}
```

```javascript
// main.js — Entry point
import { queue } from './lib/queue.js';
import { syncUsers } from './features/user-sync.js';
import { clearCache } from './features/cache.js';

// Use features that add to the shared queue
syncUsers(await fetchUsers());
clearCache();

// Shutdown handling
process.on('SIGINT', async () => {
  await queue.complete();
  process.exit(0);
});
```

---

### 🔹 Complete CI/CD Pipeline Example

```javascript
import { createQueue, subtask, nestedSubtasks } from '@shoru/listrx';

async function runCIPipeline() {
  const queue = createQueue({
    rendererOptions: { 
      showTimer: true,
      collapseSubtasks: false 
    },
    defaultSubtaskOptions: {
      exitOnError: true
    }
  });

  // Stage 1: Setup
  await queue.addWithSubtasks('📦 Setup', [
    subtask('Checkout code', async () => await checkout()),
    subtask('Install dependencies', async (ctx, task) => {
      task.output = 'Running npm ci...';
      await exec('npm ci');
    }),
    subtask('Setup environment', async () => await setupEnv())
  ]);

  // Stage 2: Quality checks (concurrent)
  await queue.addWithSubtasks('🔍 Quality Checks', [
    subtask('Lint', async () => await exec('npm run lint')),
    subtask('Type check', async () => await exec('npm run typecheck')),
    subtask('Security audit', async () => await exec('npm audit'))
  ], {
    subtaskOptions: { concurrent: true, exitOnError: false }
  });

  // Stage 3: Test
  await queue.addWithSubtasks('🧪 Test', [
    nestedSubtasks('Unit Tests', [
      subtask('API tests', async () => await exec('npm run test:api')),
      subtask('UI tests', async () => await exec('npm run test:ui')),
      subtask('Utils tests', async () => await exec('npm run test:utils'))
    ], { concurrent: true }),
    subtask('Integration tests', async () => await exec('npm run test:integration')),
    subtask('E2E tests', async () => await exec('npm run test:e2e'), {
      retry: { tries: 2, delay: 5000 }
    })
  ]);

  // Stage 4: Build
  await queue.addWithSubtasks('🔨 Build', [
    subtask('Build frontend', async () => await exec('npm run build:frontend')),
    subtask('Build backend', async () => await exec('npm run build:backend')),
    nestedSubtasks('Optimize', [
      subtask('Minify', async () => await minify()),
      subtask('Compress', async () => await compress()),
      subtask('Generate sourcemaps', async () => await sourcemaps())
    ], { concurrent: true })
  ]);

  // Stage 5: Deploy
  await queue.addTask({
    title: '🚀 Deploy',
    task: async (ctx) => {
      ctx.deployTime = Date.now();
    },
    subtasks: [
      {
        title: 'Deploy to staging',
        task: async () => await deployToStaging(),
        subtasks: [
          { title: 'Upload files', task: async () => {} },
          { title: 'Run migrations', task: async () => {} },
          { title: 'Restart services', task: async () => {} }
        ]
      },
      {
        title: 'Run smoke tests',
        task: async () => await smokeTests(),
        retry: { tries: 3 }
      },
      {
        title: 'Deploy to production',
        task: async () => await deployToProd(),
        rollback: async () => await rollbackProd()
      }
    ],
    options: { exitOnError: true }
  });

  await queue.complete();
  
  console.log('\n✅ Pipeline completed!');
  console.log('📊 Stats:', queue.stats);
}
```

**Output:**

```
  ✔ 📦 Setup [3.2s]
    ├── ✔ Checkout code [0.5s]
    ├── ✔ Install dependencies [2.1s]
    │   → Running npm ci...
    └── ✔ Setup environment [0.6s]
  ✔ 🔍 Quality Checks [4.1s]
    ├── ✔ Lint [2.3s]
    ├── ✔ Type check [3.8s]
    └── ✔ Security audit [1.2s]
  ✔ 🧪 Test [12.4s]
    ├── ✔ Unit Tests [5.2s]
    │   ├── ✔ API tests [4.1s]
    │   ├── ✔ UI tests [5.0s]
    │   └── ✔ Utils tests [2.3s]
    ├── ✔ Integration tests [4.5s]
    └── ✔ E2E tests [6.2s]
  ✔ 🔨 Build [8.3s]
    ├── ✔ Build frontend [4.2s]
    ├── ✔ Build backend [3.1s]
    └── ✔ Optimize [2.1s]
        ├── ✔ Minify [1.8s]
        ├── ✔ Compress [1.5s]
        └── ✔ Generate sourcemaps [0.9s]
  ✔ 🚀 Deploy [15.2s]
    ├── ✔ Deploy to staging [6.4s]
    │   ├── ✔ Upload files [2.1s]
    │   ├── ✔ Run migrations [1.8s]
    │   └── ✔ Restart services [2.5s]
    ├── ✔ Run smoke tests [3.2s]
    └── ✔ Deploy to production [5.6s]

✅ Pipeline completed!
📊 Stats: { processed: 5, failed: 0, pending: 0 }
```

---

## 🔧 Advanced Configuration

### Custom Renderer

```javascript
import { createQueue } from '@shoru/listrx';

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
import { createQueue } from '@shoru/listrx';

const queue = createQueue({
  renderer: process.env.CI ? 'simple' : 'default',
  rendererFallback: 'simple',  // Fallback for non-TTY
  rendererSilent: process.env.SILENT === 'true'
});
```

### Default Subtask Behavior

```javascript
import { createQueue } from '@shoru/listrx';

// Configure default behavior for all subtasks
const queue = createQueue({
  defaultSubtaskOptions: {
    concurrent: false,      // Sequential by default
    exitOnError: true,      // Stop on first error
    rendererOptions: {
      collapseSubtasks: false,  // Always show subtasks
      showTimer: true
    }
  }
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
import { createQueue } from '@shoru/listrx';

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

  it('should process subtasks', async () => {
    const results = [];
    
    await queue.addWithSubtasks('Parent', [
      { title: 'Child 1', task: async () => { results.push(1); } },
      { title: 'Child 2', task: async () => { results.push(2); } }
    ]);
    
    await queue.complete();
    expect(results).toEqual([1, 2]);
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
git clone https://github.com/shoru/listrx.git
cd listrx
npm install
npm run example:basic
npm run example:subtasks
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