<div align="center">

# 🚀 ListrX

### Beautiful CLI task management with dynamic subtask injection

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![listr2](https://img.shields.io/badge/listr2-9.x-blue?style=for-the-badge)](https://github.com/listr2/listr2)
[![DOWNLOADS](https://img.shields.io/npm/d18m/@shoru/listrx.svg?style=for-the-badge)](https://www.npmjs.com/package/@shoru/listrx)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

A simple yet powerful Node.js library for creating CLI tasks with dynamically injectable subtasks. Built on top of [listr2](https://github.com/listr2/listr2) for beautiful terminal output.

[Installation](#-installation) •
[Quick Start](#-quick-start) •
[API Reference](#-api-reference) •
[Examples](#-examples)

---

</div>

## ✨ Features

<table>
<tr>
<td width="50%">

### 🎯 Core Capabilities

- **Dynamic Subtask Injection** — Add subtasks at runtime from anywhere
- **Nested Subtasks** — Unlimited nesting depth with chained API
- **Shared Context** — All tasks share a common `ctx` object
- **Two Execution Modes** — Run main task before or after subtasks
- **Auto Behaviors** — Auto-complete and auto-execute timers
- **Beautiful Output** — Powered by listr2's polished terminal UI

</td>
<td width="50%">

### 🛠️ Developer Experience

- **Minimal API** — Just `createTask()` and `task.add()`
- **Dynamic Updates** — Change title and output during execution
- **Event Listeners** — React to state changes and subtask additions
- **Error Handling** — Built-in retry, skip, and rollback support
- **Graceful Shutdown** — Clean completion and force shutdown
- **TypeScript Ready** — Full JSDoc type annotations

</td>
</tr>
</table>

---

## 📦 Installation

```bash
# npm
npm install @shoru/listrx

# yarn
yarn add @shoru/listrx

# pnpm
pnpm add @shoru/listrx
```

### Requirements

- **Node.js 18.0.0** or higher
- ES Modules support

---

## 🚀 Quick Start

### Basic Example

```javascript
import { createTask } from '@shoru/listrx';

// Create a task
const task = createTask({ title: '🚀 Deploy Application' });

// Add subtasks dynamically
task.add({ title: 'Build project', task: async (ctx) => await build() });
task.add({ title: 'Run tests', task: async (ctx) => await test() });
task.add({ title: 'Upload files', task: async (ctx) => await upload() });

// Execute and wait for completion
await task.complete();
```

**Terminal Output:**
```
✔ 🚀 Deploy Application
  ├── ✔ Build project
  ├── ✔ Run tests
  └── ✔ Upload files
```

### Nested Subtasks

```javascript
const task = createTask({ title: '🏗️ Build Project' });

// Create parent subtask and chain children
const frontend = task.add({ title: 'Frontend' });
frontend.add({ title: 'Compile TypeScript', task: compileTs });
frontend.add({ title: 'Bundle CSS', task: bundleCss });

const backend = task.add({ title: 'Backend' });
backend.add({ title: 'Compile', task: compileBackend });
backend.add({ title: 'Generate types', task: generateTypes });

await task.complete();
```

**Terminal Output:**
```
✔ 🏗️ Build Project
  ├── ✔ Frontend
  │   ├── ✔ Compile TypeScript
  │   └── ✔ Bundle CSS
  └── ✔ Backend
      ├── ✔ Compile
      └── ✔ Generate types
```

---

## 📖 API Reference

### `createTask(config)`

Creates a new task instance.

```javascript
import { createTask } from '@shoru/listrx';

const task = createTask({
  // Required
  title: 'My Task',

  // Main task executor (optional) - receives ctx and task object
  task: async (ctx, task) => {
    task.output = 'Working...';
    ctx.result = await doSomething();
    task.title = 'My Task ✓';
  },

  // Execution mode (optional, default: 'before')
  mode: 'before',  // 'before' | 'after'

  // Subtask execution options (optional)
  options: {
    concurrent: false,   // Run subtasks in parallel
    exitOnError: true    // Stop on first error
  },

  // Auto behaviors (optional)
  autoComplete: 500,  // Auto-complete after idle duration (ms)
  autoExecute: 500,   // Auto-execute main task after no new subtasks (ms)

  // Error handling (optional)
  retry: { tries: 3, delay: 1000 },
  rollback: async (ctx, task) => await cleanup(),
  skip: (ctx) => ctx.shouldSkip,

  // Display options (optional)
  showTimer: true,
  rendererOptions: {},

  // Subtask defaults (optional)
  defaultSubtaskOptions: {},
  batchDebounceMs: 50
});
```

---

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `title` | `string` | — | **Required.** Display title for the task |
| `task` | `(ctx, task) => Promise<any>` | — | Main task executor function |
| `mode` | `'before'` \| `'after'` | `'before'` | When main task runs relative to subtasks |
| `options` | `object` | `{}` | Subtask execution options |
| `options.concurrent` | `boolean` | `false` | Run subtasks in parallel |
| `options.exitOnError` | `boolean` | `true` | Stop execution on first error |
| `autoComplete` | `number` | — | Auto-complete after ms of post-execution idle |
| `autoExecute` | `number` | — | Auto-execute after ms of no new subtasks |
| `retry` | `{ tries, delay? }` | — | Retry failed task |
| `rollback` | `(ctx, task) => Promise` | — | Rollback function on failure |
| `skip` | `(ctx) => boolean \| string` | — | Skip condition |
| `showTimer` | `boolean` | `false` | Show execution duration |
| `defaultSubtaskOptions` | `object` | `{}` | Default options inherited by subtasks |
| `rendererOptions` | `object` | `{}` | listr2 renderer customization |
| `batchDebounceMs` | `number` | `50` | Debounce time for batching subtask additions |

---

### Task Executor Function

The `task` function receives two arguments:

| Argument | Type | Description |
|----------|------|-------------|
| `ctx` | `object` | Shared context object across all tasks |
| `task` | `object` | Listr2 task object for dynamic updates |

#### Task Object Properties

| Property | Type | Description |
|----------|------|-------------|
| `task.title` | `string` | Update the task title dynamically |
| `task.output` | `string` | Display status message below the title |

```javascript
task.add({
  title: 'Processing...',
  task: async (ctx, task) => {
    task.output = 'Connecting to server...';
    await connect();
    
    task.output = 'Downloading files...';
    await download();
    
    task.title = 'Processing complete ✓';
  }
});
```

---

### Execution Modes

Control when the main task executor runs relative to subtasks.

| Mode | Execution Order | Use Case |
|------|-----------------|----------|
| `'before'` | Main task → Subtasks | Prepare data for subtasks |
| `'after'` | Subtasks → Main task | Aggregate results from subtasks |

#### Mode: `'before'` (Default)

The main task runs **first**, then subtasks execute. Use this when the main task prepares context for subtasks.

```javascript
const task = createTask({
  title: 'Deploy',
  mode: 'before',
  task: async (ctx, task) => {
    // Runs FIRST - prepare configuration
    task.output = 'Loading configuration...';
    ctx.config = await loadConfig();
    ctx.version = await getVersion();
    task.title = `Deploy v${ctx.version}`;
  }
});

// Subtasks run AFTER main task, can use ctx.config
task.add({
  title: 'Upload files',
  task: async (ctx) => await upload(ctx.config)
});

task.add({
  title: 'Tag release',
  task: async (ctx) => await tagRelease(ctx.version)
});

await task.complete();
```

#### Mode: `'after'`

Subtasks run **first**, then the main task executes. Use this when you need to aggregate or finalize results.

```javascript
const task = createTask({
  title: 'Generate Report',
  mode: 'after',
  task: async (ctx, task) => {
    // Runs LAST - aggregate all data
    task.output = 'Generating report...';
    await generateReport(ctx.userData, ctx.salesData);
    task.title = 'Report Generated ✓';
  }
});

// Subtasks run FIRST, populate ctx
task.add({
  title: 'Fetch user data',
  task: async (ctx) => { ctx.userData = await fetchUsers(); }
});

task.add({
  title: 'Fetch sales data',
  task: async (ctx) => { ctx.salesData = await fetchSales(); }
});

await task.complete();
```

---

### Methods

#### `task.add(config)` / `task.add([configs])`

Add one or multiple subtasks. Returns the created subtask(s) for chaining.

```javascript
// Add single subtask
const subtask = task.add({
  title: 'My Subtask',
  task: async (ctx, task) => { /* ... */ }
});

// Add multiple subtasks
const [sub1, sub2] = task.add([
  { title: 'Subtask 1', task: task1Fn },
  { title: 'Subtask 2', task: task2Fn }
]);

// Chain nested subtasks
const parent = task.add({ title: 'Parent' });
parent.add({ title: 'Child 1', task: child1Fn });
parent.add({ title: 'Child 2', task: child2Fn });

// Deep nesting
const level1 = task.add({ title: 'Level 1' });
const level2 = level1.add({ title: 'Level 2' });
const level3 = level2.add({ title: 'Level 3', task: deepTaskFn });
```

**Subtask Config Options:**

| Option | Type | Description |
|--------|------|-------------|
| `title` | `string` | **Required.** Subtask title |
| `task` | `(ctx, task) => Promise` | Subtask executor |
| `options` | `object` | `{ concurrent, exitOnError }` for children |
| `skip` | `(ctx) => boolean \| string` | Skip condition |
| `retry` | `{ tries, delay? }` | Retry configuration |
| `rollback` | `(ctx, task) => Promise` | Rollback on failure |

---

#### `task.complete()`

Signal that no more subtasks will be added and wait for execution to finish.

```javascript
const task = createTask({ title: 'My Task' });

task.add({ title: 'Step 1', task: step1Fn });
task.add({ title: 'Step 2', task: step2Fn });

// Wait for all tasks to complete
await task.complete();

console.log('All done!');
console.log('Final state:', task.state); // 'completed'
```

> ⚠️ After calling `complete()`, no new subtasks can be added.

---

#### `task.forceShutdown(reason?)`

Immediately stop execution and fail the task.

```javascript
const task = createTask({ title: 'Long Running Task' });

// Handle interruption
process.on('SIGINT', () => {
  task.forceShutdown('User cancelled');
  process.exit(1);
});

// Or with custom reason
setTimeout(() => {
  task.forceShutdown('Timeout exceeded');
}, 30000);
```

---

### Dynamic Title & Output

Update the task title and display status messages during execution.

#### Updating Title

```javascript
task.add({
  title: 'Downloading...',
  task: async (ctx, task) => {
    const files = ['data.json', 'config.yaml', 'readme.md'];
    
    for (let i = 0; i < files.length; i++) {
      task.title = `Downloading ${files[i]} (${i + 1}/${files.length})`;
      await downloadFile(files[i]);
    }
    
    task.title = `Downloaded ${files.length} files ✓`;
  }
});
```

**Terminal Output (during execution):**
```
◼ Downloading data.json (1/3)
◼ Downloading config.yaml (2/3)
◼ Downloading readme.md (3/3)
✔ Downloaded 3 files ✓
```

#### Displaying Status Output

```javascript
task.add({
  title: 'Database Migration',
  task: async (ctx, task) => {
    task.output = 'Connecting to database...';
    await connect();
    
    task.output = 'Running migrations...';
    await runMigrations();
    
    task.output = 'Seeding data...';
    await seedData();
    
    task.output = 'Migration complete!';
  }
});
```

**Terminal Output (during execution):**
```
◼ Database Migration
  → Seeding data...
```

#### Combining Both

```javascript
task.add({
  title: 'Processing items',
  task: async (ctx, task) => {
    const items = await fetchItems();
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      task.title = `Processing item ${i + 1}/${items.length}`;
      task.output = `Current: ${item.name}`;
      
      await processItem(item);
    }
    
    task.title = `Processed ${items.length} items ✓`;
    task.output = '';  // Clear output
  }
});
```

---

### Event Listeners

#### `task.state$(callback)`

Subscribe to state changes. Returns an unsubscribe function.

```javascript
const unsubscribe = task.state$((state) => {
  console.log('State changed:', state);
  // 'pending' → 'processing' → 'completed' | 'failed'
});

// Later, stop listening
unsubscribe();
```

**States:**

| State | Description |
|-------|-------------|
| `'pending'` | Task created, waiting for subtasks or execution |
| `'processing'` | Currently executing tasks |
| `'completed'` | All tasks finished successfully |
| `'failed'` | Execution failed or was force shutdown |

---

#### `task.subtasks$(callback)`

Subscribe to subtask additions. Returns an unsubscribe function.

```javascript
const unsubscribe = task.subtasks$((subtask) => {
  console.log('Subtask added:', subtask.title);
});

task.add({ title: 'Step 1', task: step1Fn });
// Console: "Subtask added: Step 1"

// Stop listening
unsubscribe();
```

---

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `task.state` | `string` | Current state |
| `task.title` | `string` | Task title |
| `task.mode` | `string` | Execution mode |
| `task.task` | `function` | Main task executor |
| `task.ctx` | `object` | Shared context object |
| `task.promise` | `Promise` | Completion promise |
| `task.subtaskCount` | `number` | Total subtask count |
| `task.pendingSubtaskCount` | `number` | Pending subtasks |
| `task.isPending` | `boolean` | Is in pending state |
| `task.isProcessing` | `boolean` | Is processing |
| `task.isCompleted` | `boolean` | Is completed |
| `task.isFailed` | `boolean` | Is failed |

---

### Shared Context (`ctx`)

All task and subtask functions share the same `ctx` object, enabling data passing between them.

```javascript
const task = createTask({
  title: 'Data Pipeline',
  mode: 'before',
  task: async (ctx, task) => {
    // Initialize context
    task.output = 'Initializing...';
    ctx.startTime = Date.now();
    ctx.items = [];
  }
});

task.add({
  title: 'Fetch data',
  task: async (ctx, task) => {
    task.output = 'Fetching from API...';
    ctx.rawData = await fetchData();
  }
});

task.add({
  title: 'Process data',
  task: async (ctx, task) => {
    task.output = `Processing ${ctx.rawData.length} records...`;
    ctx.items = ctx.rawData.map(transform);
  }
});

task.add({
  title: 'Save results',
  task: async (ctx, task) => {
    await saveItems(ctx.items);
    ctx.duration = Date.now() - ctx.startTime;
    task.title = `Saved ${ctx.items.length} items ✓`;
  }
});

await task.complete();

console.log(`Processed ${task.ctx.items.length} items in ${task.ctx.duration}ms`);
```

---

### Auto Behaviors

ListrX provides two auto behavior timers for hands-free task management.

#### `autoComplete`

Automatically completes the task after all subtasks finish and no new subtasks are added for the specified duration.

**How it works:**

1. All current subtasks finish executing
2. Timer starts (e.g., 500ms)
3. If a new subtask is added during the timer:
   - Timer is cancelled
   - New subtask executes
   - When done, timer restarts from step 2
4. If timer expires with no new subtasks → task completes

```javascript
const task = createTask({
  title: 'File Processor',
  autoComplete: 1000  // Complete 1s after idle
});

// Initial subtasks
task.add({ title: 'Process file 1', task: processFile1 });
task.add({ title: 'Process file 2', task: processFile2 });

// Files finish → timer starts (1000ms)

// If a new file arrives during the wait:
setTimeout(() => {
  task.add({ title: 'Process file 3', task: processFile3 });
  // Timer resets after file 3 completes
}, 500);

// Wait for auto-completion
await task.promise;
```

**Timeline visualization:**

```
add(A) → add(B) → [A done] → [B done] → [timer: 1000ms] → ✓ complete
                                              │
                                         no new subtasks

add(A) → [A done] → [timer starts] → add(B) → [timer cancelled]
                                                     │
                                              [B done] → [timer restarts] → ✓ complete
```

---

#### `autoExecute`

For `mode: 'after'` — automatically executes the main task after no new subtasks have been added for the specified duration.

**How it works:**

1. Subtasks are being added
2. No new subtask added for the duration → timer fires
3. Any pending subtasks execute
4. Main task executes
5. `autoComplete` timer can then start (if configured)

```javascript
const task = createTask({
  title: 'Batch Processor',
  mode: 'after',
  autoExecute: 500,  // Execute 500ms after last subtask added
  task: async (ctx, task) => {
    task.output = `Processing ${ctx.items.length} items...`;
    await generateSummary(ctx.items);
    task.title = `Processed ${ctx.items.length} items ✓`;
  }
});

// Initialize context
task.ctx.items = [];

// Rapidly add subtasks
task.add({
  title: 'Item 1',
  task: async (ctx) => { ctx.items.push(await fetchItem(1)); }
});

task.add({
  title: 'Item 2',
  task: async (ctx) => { ctx.items.push(await fetchItem(2)); }
});

// 500ms after last add() with no new subtasks:
// 1. Subtasks execute
// 2. Main task executes

await task.promise;
```

---

#### Combining Both

Use both timers for complete hands-free operation:

```javascript
const task = createTask({
  title: 'Watch & Build',
  mode: 'after',
  autoExecute: 500,   // Run main task 500ms after last subtask added
  autoComplete: 2000, // Complete 2s after everything finishes
  task: async (ctx, task) => {
    task.output = `Building ${ctx.files.length} files...`;
    await buildProject(ctx.files);
    task.title = `Built ${ctx.files.length} files ✓`;
  }
});

task.ctx.files = [];

// File watcher integration
watcher.on('change', (file) => {
  task.add({
    title: `Compile ${file}`,
    task: async (ctx) => {
      ctx.files.push(file);
      await compile(file);
    }
  });
});

// Flow:
// 1. Files change → subtasks added
// 2. 500ms of no new files → subtasks run → main task runs
// 3. 2000ms of idle after main task → auto-complete
// 4. If new file during step 3 → restart from step 1
```

---

### Error Handling

#### Retry

Automatically retry failed subtasks:

```javascript
task.add({
  title: 'Flaky API call',
  task: async (ctx, task) => {
    task.output = 'Attempting API call...';
    await callFlakyApi();
  },
  retry: {
    tries: 3,    // Retry up to 3 times
    delay: 1000  // Wait 1s between retries
  }
});
```

#### Skip

Conditionally skip subtasks:

```javascript
task.add({
  title: 'Optional step',
  task: async (ctx) => await optionalWork(),
  skip: (ctx) => {
    if (ctx.skipOptional) {
      return 'Skipped by user request';  // Custom skip message
    }
    return false;  // Don't skip
  }
});
```

#### Rollback

Execute cleanup on failure:

```javascript
task.add({
  title: 'Database migration',
  task: async (ctx, task) => {
    task.output = 'Starting migration...';
    ctx.migrationId = await startMigration();
    await runMigration();
  },
  rollback: async (ctx, task) => {
    task.output = 'Rolling back migration...';
    await rollbackMigration(ctx.migrationId);
  }
});
```

---

## 📚 Examples

### Basic Sequential Tasks

```javascript
import { createTask } from '@shoru/listrx';

async function deploy() {
  const task = createTask({ title: '🚀 Deploy Application' });

  task.add({
    title: 'Install dependencies',
    task: async (ctx, task) => {
      task.output = 'Running npm ci...';
      await exec('npm ci');
    }
  });

  task.add({
    title: 'Run tests',
    task: async (ctx, task) => {
      task.output = 'Executing test suite...';
      const result = await exec('npm test');
      ctx.testsPassed = result.exitCode === 0;
      task.title = ctx.testsPassed ? 'Tests passed ✓' : 'Tests failed ✗';
    }
  });

  task.add({
    title: 'Build',
    task: async (ctx, task) => {
      task.output = 'Building for production...';
      await exec('npm run build');
    },
    skip: (ctx) => !ctx.testsPassed && 'Tests failed'
  });

  task.add({
    title: 'Deploy',
    task: async (ctx, task) => {
      task.output = 'Deploying to production...';
      await exec('npm run deploy');
      task.title = 'Deployed successfully ✓';
    },
    skip: (ctx) => !ctx.testsPassed && 'Tests failed'
  });

  await task.complete();
}
```

---

### Concurrent Subtasks

```javascript
const task = createTask({
  title: '🖼️ Process Images',
  options: { concurrent: true }  // All subtasks run in parallel
});

const images = await getImages();

for (const image of images) {
  task.add({
    title: `Process ${image.name}`,
    task: async (ctx, task) => {
      task.output = 'Resizing...';
      await resize(image);
      
      task.output = 'Optimizing...';
      await optimize(image);
      
      task.output = 'Uploading...';
      await upload(image);
      
      task.title = `${image.name} ✓`;
    }
  });
}

await task.complete();
```

---

### Progress Tracking

```javascript
task.add({
  title: 'Uploading files',
  task: async (ctx, task) => {
    const files = await getFilesToUpload();
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const progress = Math.round(((i + 1) / files.length) * 100);
      
      task.title = `Uploading files (${progress}%)`;
      task.output = `Current: ${file.name} (${file.size} bytes)`;
      
      await uploadFile(file);
    }
    
    task.title = `Uploaded ${files.length} files ✓`;
    task.output = '';
  }
});
```

---

### Deep Nesting

```javascript
const task = createTask({ title: '🏢 Enterprise Build' });

// Frontend
const frontend = task.add({ title: 'Frontend' });

const react = frontend.add({ title: 'React App' });
react.add({ title: 'Install deps', task: installReactDeps });
react.add({ title: 'Build', task: buildReact });
react.add({ title: 'Test', task: testReact });

const styles = frontend.add({ title: 'Styles' });
styles.add({ title: 'Compile SCSS', task: compileScss });
styles.add({ title: 'PostCSS', task: runPostcss });

// Backend
const backend = task.add({ title: 'Backend' });

const api = backend.add({ title: 'API Server' });
api.add({ title: 'Compile TypeScript', task: compileTs });
api.add({ title: 'Generate OpenAPI', task: generateOpenApi });

const workers = backend.add({ title: 'Workers' });
workers.add({ title: 'Build workers', task: buildWorkers });

await task.complete();
```

**Output:**
```
✔ 🏢 Enterprise Build
  ├── ✔ Frontend
  │   ├── ✔ React App
  │   │   ├── ✔ Install deps
  │   │   ├── ✔ Build
  │   │   └── ✔ Test
  │   └── ✔ Styles
  │       ├── ✔ Compile SCSS
  │       └── ✔ PostCSS
  └── ✔ Backend
      ├── ✔ API Server
      │   ├── ✔ Compile TypeScript
      │   └── ✔ Generate OpenAPI
      └── ✔ Workers
          └── ✔ Build workers
```

---

### Cross-Module Injection

Share a task across modules for decentralized subtask registration.

**main.js:**
```javascript
import { createTask } from '@shoru/listrx';
import { registerAuthTasks } from './modules/auth.js';
import { registerDbTasks } from './modules/database.js';
import { registerCacheTasks } from './modules/cache.js';

// Create shared task with auto-complete
export const initTask = createTask({
  title: '🚀 Initialize Application',
  autoComplete: 500  // Complete 500ms after all modules done
});

// Each module registers its subtasks
registerAuthTasks(initTask);
registerDbTasks(initTask);
registerCacheTasks(initTask);

// Wait for completion
await initTask.promise;
console.log('Application initialized!');
```

**modules/auth.js:**
```javascript
export function registerAuthTasks(task) {
  const auth = task.add({ title: '🔐 Auth Module' });
  
  auth.add({
    title: 'Load JWT keys',
    task: async (ctx, task) => {
      task.output = 'Loading keys from vault...';
      ctx.jwtKeys = await loadJwtKeys();
    }
  });
  
  auth.add({
    title: 'Initialize OAuth providers',
    task: async (ctx, task) => {
      task.output = 'Configuring OAuth...';
      await initOAuth();
    }
  });
}
```

**modules/database.js:**
```javascript
export function registerDbTasks(task) {
  const db = task.add({ title: '🗄️ Database Module' });
  
  db.add({
    title: 'Connect to database',
    task: async (ctx, task) => {
      task.output = 'Establishing connection...';
      ctx.db = await connectDatabase();
      task.title = 'Database connected ✓';
    },
    retry: { tries: 3, delay: 1000 }
  });
  
  db.add({
    title: 'Run migrations',
    task: async (ctx, task) => {
      task.output = 'Applying migrations...';
      await runMigrations(ctx.db);
    }
  });
}
```

**modules/cache.js:**
```javascript
export function registerCacheTasks(task) {
  const cache = task.add({ title: '📦 Cache Module' });
  
  cache.add({
    title: 'Connect to Redis',
    task: async (ctx, task) => {
      task.output = 'Connecting to Redis cluster...';
      ctx.redis = await connectRedis();
    }
  });
  
  cache.add({
    title: 'Warm cache',
    task: async (ctx, task) => {
      task.output = 'Pre-loading frequently accessed data...';
      await warmCache(ctx.redis, ctx.db);
    }
  });
}
```

---

### Main Task with Preparation (Mode: before)

```javascript
const task = createTask({
  title: '📊 Data Export',
  mode: 'before',
  task: async (ctx, task) => {
    // Runs FIRST - setup
    task.output = 'Preparing export environment...';
    ctx.exportId = generateExportId();
    ctx.outputDir = await createTempDir();
    ctx.files = [];
    task.title = `📊 Data Export (${ctx.exportId})`;
  }
});

// These run AFTER setup
task.add({
  title: 'Export users',
  task: async (ctx, task) => {
    task.output = 'Exporting user records...';
    const file = await exportUsers(ctx.outputDir);
    ctx.files.push(file);
  }
});

task.add({
  title: 'Export orders',
  task: async (ctx, task) => {
    task.output = 'Exporting order history...';
    const file = await exportOrders(ctx.outputDir);
    ctx.files.push(file);
  }
});

task.add({
  title: 'Create archive',
  task: async (ctx, task) => {
    task.output = `Compressing ${ctx.files.length} files...`;
    ctx.archive = await createZip(ctx.files);
    task.title = 'Archive created ✓';
  }
});

await task.complete();
console.log(`Export complete: ${task.ctx.archive}`);
```

---

### Aggregation Pattern (Mode: after)

```javascript
const task = createTask({
  title: '📈 Generate Analytics Report',
  mode: 'after',
  task: async (ctx, task) => {
    // Runs LAST - aggregate all data
    task.output = 'Compiling report...';
    const report = {
      users: ctx.userStats,
      sales: ctx.salesStats,
      traffic: ctx.trafficStats,
      generatedAt: new Date()
    };
    
    task.output = 'Saving report...';
    await saveReport(report);
    
    task.output = 'Sending email...';
    await emailReport(report);
    
    task.title = '📈 Analytics Report Generated ✓';
  }
});

// These run FIRST - gather data in parallel
task.add({
  title: 'Fetch user statistics',
  task: async (ctx, task) => {
    task.output = 'Querying user database...';
    ctx.userStats = await fetchUserStats();
  }
});

task.add({
  title: 'Fetch sales statistics',
  task: async (ctx, task) => {
    task.output = 'Aggregating sales data...';
    ctx.salesStats = await fetchSalesStats();
  }
});

task.add({
  title: 'Fetch traffic statistics',
  task: async (ctx, task) => {
    task.output = 'Processing analytics logs...';
    ctx.trafficStats = await fetchTrafficStats();
  }
});

await task.complete();
```

---

### File Watcher with Auto Behaviors

```javascript
import { createTask } from '@shoru/listrx';
import { watch } from 'chokidar';

const task = createTask({
  title: '👁️ Watch & Build',
  mode: 'after',
  autoExecute: 300,   // Build 300ms after last file change
  autoComplete: 5000, // Complete after 5s of total inactivity
  options: { concurrent: true },
  task: async (ctx, task) => {
    task.output = `Building ${ctx.changedFiles.length} files...`;
    await runBuild(ctx.changedFiles);
    task.title = `👁️ Built ${ctx.changedFiles.length} files ✓`;
    ctx.changedFiles = [];  // Reset for next batch
  }
});

// Initialize
task.ctx.changedFiles = [];

// Watch for changes
const watcher = watch('./src/**/*.{ts,tsx}', {
  ignoreInitial: true
});

watcher.on('change', (filePath) => {
  task.add({
    title: `Detected: ${filePath}`,
    task: async (ctx) => {
      ctx.changedFiles.push(filePath);
    }
  });
});

watcher.on('add', (filePath) => {
  task.add({
    title: `New file: ${filePath}`,
    task: async (ctx) => {
      ctx.changedFiles.push(filePath);
    }
  });
});

// Handle shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down...');
  await watcher.close();
  task.forceShutdown('User interrupted');
  process.exit(0);
});

// Keep running until auto-complete or shutdown
await task.promise;
```

---

### Database Migration with Rollback

```javascript
const task = createTask({
  title: '🗄️ Database Migration',
  mode: 'before',
  task: async (ctx, task) => {
    task.output = 'Creating backup...';
    ctx.migrationLog = [];
    ctx.backupId = await createBackup();
    task.title = `🗄️ Database Migration (backup: ${ctx.backupId})`;
  }
});

task.add({
  title: 'Add users table',
  task: async (ctx, task) => {
    task.output = 'Creating users table...';
    await db.query('CREATE TABLE users (...)');
    ctx.migrationLog.push('users');
  },
  rollback: async (ctx, task) => {
    task.output = 'Dropping users table...';
    await db.query('DROP TABLE IF EXISTS users');
  }
});

task.add({
  title: 'Add posts table',
  task: async (ctx, task) => {
    task.output = 'Creating posts table...';
    await db.query('CREATE TABLE posts (...)');
    ctx.migrationLog.push('posts');
  },
  rollback: async (ctx, task) => {
    task.output = 'Dropping posts table...';
    await db.query('DROP TABLE IF EXISTS posts');
  }
});

task.add({
  title: 'Add indexes',
  task: async (ctx, task) => {
    task.output = 'Creating indexes...';
    await db.query('CREATE INDEX ...');
    ctx.migrationLog.push('indexes');
  },
  retry: { tries: 2, delay: 500 }
});

task.add({
  title: 'Seed data',
  task: async (ctx, task) => {
    task.output = 'Inserting seed data...';
    await seedDatabase();
  },
  skip: (ctx) => process.env.SKIP_SEED === 'true' && 'Seeding disabled'
});

try {
  await task.complete();
  console.log('Migration completed:', task.ctx.migrationLog);
} catch (error) {
  console.error('Migration failed, backup available:', task.ctx.backupId);
}
```

---

### State Monitoring & Logging

```javascript
const task = createTask({
  title: 'Long Running Process',
  showTimer: true
});

// Log state changes
task.state$((state) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] State: ${state}`);
});

// Log subtask additions
task.subtasks$((subtask) => {
  console.log(`Subtask registered: ${subtask.title}`);
});

// Add subtasks
task.add({ title: 'Step 1', task: step1 });
task.add({ title: 'Step 2', task: step2 });
task.add({ title: 'Step 3', task: step3 });

await task.complete();

console.log('Final stats:');
console.log(`  Total subtasks: ${task.subtaskCount}`);
console.log(`  Final state: ${task.state}`);
```

---

### CI/CD Pipeline

```javascript
import { createTask } from '@shoru/listrx';

async function runPipeline() {
  const task = createTask({
    title: '🔄 CI/CD Pipeline',
    showTimer: true,
    options: { exitOnError: true }
  });

  // Setup
  const setup = task.add({ title: '📦 Setup' });
  setup.add({ title: 'Checkout code', task: checkout });
  setup.add({ title: 'Install dependencies', task: npmInstall });
  setup.add({ title: 'Setup environment', task: setupEnv });

  // Quality
  const quality = task.add({ 
    title: '🔍 Quality Checks',
    options: { concurrent: true }  // Run checks in parallel
  });
  quality.add({ title: 'Lint', task: runLint });
  quality.add({ title: 'Type check', task: runTypeCheck });
  quality.add({ title: 'Security audit', task: runAudit });

  // Test
  const test = task.add({ title: '🧪 Tests' });
  test.add({ 
    title: 'Unit tests', 
    task: runUnitTests,
    options: { concurrent: true }
  });
  test.add({ 
    title: 'Integration tests', 
    task: runIntegrationTests 
  });
  test.add({ 
    title: 'E2E tests', 
    task: runE2ETests,
    retry: { tries: 2, delay: 5000 }
  });

  // Build
  const build = task.add({ 
    title: '🔨 Build',
    options: { concurrent: true }
  });
  build.add({ title: 'Build frontend', task: buildFrontend });
  build.add({ title: 'Build backend', task: buildBackend });

  // Deploy
  const deploy = task.add({ title: '🚀 Deploy' });
  deploy.add({ 
    title: 'Deploy to staging', 
    task: async (ctx, task) => {
      task.output = 'Uploading to staging server...';
      await deployStaging();
      task.title = 'Deployed to staging ✓';
    }
  });
  deploy.add({ 
    title: 'Run smoke tests', 
    task: async (ctx, task) => {
      task.output = 'Running smoke tests...';
      await runSmokeTests();
    },
    retry: { tries: 3, delay: 2000 }
  });
  deploy.add({ 
    title: 'Deploy to production', 
    task: async (ctx, task) => {
      task.output = 'Deploying to production...';
      await deployProd();
      task.title = 'Deployed to production ✓';
    },
    rollback: async (ctx, task) => {
      task.output = 'Rolling back production deployment...';
      await rollbackProd();
    }
  });

  try {
    await task.complete();
    console.log('\n✅ Pipeline completed successfully!');
  } catch (error) {
    console.error('\n❌ Pipeline failed:', error.message);
    process.exit(1);
  }
}

runPipeline();
```

**Output:**
```
✔ 🔄 CI/CD Pipeline [2m 34s]
  ├── ✔ 📦 Setup [15s]
  │   ├── ✔ Checkout code [2s]
  │   ├── ✔ Install dependencies [12s]
  │   └── ✔ Setup environment [1s]
  ├── ✔ 🔍 Quality Checks [8s]
  │   ├── ✔ Lint [6s]
  │   ├── ✔ Type check [8s]
  │   └── ✔ Security audit [3s]
  ├── ✔ 🧪 Tests [45s]
  │   ├── ✔ Unit tests [12s]
  │   ├── ✔ Integration tests [18s]
  │   └── ✔ E2E tests [15s]
  ├── ✔ 🔨 Build [20s]
  │   ├── ✔ Build frontend [18s]
  │   └── ✔ Build backend [20s]
  └── ✔ 🚀 Deploy [1m 6s]
      ├── ✔ Deployed to staging ✓ [25s]
      ├── ✔ Run smoke tests [11s]
      └── ✔ Deployed to production ✓ [30s]

✅ Pipeline completed successfully!
```

---

## 📊 State Machine

```
                    ┌─────────────────┐
                    │                 │
                    │     PENDING     │ ← Task created
                    │                 │
                    └────────┬────────┘
                             │
                             │ add() / complete() / autoExecute
                             ▼
                    ┌─────────────────┐
              ┌────►│                 │◄────┐
              │     │   PROCESSING    │     │ new subtasks added
              │     │                 │     │ while processing
              │     └────────┬────────┘─────┘
              │              │
              │              │ all done
              │              ▼
              │     ┌─────────────────┐
              │     │                 │
              └─────│  (idle period)  │ autoComplete timer
                    │                 │
                    └────────┬────────┘
                             │
            ┌────────────────┴────────────────┐
            │                                 │
            ▼                                 ▼
   ┌─────────────────┐               ┌─────────────────┐
   │                 │               │                 │
   │    COMPLETED    │               │     FAILED      │
   │                 │               │                 │
   └─────────────────┘               └─────────────────┘
         success                      error / forceShutdown
```

---

## 🧪 Testing

Use `renderer: 'silent'` to disable terminal output during tests.

```javascript
import { createTask } from '@shoru/listrx';
import { describe, it, expect, beforeEach } from 'vitest';

describe('Task Processing', () => {
  it('should execute subtasks in order', async () => {
    const results = [];

    const task = createTask({
      title: 'Test Task',
      rendererOptions: { renderer: 'silent' }
    });

    task.add({
      title: 'Step 1',
      task: async () => { results.push(1); }
    });

    task.add({
      title: 'Step 2',
      task: async () => { results.push(2); }
    });

    task.add({
      title: 'Step 3',
      task: async () => { results.push(3); }
    });

    await task.complete();

    expect(results).toEqual([1, 2, 3]);
    expect(task.state).toBe('completed');
    expect(task.subtaskCount).toBe(3);
  });

  it('should share context between tasks', async () => {
    const task = createTask({
      title: 'Context Test',
      mode: 'before',
      rendererOptions: { renderer: 'silent' },
      task: async (ctx) => {
        ctx.initialized = true;
      }
    });

    task.add({
      title: 'Check context',
      task: async (ctx) => {
        expect(ctx.initialized).toBe(true);
        ctx.value = 42;
      }
    });

    await task.complete();

    expect(task.ctx.initialized).toBe(true);
    expect(task.ctx.value).toBe(42);
  });

  it('should allow dynamic title updates', async () => {
    const task = createTask({
      title: 'Dynamic Title Test',
      rendererOptions: { renderer: 'silent' }
    });

    let finalTitle = '';

    task.add({
      title: 'Initial Title',
      task: async (ctx, t) => {
        t.title = 'Updated Title';
        finalTitle = t.title;
      }
    });

    await task.complete();

    expect(finalTitle).toBe('Updated Title');
  });

  it('should handle nested subtasks', async () => {
    const results = [];

    const task = createTask({
      title: 'Nested Test',
      rendererOptions: { renderer: 'silent' }
    });

    const parent = task.add({ title: 'Parent' });
    parent.add({
      title: 'Child 1',
      task: async () => { results.push('child1'); }
    });
    parent.add({
      title: 'Child 2',
      task: async () => { results.push('child2'); }
    });

    await task.complete();

    expect(results).toEqual(['child1', 'child2']);
  });

  it('should respect skip conditions', async () => {
    const results = [];

    const task = createTask({
      title: 'Skip Test',
      rendererOptions: { renderer: 'silent' }
    });

    task.ctx.shouldSkip = true;

    task.add({
      title: 'Skipped',
      task: async () => { results.push('skipped'); },
      skip: (ctx) => ctx.shouldSkip
    });

    task.add({
      title: 'Executed',
      task: async () => { results.push('executed'); }
    });

    await task.complete();

    expect(results).toEqual(['executed']);
  });
});
```

---

## 🔧 Advanced Configuration

### Custom Renderer

```javascript
import { createTask } from '@shoru/listrx';

// Use simple renderer for CI environments
const task = createTask({
  title: 'CI Build',
  rendererOptions: {
    renderer: process.env.CI ? 'simple' : 'default'
  }
});
```

### Default Subtask Options

```javascript
// All subtasks inherit these options
const task = createTask({
  title: 'Parallel Processing',
  defaultSubtaskOptions: {
    concurrent: true,
    exitOnError: false
  }
});

// Subtasks run concurrently by default
task.add({ title: 'Task 1', task: task1 });
task.add({ title: 'Task 2', task: task2 });
task.add({ title: 'Task 3', task: task3 });
```

### Batch Debouncing

```javascript
// Batch rapid additions together
const task = createTask({
  title: 'Batch Demo',
  batchDebounceMs: 100  // Wait 100ms before processing batch
});

// These will be batched together
for (let i = 0; i < 100; i++) {
  task.add({ title: `Item ${i}`, task: processItem });
}
```

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Made with ❤️ for the Node.js CLI community**

[⬆ Back to Top](#-listrx)

</div>