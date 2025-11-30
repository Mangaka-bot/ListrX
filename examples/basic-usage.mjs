// examples/basic-usage.mjs
import { createQueue } from '../src/index.mjs';

async function main() {
  console.log('🚀 Basic Task Queue Example\n');
  
  // Create a new queue
  const queue = createQueue({
    concurrent: false,
    rendererOptions: {
      showTimer: true
    }
  });
  
  // Add tasks - they start processing immediately
  queue.add('Installing dependencies', async (ctx, task) => {
    await delay(1500);
    task.output = 'Found 142 packages';
    await delay(500);
  });
  
  queue.add('Building project', async (ctx, task) => {
    const steps = ['Compiling TypeScript', 'Bundling modules', 'Minifying output'];
    for (const step of steps) {
      task.output = step;
      await delay(800);
    }
  });
  
  queue.add('Running tests', async (ctx, task) => {
    task.output = 'Running 47 test suites...';
    await delay(2000);
    task.output = '✓ All tests passed';
    await delay(300);
  });
  
  // You can also await individual tasks
  const deployResult = await queue.add('Deploying to production', async () => {
    await delay(1000);
    return { url: 'https://example.com', version: '1.0.0' };
  });
  
  console.log('\n📦 Deploy result:', deployResult);
  
  // Signal that we're done adding tasks
  await queue.complete();
  
  console.log('\n✅ All tasks completed!');
  console.log('📊 Stats:', queue.stats);
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

main().catch(console.error);