// examples/advanced.mjs
import { createQueue, DynamicTaskQueue } from '../src/index.mjs';
import { Subject, interval, merge } from 'rxjs';
import { take, map, delay as rxDelay, tap } from 'rxjs/operators';

async function main() {
  console.log('🔬 Advanced Task Queue Demo\n');
  console.log('═'.repeat(50));
  
  // Create queue with advanced options
  const queue = createQueue({
    concurrent: true,
    batchDebounceMs: 100,
    rendererOptions: {
      showTimer: true,
      suffixSkips: true
    }
  });
  
  // ========== REACTIVE STATE MONITORING ==========
  console.log('📡 Setting up state monitoring...\n');
  
  queue.state$.subscribe(state => {
    const stateIcons = {
      idle: '💤',
      processing: '⚙️',
      completing: '🏁',
      completed: '✅'
    };
    console.log(`\n${stateIcons[state]} Queue state: ${state.toUpperCase()}`);
  });
  
  // ========== MULTIPLE RX STREAMS FEEDING TASKS ==========
  
  // Stream 1: Periodic database backup tasks
  const backupStream$ = interval(800).pipe(
    take(3),
    map(i => ({
      title: `💾 Database backup #${i + 1}`,
      task: async (ctx, task) => {
        task.output = 'Creating snapshot...';
        await delay(400);
        task.output = 'Compressing data...';
        await delay(300);
        task.output = 'Uploading to S3...';
        await delay(500);
        return { backupId: `backup-${i + 1}`, size: '2.4GB' };
      }
    }))
  );
  
  // Stream 2: Cache invalidation tasks
  const cacheStream$ = interval(600).pipe(
    take(4),
    map(i => ({
      title: `🗑️  Invalidate cache region-${i + 1}`,
      task: async (ctx, task) => {
        const keys = Math.floor(Math.random() * 1000) + 500;
        task.output = `Scanning ${keys} keys...`;
        await delay(200);
        task.output = 'Invalidating...';
        await delay(300);
        return { region: `region-${i + 1}`, keysInvalidated: keys };
      }
    }))
  );
  
  // Stream 3: Log processing tasks
  const logStream$ = interval(1000).pipe(
    take(2),
    map(i => ({
      title: `📋 Process log batch ${i + 1}`,
      task: async (ctx, task) => {
        const entries = Math.floor(Math.random() * 10000) + 5000;
        task.output = `Parsing ${entries} log entries...`;
        await delay(600);
        task.output = 'Aggregating metrics...';
        await delay(400);
        task.output = 'Storing results...';
        await delay(300);
        return { batch: i + 1, entriesProcessed: entries };
      }
    }))
  );
  
  // Merge all streams and feed to queue
  const allTasks$ = merge(backupStream$, cacheStream$, logStream$);
  
  // Track all task promises
  const taskPromises = [];
  
  // Subscribe and add tasks to queue
  const subscription = allTasks$.subscribe({
    next: ({ title, task }) => {
      const promise = queue.add(title, task)
        .then(result => ({ title, result, success: true }))
        .catch(error => ({ title, error, success: false }));
      taskPromises.push(promise);
    },
    complete: async () => {
      console.log('\n📨 All task streams completed');
      
      // Wait for all tasks to finish
      const results = await Promise.all(taskPromises);
      
      // Signal queue completion
      await queue.complete();
      
      // Print summary
      console.log('\n' + '═'.repeat(50));
      console.log('📊 EXECUTION SUMMARY');
      console.log('═'.repeat(50));
      
      const successful = results.filter(r => r.success);
      const failed = results.filter(r => !r.success);
      
      console.log(`\n✅ Successful: ${successful.length}`);
      console.log(`❌ Failed: ${failed.length}`);
      console.log(`📈 Total: ${results.length}`);
      
      console.log('\n📋 Results:');
      for (const { title, result, success } of results) {
        if (success) {
          console.log(`  ✓ ${title}`);
          console.log(`    └─ ${JSON.stringify(result)}`);
        }
      }
    }
  });
}

// ========== BONUS: TASK QUEUE WITH PRIORITY ==========

class PriorityTaskQueue {
  #highPriorityQueue;
  #normalQueue;
  #lowPriorityQueue;
  
  constructor() {
    this.#highPriorityQueue = createQueue({ concurrent: false });
    this.#normalQueue = createQueue({ concurrent: true });
    this.#lowPriorityQueue = createQueue({ concurrent: true });
  }
  
  add(title, taskFn, priority = 'normal') {
    const queues = {
      high: this.#highPriorityQueue,
      normal: this.#normalQueue,
      low: this.#lowPriorityQueue
    };
    
    const prefix = { high: '🔴', normal: '🟡', low: '🟢' };
    return queues[priority].add(`${prefix[priority]} ${title}`, taskFn);
  }
  
  async complete() {
    await this.#highPriorityQueue.complete();
    await this.#normalQueue.complete();
    await this.#lowPriorityQueue.complete();
  }
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

main().catch(console.error);