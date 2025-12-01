import { createQueue, subtask, nestedSubtasks } from '../src/index.mjs';

async function main() {
  console.log('🔧 Subtask Examples\n');
  console.log('═'.repeat(60) + '\n');

  const queue = createQueue({
    concurrent: false,
    rendererOptions: {
      showTimer: true,
      collapseSubtasks: false
    },
    defaultSubtaskOptions: {
      concurrent: false,
      exitOnError: true
    }
  });

  // ══════════════════════════════════════════════════════════════
  // EXAMPLE 1: Static Subtasks with add()
  // ══════════════════════════════════════════════════════════════
  
  console.log('Example 1: Static subtasks via add()\n');
  
  await queue.add('📦 Build Project', async (ctx, task) => {
    task.output = 'Initializing build...';
    await delay(300);
    ctx.buildStarted = Date.now();
  }, {
    subtasks: [
      {
        title: 'Compile TypeScript',
        task: async (ctx, task) => {
          task.output = 'Compiling 142 files...';
          await delay(800);
          task.output = 'Compilation complete';
          await delay(200);
        }
      },
      {
        title: 'Bundle with Webpack',
        task: async (ctx, task) => {
          const steps = ['Resolving modules', 'Creating chunks', 'Optimizing'];
          for (const step of steps) {
            task.output = step;
            await delay(400);
          }
        }
      },
      {
        title: 'Generate sourcemaps',
        task: async () => {
          await delay(500);
        }
      }
    ],
    subtaskOptions: { concurrent: false }
  });

  // ══════════════════════════════════════════════════════════════
  // EXAMPLE 2: Using addWithSubtasks()
  // ══════════════════════════════════════════════════════════════
  
  console.log('\nExample 2: Using addWithSubtasks()\n');
  
  await queue.addWithSubtasks('🧪 Run Tests', [
    {
      title: 'Unit Tests',
      task: async (ctx, task) => {
        task.output = 'Running 234 unit tests...';
        await delay(1000);
        ctx.unitTestsPassed = 234;
      }
    },
    {
      title: 'Integration Tests',
      task: async (ctx, task) => {
        task.output = 'Running 45 integration tests...';
        await delay(800);
        ctx.integrationTestsPassed = 45;
      }
    },
    {
      title: 'E2E Tests',
      task: async (ctx, task) => {
        task.output = 'Running 12 E2E tests...';
        await delay(600);
        ctx.e2eTestsPassed = 12;
      },
      // Skip condition
      skip: (ctx) => ctx.skipE2E ? 'E2E tests disabled' : false
    }
  ], {
    subtaskOptions: { 
      concurrent: true,  // Run all test types in parallel
      exitOnError: false  // Continue even if one test suite fails
    }
  });

  // ══════════════════════════════════════════════════════════════
  // EXAMPLE 3: Deeply Nested Subtasks
  // ══════════════════════════════════════════════════════════════
  
  console.log('\nExample 3: Nested subtasks\n');
  
  await queue.addWithSubtasks('🚀 Deploy Application', [
    {
      title: 'Prepare Deployment',
      subtasks: [
        { 
          title: 'Validate configuration', 
          task: async () => await delay(300) 
        },
        { 
          title: 'Check dependencies', 
          task: async () => await delay(400) 
        }
      ],
      options: { concurrent: true }
    },
    {
      title: 'Deploy to Environments',
      subtasks: [
        {
          title: 'Deploy to Staging',
          task: async (ctx, task) => {
            task.output = 'Uploading to staging...';
            await delay(600);
          },
          subtasks: [
            { title: 'Run migrations', task: async () => await delay(300) },
            { title: 'Warm cache', task: async () => await delay(200) }
          ]
        },
        {
          title: 'Deploy to Production',
          task: async (ctx, task) => {
            task.output = 'Uploading to production...';
            await delay(800);
          },
          subtasks: [
            { title: 'Run migrations', task: async () => await delay(400) },
            { title: 'Warm cache', task: async () => await delay(300) },
            { title: 'Update CDN', task: async () => await delay(200) }
          ]
        }
      ],
      options: { concurrent: false }  // Deploy sequentially
    },
    {
      title: 'Post-deployment',
      subtasks: [
        { title: 'Health check', task: async () => await delay(500) },
        { title: 'Notify team', task: async () => await delay(200) }
      ],
      options: { concurrent: true }
    }
  ]);

  // ══════════════════════════════════════════════════════════════
  // EXAMPLE 4: Using addTask() with Full Definition
  // ══════════════════════════════════════════════════════════════
  
  console.log('\nExample 4: Full task definition with addTask()\n');
  
  await queue.addTask({
    title: '📊 Generate Reports',
    task: async (ctx, task) => {
      task.output = 'Gathering data...';
      await delay(400);
      ctx.reportData = { users: 1500, transactions: 45000 };
    },
    subtasks: [
      {
        title: 'User Report',
        task: async (ctx, task) => {
          task.output = `Processing ${ctx.reportData?.users || 0} users...`;
          await delay(500);
        }
      },
      {
        title: 'Transaction Report',
        task: async (ctx, task) => {
          task.output = `Processing ${ctx.reportData?.transactions || 0} transactions...`;
          await delay(700);
        },
        retry: { tries: 3, delay: 500 }  // Retry on failure
      },
      {
        title: 'Summary Report',
        task: async () => await delay(300)
      }
    ],
    options: {
      concurrent: true,
      exitOnError: false
    }
  });

  // ══════════════════════════════════════════════════════════════
  // EXAMPLE 5: Dynamic Subtasks with task.newListr()
  // ══════════════════════════════════════════════════════════════
  
  console.log('\nExample 5: Dynamic subtasks with task.newListr()\n');
  
  await queue.add('📁 Process Files', async (ctx, task) => {
    // Simulate discovering files dynamically
    const files = ['file1.ts', 'file2.ts', 'file3.ts', 'file4.ts'];
    
    task.output = `Found ${files.length} files to process`;
    await delay(300);
    
    // Create subtasks dynamically based on runtime data
    return task.newListr(
      files.map((file, index) => ({
        title: `Process ${file}`,
        task: async (ctx, subtask) => {
          subtask.output = `Reading ${file}...`;
          await delay(200 + Math.random() * 300);
          subtask.output = `Transforming ${file}...`;
          await delay(200 + Math.random() * 300);
        }
      })),
      { concurrent: true }  // Process files in parallel
    );
  });

  // ══════════════════════════════════════════════════════════════
  // EXAMPLE 6: Mixed Static and Dynamic Subtasks
  // ══════════════════════════════════════════════════════════════
  
  console.log('\nExample 6: Mixed static and dynamic subtasks\n');
  
  await queue.add('🔄 Sync Data', async (ctx, task) => {
    task.output = 'Connecting to database...';
    await delay(400);
    ctx.tables = ['users', 'orders', 'products'];
    
    // Return dynamic subtasks for discovered tables
    return task.newListr(
      ctx.tables.map(table => ({
        title: `Sync table: ${table}`,
        task: async (ctx, subtask) => {
          const count = Math.floor(Math.random() * 1000) + 100;
          subtask.output = `Syncing ${count} records...`;
          await delay(400 + Math.random() * 400);
        }
      })),
      { concurrent: false }
    );
  }, {
    // These static subtasks run AFTER the dynamic ones
    subtasks: [
      {
        title: 'Verify sync integrity',
        task: async (ctx, task) => {
          task.output = 'Checking data consistency...';
          await delay(500);
        }
      },
      {
        title: 'Update sync timestamp',
        task: async () => await delay(200)
      }
    ],
    subtaskMode: 'after'  // Static subtasks run after main task
  });

  // ══════════════════════════════════════════════════════════════
  // EXAMPLE 7: Subtasks with Skip and Retry
  // ══════════════════════════════════════════════════════════════
  
  console.log('\nExample 7: Subtasks with skip and retry\n');
  
  await queue.addWithSubtasks('⚙️ System Maintenance', [
    {
      title: 'Clear temporary files',
      task: async (ctx, task) => {
        task.output = 'Scanning for temp files...';
        await delay(400);
        ctx.tempFilesCleared = true;
      }
    },
    {
      title: 'Optimize database',
      task: async (ctx, task) => {
        task.output = 'Running VACUUM...';
        await delay(600);
      },
      retry: { tries: 2, delay: 1000 },  // Retry twice with 1s delay
      rollback: async (ctx, task) => {
        task.output = 'Rolling back database changes...';
        await delay(300);
      }
    },
    {
      title: 'Rebuild search index',
      task: async () => await delay(500),
      skip: (ctx) => !ctx.rebuildIndex ? 'Index rebuild not requested' : false
    },
    {
      title: 'Send notification',
      task: async (ctx, task) => {
        task.output = 'Notifying administrators...';
        await delay(300);
      },
      enabled: (ctx) => ctx.notifyAdmins !== false
    }
  ]);

  // ══════════════════════════════════════════════════════════════
  // EXAMPLE 8: Using Helper Functions
  // ══════════════════════════════════════════════════════════════
  
  console.log('\nExample 8: Using helper functions\n');
  
  await queue.addWithSubtasks('📤 Upload Assets', [
    subtask('Compress images', async (ctx, task) => {
      task.output = 'Compressing 24 images...';
      await delay(600);
    }),
    subtask('Compress videos', async (ctx, task) => {
      task.output = 'Compressing 3 videos...';
      await delay(800);
    }),
    nestedSubtasks('Upload to CDN', [
      subtask('Upload images', async () => await delay(400)),
      subtask('Upload videos', async () => await delay(500)),
      subtask('Upload fonts', async () => await delay(200))
    ], { concurrent: true }),
    subtask('Invalidate cache', async () => await delay(300))
  ], {
    subtaskOptions: { concurrent: false }
  });

  // Complete the queue
  await queue.complete();
  
  console.log('\n' + '═'.repeat(60));
  console.log('✅ All examples completed!');
  console.log('📊 Final stats:', queue.stats);
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

main().catch(console.error);