import { EventEmitter } from 'events';
import { createQueue } from '../src/index.mjs';

class BuildPipeline extends EventEmitter {
  constructor(queue) {
    super();
    this.queue = queue;
  }

  async runBuild(config) {
    // Add main build task with dynamic subtasks based on config
    const result = await this.queue.addWithSubtasks('🏗️ Build Pipeline', [
      {
        title: 'Install Dependencies',
        task: async (ctx, task) => {
          this.emit('phase', 'install');
          task.output = 'Running npm install...';
          await delay(800);
          ctx.dependencies = { count: 142, time: '2.3s' };
        },
        subtasks: config.cleanInstall ? [
          { title: 'Remove node_modules', task: async () => await delay(300) },
          { title: 'Clear npm cache', task: async () => await delay(200) }
        ] : undefined,
        options: { concurrent: true }
      },
      {
        title: 'Compile Source',
        subtasks: [
          {
            title: 'TypeScript',
            task: async (ctx, task) => {
              const files = config.tsFiles || 50;
              task.output = `Compiling ${files} TypeScript files...`;
              await delay(600);
              ctx.tsCompiled = files;
            },
            enabled: config.typescript !== false
          },
          {
            title: 'Sass/CSS',
            task: async (ctx, task) => {
              task.output = 'Processing stylesheets...';
              await delay(400);
            },
            enabled: config.styles !== false
          },
          {
            title: 'Assets',
            task: async (ctx, task) => {
              task.output = 'Copying static assets...';
              await delay(300);
            }
          }
        ],
        options: { concurrent: true }
      },
      {
        title: 'Optimization',
        skip: () => config.skipOptimization ? 'Optimization disabled' : false,
        subtasks: [
          {
            title: 'Minify JavaScript',
            task: async (ctx, task) => {
              task.output = 'Terser running...';
              await delay(500);
            }
          },
          {
            title: 'Minify CSS',
            task: async () => await delay(300)
          },
          {
            title: 'Optimize Images',
            task: async () => await delay(400),
            skip: () => !config.optimizeImages
          }
        ],
        options: { concurrent: true }
      },
      {
        title: 'Generate Output',
        task: async (ctx, task) => {
          this.emit('phase', 'output');
          task.output = 'Writing bundle...';
          await delay(400);
          ctx.outputSize = '2.4MB';
        },
        subtasks: [
          { title: 'Create bundle', task: async () => await delay(300) },
          { title: 'Generate manifest', task: async () => await delay(200) },
          { 
            title: 'Create sourcemaps', 
            task: async () => await delay(400),
            enabled: config.sourcemaps !== false
          }
        ]
      }
    ], {
      subtaskOptions: { concurrent: false }
    });

    this.emit('complete', result);
    return result;
  }
}

async function main() {
  console.log('🔧 Event-Driven Build Pipeline with Subtasks\n');
  console.log('═'.repeat(60) + '\n');

  const queue = createQueue({
    concurrent: false,
    rendererOptions: {
      showTimer: true,
      collapseSubtasks: false
    }
  });

  const pipeline = new BuildPipeline(queue);

  // Listen to build events
  pipeline.on('phase', (phase) => {
    console.log(`\n📍 Entering phase: ${phase}`);
  });

  pipeline.on('complete', (result) => {
    console.log('\n🎉 Build completed!');
  });

  // Run build with configuration
  await pipeline.runBuild({
    typescript: true,
    styles: true,
    cleanInstall: true,
    optimizeImages: true,
    sourcemaps: true,
    tsFiles: 87
  });

  await queue.complete();
  console.log('\n📊 Stats:', queue.stats);
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

main().catch(console.error);