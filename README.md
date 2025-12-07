<div align="center">

# 🚀 ListrX

**Beautiful CLI task management with dynamic subtask injection**

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Downloads](https://img.shields.io/npm/d18m/@shoru/listrx.svg?style=for-the-badge)](https://www.npmjs.com/package/@shoru/listrx)
[![npm](https://img.shields.io/npm/v/@shoru/listrx.svg?style=for-the-badge)](https://www.npmjs.com/package/@shoru/listrx)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

[Installation](#installation) · [Quick Start](#quick-start) · [API](#api-reference) · [Examples](#examples)

</div>

---

<div align="center">

## Features

| | Feature | Description |
|---|---|---|
| 🎯 | **Dynamic Subtasks** | Add and nest subtasks at runtime |
| 🔄 | **Setup & Task Phases** | Separate initialization from execution |
| ✨ | **Ora-like API** | Familiar `succeed()`, `fail()`, `warn()`, `info()` methods |
| 🎡 | **Animated Spinners** | Beautiful tree-structured output with colors |
| 🔁 | **Error Handling** | Built-in retry, skip, and rollback support |
| 🤫 | **Console Safe** | Intercepts logs without breaking the display |
| 🧪 | **Test Friendly** | Silent renderer for testing |

---

## Installation

```bash
npm install @shoru/listrx
```

> Requires Node.js 18+

---

## Quick Start

### Task with Subtasks

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

### Simple Spinner

```javascript
import { loader } from '@shoru/listrx';

const spinner = loader('Loading...').start();
await fetchData();
spinner.succeed('Done');
```

```
✔ Done
```

---

## API Reference

### Exports

```javascript
import { createTask, loader } from '@shoru/listrx';
```

---

### `loader(title?)`

Simple ora-like spinner.

```javascript
const spinner = loader('Working...').start();

spinner.text = 'Still working...';
spinner.color = 'yellow';

spinner.succeed('Complete');  // ✔
spinner.fail('Failed');       // ✖
spinner.warn('Warning');      // ⚠
spinner.info('Info');         // ℹ
spinner.stop();               // No icon
```

| Property | Type | Description |
|----------|------|-------------|
| `text` / `title` | `string` | Spinner text |
| `color` | `SpinnerColor` | Spinner color |
| `isSpinning` | `boolean` | Active state |

---

### `createTask(config)`

Full-featured task with subtask support.

```javascript
const task = createTask({
  title: 'My Task',                    // Required
  
  // Execution
  setup: async (ctx, task) => {},      // Runs first, always
  task: async (ctx, task) => {},       // Runs based on mode
  mode: 'before',                      // 'before' | 'after' subtasks
  
  // Subtask options
  options: {
    concurrent: false,                 // Parallel execution
    exitOnError: true                  // Stop on failure
  },
  
  // Auto behaviors
  autoComplete: 1000,                  // Complete after idle (ms)
  autoExecute: 500,                    // Execute after no new subtasks (ms)
  
  // Error handling
  retry: { tries: 3, delay: 1000 },
  skip: (ctx) => false,
  rollback: async (ctx, task) => {},
  
  // Display
  showTimer: false,
  spinnerColor: 'cyan',
  rendererOptions: { renderer: 'default' }  // 'default' | 'simple' | 'silent'
});
```

#### Execution Order

| Mode | Order |
|------|-------|
| `'before'` | setup → **task** → subtasks |
| `'after'` | setup → subtasks → **task** |

---

### Task Methods

```javascript
// Add subtasks
const sub = task.add({ title: 'Step 1', task: async () => {} });
const [a, b] = task.add([{ title: 'A' }, { title: 'B' }]);

// Nest subtasks
const parent = task.add({ title: 'Parent' });
parent.add({ title: 'Child' });

// Complete
await task.complete();

// Force stop
task.forceShutdown('Cancelled');

// Listen to events
const unsub = task.state$((state) => console.log(state));
const unsub = task.subtasks$((subtask) => console.log(subtask.title));
```

---

### Subtask Methods

```javascript
task.add({
  title: 'Check',
  task: async (ctx, task) => {
    task.title = 'Checking...';
    task.output = 'Step 1 of 3';
    task.spinnerColor = 'yellow';
    
    // Final states (ora-like)
    task.succeed('All good');     // ✔ green
    task.fail('Error');           // ✖ red
    task.warn('Warning');         // ⚠ yellow
    task.info('Note');            // ℹ blue
  }
});
```

---

### Task Properties

```javascript
task.state          // 'pending' | 'processing' | 'completed' | 'failed'
task.title          // Task title
task.ctx            // Shared context
task.promise        // Completion promise
task.subtaskCount   // Total subtasks
task.isPending / isProcessing / isCompleted / isFailed
```

---

### Spinner Colors

```typescript
type SpinnerColor = 
  | 'black' | 'red' | 'green' | 'yellow' | 'blue' 
  | 'magenta' | 'cyan' | 'white' | 'gray' | 'grey'
  | 'redBright' | 'greenBright' | 'yellowBright' 
  | 'blueBright' | 'magentaBright' | 'cyanBright' | 'whiteBright';
```

---

## Examples

### Nested Tasks

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

### Setup + Task Phases

```javascript
const task = createTask({
  title: 'Pipeline',
  mode: 'after',
  
  setup: async (ctx) => {
    ctx.items = [];  // Initialize context
  },
  
  task: async (ctx, task) => {
    // Runs after subtasks
    await saveResults(ctx.items);
    task.succeed(`Saved ${ctx.items.length} items`);
  }
});

task.add({
  title: 'Fetch',
  task: async (ctx) => {
    ctx.items = await fetchItems();
  }
});

await task.complete();
```

---

### Concurrent Execution

```javascript
const task = createTask({
  title: 'Process Images',
  options: { concurrent: true }
});

for (const img of images) {
  task.add({
    title: img.name,
    task: async () => await processImage(img)
  });
}

await task.complete();
```

---

### Error Handling

```javascript
task.add({
  title: 'Upload',
  
  task: async (ctx, task) => {
    task.output = 'Uploading...';
    await upload();
  },
  
  retry: { tries: 3, delay: 1000 },
  
  skip: (ctx) => ctx.offline && 'No connection',
  
  rollback: async (ctx, task) => {
    task.output = 'Cleaning up...';
    await cleanup();
  }
});
```

---

### Mixed States

```javascript
task.add({
  title: 'Health Check',
  task: async (ctx, task) => {
    const status = await checkHealth();
    
    if (status.critical) {
      task.fail('Critical issues');
    } else if (status.warnings) {
      task.warn(`${status.warnings} warnings`);
    } else {
      task.succeed('Healthy');
    }
  }
});
```

```
✔ Health Check
  ├── ✔ Healthy
  ├── ⚠ 3 warnings
  └── ✖ Critical issues
```

---

### Timer Display

```javascript
const task = createTask({
  title: 'Build',
  showTimer: true
});

task.add({ title: 'Compile', task: compile });

await task.complete();
```

```
✔ Build [2.3s]
  └── ✔ Compile [2.1s]
```

---

### Auto Behaviors

```javascript
const task = createTask({
  title: 'Watch',
  autoExecute: 500,   // Run 500ms after last add()
  autoComplete: 2000  // Complete 2s after idle
});

watcher.on('change', (file) => {
  task.add({ title: file, task: compile });
});

await task.promise;
```

---

### Testing

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

## Renderers

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