<div align="center">

# 🚀 ListrX

**Beautiful CLI task management with dynamic subtask injection**

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Downloads](https://img.shields.io/npm/d18m/@shoru/listrx.svg?style=for-the-badge)](https://www.npmjs.com/package/@shoru/listrx)
[![npm](https://img.shields.io/npm/v/@shoru/listrx.svg?style=for-the-badge)](https://www.npmjs.com/package/@shoru/listrx)
[![Types](https://img.shields.io/badge/types-included-blue?style=for-the-badge&logo=typescript)](https://github.com/Mangaka-bot/ListrX/tree/main/dist)

[Installation](#-installation) · [Quick Start](#-quick-start) · [API](#-api-reference) · [Examples](#-examples)

</div>

---

<div align="center">

## ✨ Features

| | Feature | Description |
|---|---|---|
| 🎯 | **Dynamic Subtasks** | Add and nest subtasks at runtime |
| 🔄 | **Lifecycle Hooks** | `setup` → `task` → `afterEach` → `finally` |
| ✨ | **Ora-like API** | Familiar `succeed()`, `fail()`, `warn()`, `info()` methods |
| 🎡 | **Animated Spinners** | Beautiful tree-structured output with colors |
| 🔁 | **Error Handling** | Built-in retry, skip, and rollback support |
| 🤫 | **Console Safe** | Intercepts logs without breaking the display |
| 🧪 | **Test Friendly** | Silent renderer for CI/testing |

</div>

---

## 📦 Installation

```bash
npm install @shoru/listrx
```

> Requires Node.js 18+

---

## 🚀 Quick Start

```javascript
import { createTask } from '@shoru/listrx';

const task = createTask({ title: '🚀 Deploy' });

task.add({ title: 'Build', task: async () => await build() });
task.add({ title: 'Test', task: async () => await test() });
task.add({ title: 'Upload', task: async () => await upload() });

await task.complete();
```

```
✔ 🚀 Deploy
  ├── ✔ Build
  ├── ✔ Test
  └── ✔ Upload
```

---

## 📖 API Reference

### Exports

```javascript
import { createTask, loader } from '@shoru/listrx';
```

---

### `loader(title?)`

Simple ora-like spinner for quick operations.

```javascript
const spinner = loader('Working...').start();
spinner.text = 'Still working...';
spinner.color = 'yellow';
spinner.succeed('Complete');  // ✔ | Also: fail(), warn(), info(), stop()
```

---

### `createTask(config)`

Full-featured task with subtask support and lifecycle hooks.

```javascript
const task = createTask({
  title: 'My Task',  // Required
  
  // 🔄 Lifecycle hooks
  setup: async (ctx, task) => {},                              // Runs once, first
  task: async (ctx, task, type) => {},                         // Runs after setup (type: 'initial' | 'auto' | 'retry')
  afterEach: async (ctx, completedSubtask, mainTask) => {},    // After each subtask
  finally: async (ctx, task) => {},                            // Runs last, once
  
  // ⚙️ Execution options
  options: { concurrent: false, exitOnError: true },
  
  // ⏱️ Auto behaviors (for watch mode / streaming)
  autoExecute: 500,      // Run task X ms after last add() - task stays open
  autoComplete: 2000,    // Complete X ms after idle - task closes
  
  // 🔁 Error handling
  retry: { tries: 3, delay: 1000 },
  skip: (ctx) => false,
  rollback: async (ctx, task) => {},
  
  // 🎨 Display
  showTimer: false,
  spinnerColor: 'cyan',
  rendererOptions: { renderer: 'default' }  // 'default' | 'simple' | 'silent'
});
```

#### 🔄 Lifecycle Execution Order

```
setup (once) → task → subtasks → finally
                 ↓        ↓
             afterEach  afterEach (per subtask)
```

| Hook | Runs | Purpose |
|------|------|---------|
| `setup` | Once | Initialize context, setup resources |
| `task` | Once (or per `autoExecute`) | Main work before subtasks |
| `afterEach` | Per subtask | Track progress, logging |
| `finally` | Once | Cleanup, final message |

#### 🏷️ Execution Type

The `task` function receives a third parameter `type` indicating how it's being executed:

```javascript
task: async (ctx, task, type) => {
  // type: 'initial' | 'auto' | 'retry'
}
```

| Type | When | Description |
|------|------|-------------|
| `'initial'` | First execution | Regular call on first attempt |
| `'auto'` | `autoExecute` trigger | Called when `autoExecute` timer fires |
| `'retry'` | Retry attempts | Called on retry after failure |

```javascript
const task = createTask({
  title: 'Smart Task',
  retry: { tries: 3, delay: 1000 },
  task: async (ctx, task, type) => {
    if (type === 'retry') {
      task.output = 'Retrying with fallback strategy...';
      return fallbackMethod();
    }
    return primaryMethod();
  }
});
```

#### ⏱️ Auto Behaviors

For watch mode or streaming scenarios where subtasks arrive over time:

| Property | Behavior |
|----------|----------|
| `autoExecute` | Triggers `task` (setup only once) after X ms of no new subtasks. Task stays **open**. |
| `autoComplete` | Triggers `finally` and **closes** task after X ms of complete idle. |

---

### 🛠️ Task Methods

```javascript
// Add subtasks (single or batch)
const sub = task.add({ title: 'Step 1', task: async () => {} });
const [a, b] = task.add([{ title: 'A' }, { title: 'B' }]);

// Nest subtasks
const parent = task.add({ title: 'Parent' });
parent.add({ title: 'Child' });

// Control
await task.complete();           // Finish task (runs finally)
task.forceShutdown('Reason');    // Abort immediately

// Subscribe to events
task.state$((state) => {});      // 'pending' | 'processing' | 'completed' | 'failed'
task.subtasks$((subtask) => {}); // Called when subtask is added
```

---

### 📋 Subtask Control

Inside a task function, control the subtask state:

```javascript
task.add({
  title: 'Check',
  task: async (ctx, task, type) => {
    task.title = 'Checking...';      // Update title
    task.output = 'Step 1 of 3';     // Show status line
    task.spinnerColor = 'yellow';
    
    // Handle different execution types
    if (type === 'retry') {
      task.output = 'Retrying...';
    }
    
    // Final states (ora-like)
    task.succeed('All good');        // ✔ green
    task.fail('Error');              // ✖ red
    task.warn('Warning');            // ⚠ yellow
    task.info('Note');               // ℹ blue
  }
});
```

---

### 📊 Task Properties

```javascript
task.state           // 'pending' | 'processing' | 'completed' | 'failed'
task.title           // Task title
task.ctx             // Shared context object
task.promise         // Awaitable completion promise
task.subtaskCount    // Total subtask count
task.isPending / isProcessing / isCompleted / isFailed
```

---

### 🎨 Spinner Colors

```typescript
type SpinnerColor = 
  | 'black' | 'red' | 'green' | 'yellow' | 'blue' 
  | 'magenta' | 'cyan' | 'white' | 'gray' | 'grey'
  | 'redBright' | 'greenBright' | 'yellowBright' 
  | 'blueBright' | 'magentaBright' | 'cyanBright' | 'whiteBright';
```

---

## 💡 Examples

### 🏗️ Nested Tasks

```javascript
const task = createTask({ title: '🏗️ Build' });

const frontend = task.add({ title: 'Frontend' });
frontend.add({ title: 'TypeScript', task: compileTs });
frontend.add({ title: 'CSS', task: bundleCss });

const backend = task.add({ title: 'Backend' });
backend.add({ title: 'Compile', task: compile });

await task.complete();
```

```
✔ 🏗️ Build
  ├── ✔ Frontend
  │   ├── ✔ TypeScript
  │   └── ✔ CSS
  └── ✔ Backend
      └── ✔ Compile
```

---

### 🔄 Lifecycle Hooks

```javascript
const task = createTask({
  title: 'Pipeline',
  
  setup: async (ctx) => {
    ctx.startTime = Date.now();
    ctx.completed = 0;
  },
  
  task: async (ctx, task, type) => {
    task.output = 'Loading config...';
    ctx.config = await loadConfig();
  },
  
  afterEach: async (ctx, completedSubtask, mainTask) => {
    ctx.completed++;
    mainTask.output = `Progress: ${ctx.completed}/${mainTask.childCount}`;
  },
  
  finally: async (ctx, task) => {
    const duration = Date.now() - ctx.startTime;
    task.succeed(`Done in ${duration}ms`);
  }
});

task.add({ title: 'Fetch', task: fetchData });
task.add({ title: 'Process', task: processData });
await task.complete();
```

---

### 👀 Watch Mode

Use `autoExecute` and `autoComplete` for file watchers or streaming data:

```javascript
const task = createTask({
  title: 'File Watcher',
  autoExecute: 500,    // Batch files, run task 500ms after last change
  autoComplete: 5000,  // Finish 5s after idle
  
  setup: async (ctx) => {
    ctx.batches = 0;   // Runs once
  },
  
  task: async (ctx, task, type) => {
    ctx.batches++;     // Runs each autoExecute trigger
    task.output = `Processing batch #${ctx.batches}`;
    
    // type will be 'initial' for first batch, 'auto' for subsequent
    if (type === 'auto') {
      task.output = `Auto-processing batch #${ctx.batches}`;
    }
  },
  
  finally: async (ctx, task) => {
    task.succeed(`Processed ${ctx.batches} batches`);
  }
});

watcher.on('change', (file) => {
  task.add({ title: file, task: () => compile(file) });
});

await task.promise;

// Timeline example:
// 0-200ms  - files added
// 700ms    - autoExecute → setup + task (type: 'initial', batch #1)
// 1000ms   - more files added
// 1500ms   - autoExecute → task only (type: 'auto', batch #2)
// 6500ms   - autoComplete → finally, task closes
```

---

### ⚡ Concurrent Execution

```javascript
const task = createTask({
  title: 'Process Images',
  options: { concurrent: true }
});

images.forEach(img => {
  task.add({ title: img.name, task: () => processImage(img) });
});

await task.complete();
```

---

### 🔁 Error Handling

```javascript
task.add({
  title: 'Upload',
  task: async (ctx, task, type) => {
    if (type === 'retry') {
      task.output = 'Retrying with exponential backoff...';
    } else {
      task.output = 'Uploading...';
    }
    await upload();
  },
  
  retry: { tries: 3, delay: 1000 },              // Retry on failure
  skip: (ctx) => ctx.offline && 'No connection', // Skip with reason
  rollback: async (ctx, task) => {               // Cleanup on failure
    await cleanup();
  }
});
```

---

### 🔁 Smart Retry Logic

```javascript
const task = createTask({
  title: 'API Call',
  retry: { tries: 3, delay: 2000 },
  
  task: async (ctx, task, type) => {
    switch (type) {
      case 'initial':
        task.output = 'Attempting primary endpoint...';
        return await callPrimaryAPI();
        
      case 'retry':
        task.output = 'Falling back to secondary endpoint...';
        return await callSecondaryAPI();
        
      case 'auto':
        task.output = 'Auto-refresh triggered...';
        return await refreshData();
    }
  }
});

await task.complete();
```

---

### ⏱️ Timer Display

```javascript
const task = createTask({ title: 'Build', showTimer: true });
task.add({ title: 'Compile', task: compile });
await task.complete();
```

```
✔ Build [2.3s]
  └── ✔ Compile [2.1s]
```

---

### 🧪 Testing (Silent Renderer)

```javascript
const task = createTask({
  title: 'Test',
  rendererOptions: { renderer: 'silent' }
});

task.add({ title: 'Step', task: async () => results.push(1) });
await task.complete();

expect(task.state).toBe('completed');
```

---

## 🖥️ Renderers

| Renderer | Output | Use Case |
|----------|--------|----------|
| `'default'` | Animated spinners | Interactive terminals |
| `'simple'` | Plain text | CI/CD, logs |
| `'silent'` | None | Testing |

```javascript
createTask({
  rendererOptions: {
    renderer: process.env.CI ? 'simple' : 'default'
  }
});
```

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create feature branch `git checkout -b feature/amazing-feature`
3. Commit changes `git commit -m 'Add amazing feature'`
4. Push `git push origin feature/amazing-feature`
5. Open Pull Request

---

<div align="center">

[![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)
<br>
This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

<br>

**Made with ❤️ for the Node.js CLI community**

[⬆ Back to Top](#-listrx)
</div>