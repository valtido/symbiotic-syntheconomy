#!/usr/bin/env tsx

import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface PreloadConfig {
  directiveFile: string;
  apiUrl: string;
  webhookUrl: string;
  taskListFile: string;
  maxRetries: number;
  retryDelay: number;
}

class ChatGPTPreloader {
  private config: PreloadConfig;
  private isPreloaded: boolean = false;
  private sessionId: string;

  constructor() {
    this.config = {
      directiveFile: 'CHATGPT_API_DIRECTIVE.md',
      apiUrl: 'http://localhost:3009/ai-task',
      webhookUrl: 'http://localhost:3008/ai-contribution',
      taskListFile: 'tasks/task-list.json',
      maxRetries: 3,
      retryDelay: 2000,
    };
    this.sessionId = this.generateSessionId();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private log(message: string, level: 'INFO' | 'WARN' | 'ERROR' = 'INFO') {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${level}] 🤖 ${message}`);
  }

  private async checkServerHealth(url: string): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(
        url
          .replace('/ai-task', '/health')
          .replace('/ai-contribution', '/health'),
        {
          method: 'GET',
          signal: controller.signal,
        },
      );

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  private async waitForServer(
    url: string,
    maxAttempts: number = 10,
  ): Promise<boolean> {
    for (let i = 0; i < maxAttempts; i++) {
      this.log(`Checking server health (attempt ${i + 1}/${maxAttempts})...`);

      if (await this.checkServerHealth(url)) {
        this.log('Server is healthy!');
        return true;
      }

      if (i < maxAttempts - 1) {
        this.log(`Server not ready, waiting ${this.config.retryDelay}ms...`);
        await new Promise((resolve) =>
          setTimeout(resolve, this.config.retryDelay),
        );
      }
    }

    this.log('Server health check failed after maximum attempts', 'ERROR');
    return false;
  }

  private async readDirective(): Promise<string> {
    try {
      const directivePath = path.join(process.cwd(), this.config.directiveFile);
      if (!fs.existsSync(directivePath)) {
        throw new Error(
          `Directive file not found: ${this.config.directiveFile}`,
        );
      }

      const directive = fs.readFileSync(directivePath, 'utf-8');
      this.log(`Loaded directive from ${this.config.directiveFile}`);
      return directive;
    } catch (error) {
      this.log(`Error reading directive: ${error}`, 'ERROR');
      throw error;
    }
  }

  private async sendPreloadDirective(): Promise<boolean> {
    try {
      const directive = await this.readDirective();

      // Create a special preload task
      const preloadTask = {
        task: 'INITIAL_DIRECTIVE_LOAD',
        filePath: 'system/chatgpt-directive.md',
        requirements: directive,
        agent: 'ChatGPT',
        sessionId: this.sessionId,
        isPreload: true,
      };

      this.log('Sending initial directive to ChatGPT...');

      const response = await fetch(this.config.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preloadTask),
      });

      if (response.ok) {
        const result = await response.json();
        this.log('Initial directive sent successfully!');
        this.log(
          `ChatGPT Response: ${result.message || 'Directive acknowledged'}`,
        );
        return true;
      } else {
        this.log(
          `Failed to send directive: ${response.status} ${response.statusText}`,
          'ERROR',
        );
        return false;
      }
    } catch (error) {
      this.log(`Error sending directive: ${error}`, 'ERROR');
      return false;
    }
  }

  private async loadTaskList(): Promise<any> {
    try {
      const taskPath = path.join(process.cwd(), this.config.taskListFile);
      if (!fs.existsSync(taskPath)) {
        this.log('No task list found, creating one...');
        await execAsync('npm run tasks:generate');

        // Wait a moment for task generation
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      const content = fs.readFileSync(taskPath, 'utf-8');
      const taskList = JSON.parse(content);
      this.log(`Loaded task list with ${taskList.tasks?.length || 0} tasks`);
      return taskList;
    } catch (error) {
      this.log(`Error loading task list: ${error}`, 'ERROR');
      throw error;
    }
  }

  private async sendNextTask(taskList: any): Promise<boolean> {
    try {
      const pendingTasks = taskList.tasks.filter(
        (t: any) => t.status === 'pending',
      );

      if (pendingTasks.length === 0) {
        this.log('No pending tasks found!');
        return true;
      }

      // Get the highest priority task
      const nextTask = pendingTasks.sort((a: any, b: any) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      })[0];

      this.log(
        `Sending next task: ${nextTask.task} (${nextTask.priority} priority)`,
      );

      const taskRequest = {
        task: nextTask.task,
        filePath: nextTask.filePath || `scripts/${nextTask.category}.ts`,
        requirements: nextTask.requirements || `Implement ${nextTask.task}`,
        agent: 'ChatGPT',
        sessionId: this.sessionId,
        taskId: nextTask.id,
      };

      const response = await fetch(this.config.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskRequest),
      });

      if (response.ok) {
        const result = await response.json();
        this.log(`Task sent successfully! Task ID: ${nextTask.id}`);
        this.log(`ChatGPT Response: ${result.message || 'Task received'}`);
        return true;
      } else {
        this.log(
          `Failed to send task: ${response.status} ${response.statusText}`,
          'ERROR',
        );
        return false;
      }
    } catch (error) {
      this.log(`Error sending task: ${error}`, 'ERROR');
      return false;
    }
  }

  async preload(): Promise<boolean> {
    if (this.isPreloaded) {
      this.log('Already preloaded, skipping...');
      return true;
    }

    this.log('🚀 Starting ChatGPT Preloader...');
    this.log(`Session ID: ${this.sessionId}`);

    // Wait for API server to be ready
    this.log('Waiting for AI API server...');
    const apiServerReady = await this.waitForServer(this.config.apiUrl);
    if (!apiServerReady) {
      this.log('AI API server not available', 'ERROR');
      return false;
    }

    // Send initial directive
    this.log('Sending initial directive...');
    const directiveSent = await this.sendPreloadDirective();
    if (!directiveSent) {
      this.log('Failed to send initial directive', 'ERROR');
      return false;
    }

    this.isPreloaded = true;
    this.log('✅ ChatGPT preloaded successfully!');
    return true;
  }

  async processNextTask(): Promise<boolean> {
    if (!this.isPreloaded) {
      this.log('Not preloaded yet, running preload first...');
      const preloaded = await this.preload();
      if (!preloaded) {
        return false;
      }
    }

    try {
      const taskList = await this.loadTaskList();
      return await this.sendNextTask(taskList);
    } catch (error) {
      this.log(`Error processing next task: ${error}`, 'ERROR');
      return false;
    }
  }

  async processAllTasks(): Promise<void> {
    this.log('🔄 Processing all tasks...');

    if (!this.isPreloaded) {
      this.log('Not preloaded yet, running preload first...');
      const preloaded = await this.preload();
      if (!preloaded) {
        this.log('Preload failed, cannot process tasks', 'ERROR');
        return;
      }
    }

    let processedCount = 0;
    const maxTasks = 10; // Limit to prevent infinite loops

    while (processedCount < maxTasks) {
      try {
        const taskList = await this.loadTaskList();
        const pendingTasks = taskList.tasks.filter(
          (t: any) => t.status === 'pending',
        );

        if (pendingTasks.length === 0) {
          this.log('✅ All tasks completed!');
          break;
        }

        this.log(
          `Processing task ${processedCount + 1}/${pendingTasks.length}...`,
        );
        const success = await this.sendNextTask(taskList);

        if (success) {
          processedCount++;
          // Wait a bit between tasks
          await new Promise((resolve) => setTimeout(resolve, 3000));
        } else {
          this.log('Task processing failed, stopping...', 'ERROR');
          break;
        }
      } catch (error) {
        this.log(`Error in task processing loop: ${error}`, 'ERROR');
        break;
      }
    }

    this.log(`🎉 Processed ${processedCount} tasks`);
  }

  getSessionId(): string {
    return this.sessionId;
  }

  isPreloadedStatus(): boolean {
    return this.isPreloaded;
  }
}

// CLI interface
async function main() {
  const preloader = new ChatGPTPreloader();
  const command = process.argv[2];

  switch (command) {
    case 'preload':
      await preloader.preload();
      break;
    case 'next':
      await preloader.processNextTask();
      break;
    case 'all':
      await preloader.processAllTasks();
      break;
    case 'status':
      console.log(`Session ID: ${preloader.getSessionId()}`);
      console.log(`Preloaded: ${preloader.isPreloadedStatus()}`);
      break;
    default:
      console.log(`
🤖 ChatGPT Preloader Commands:

  npm run chatgpt:preload  - Send initial directive to ChatGPT
  npm run chatgpt:next     - Send next pending task
  npm run chatgpt:all      - Process all pending tasks
  npm run chatgpt:status   - Show preloader status

Examples:
  npx tsx scripts/chatgptPreloader.ts preload
  npx tsx scripts/chatgptPreloader.ts next
  npx tsx scripts/chatgptPreloader.ts all
      `);
  }
}

// Start if run directly
if (require.main === module) {
  main().catch(console.error);
}

export default ChatGPTPreloader;
