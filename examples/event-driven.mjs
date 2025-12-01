import { EventEmitter } from 'events';
import { createQueue } from '../src/index.mjs';

/**
 * Mock file watcher that emits events
 */
class MockFileWatcher extends EventEmitter {
  #interval = null;
  #fileCount = 0;
  
  start() {
    console.log('👁️  File watcher started\n');
    
    // Simulate file change events at random intervals
    const emitChange = () => {
      this.#fileCount++;
      const files = [
        'src/components/Button.tsx',
        'src/utils/helpers.ts',
        'src/styles/main.css',
        'src/api/client.ts',
        'src/hooks/useAuth.ts',
        'config/webpack.config.js'
      ];
      
      const file = files[Math.floor(Math.random() * files.length)];
      this.emit('change', { file, timestamp: Date.now() });
      
      if (this.#fileCount >= 5) {
        this.emit('done');
        return;
      }
      
      // Schedule next emission
      this.#interval = setTimeout(emitChange, Math.random() * 1000 + 500);
    };
    
    // Start emitting
    setTimeout(emitChange, 300);
  }
  
  stop() {
    if (this.#interval) {
      clearTimeout(this.#interval);
    }
  }
}

/**
 * Mock HTTP server that receives requests
 */
class MockHttpServer extends EventEmitter {
  #interval = null;
  #requestCount = 0;
  
  start() {
    console.log('🌐 HTTP server started\n');
    
    const endpoints = [
      { method: 'GET', path: '/api/users' },
      { method: 'POST', path: '/api/orders' },
      { method: 'PUT', path: '/api/products/123' },
      { method: 'DELETE', path: '/api/sessions/abc' }
    ];
    
    const emitRequest = () => {
      this.#requestCount++;
      const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
      
      this.emit('request', {
        id: `req-${this.#requestCount}`,
        ...endpoint,
        timestamp: Date.now()
      });
      
      if (this.#requestCount >= 4) {
        this.emit('done');
        return;
      }
      
      this.#interval = setTimeout(emitRequest, Math.random() * 800 + 400);
    };
    
    setTimeout(emitRequest, 200);
  }
  
  stop() {
    if (this.#interval) {
      clearTimeout(this.#interval);
    }
  }
}

// ============================================
// MAIN DEMO
// ============================================

async function main() {
  console.log('🎯 Event-Driven Task Queue Demo\n');
  console.log('─'.repeat(50));
  
  // Create the queue
  const queue = createQueue({
    concurrent: true, // Process file and http tasks concurrently
    rendererOptions: {
      showTimer: true,
      collapseSubtasks: false
    }
  });
  
  // Track completion
  let fileWatcherDone = false;
  let httpServerDone = false;
  
  const checkComplete = async () => {
    if (fileWatcherDone && httpServerDone) {
      // Give a moment for any final tasks
      await delay(200);
      await queue.complete();
      
      console.log('\n' + '─'.repeat(50));
      console.log('✅ All events processed!');
      console.log('📊 Final stats:', queue.stats);
    }
  };
  
  // ========== FILE WATCHER EVENTS ==========
  const watcher = new MockFileWatcher();
  
  watcher.on('change', ({ file, timestamp }) => {
    // Add a task for each file change event
    queue.add(`📄 Rebuild: ${file}`, async (ctx, task) => {
      task.output = 'Detecting changes...';
      await delay(300);
      
      task.output = 'Compiling...';
      await delay(Math.random() * 500 + 300);
      
      task.output = 'Updating bundle...';
      await delay(200);
      
      return { file, rebuilt: true };
    }).catch(err => {
      console.error(`Failed to rebuild ${file}:`, err.message);
    });
  });
  
  watcher.on('done', () => {
    console.log('\n📁 File watcher completed');
    fileWatcherDone = true;
    watcher.stop();
    checkComplete();
  });
  
  // ========== HTTP SERVER EVENTS ==========
  const server = new MockHttpServer();
  
  server.on('request', ({ id, method, path }) => {
    // Add a task for each incoming request
    queue.add(`🌐 ${method} ${path}`, async (ctx, task) => {
      task.output = `Processing ${id}...`;
      await delay(Math.random() * 400 + 200);
      
      task.output = 'Sending response...';
      await delay(100);
      
      return { id, status: 200 };
    }).catch(err => {
      console.error(`Failed to process ${id}:`, err.message);
    });
  });
  
  server.on('done', () => {
    console.log('\n🌐 HTTP server completed');
    httpServerDone = true;
    server.stop();
    checkComplete();
  });
  
  // Start both event sources
  watcher.start();
  server.start();
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

main().catch(console.error);