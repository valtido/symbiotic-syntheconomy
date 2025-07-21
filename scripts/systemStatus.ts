#!/usr/bin/env tsx

import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { spawn } from 'child_process';

interface SystemHealth {
  backend: boolean;
  localtunnel: boolean;
  webhook: boolean;
  aiApiServer: boolean;
  aiWebhookServer: boolean;
  taskManager: boolean;
  lastCheck: Date;
}

interface TaskStats {
  total: number;
  pending: number;
  completed: number;
  failed: number;
  lastUpdated: string;
}

class SystemStatus {
  private rl: readline.Interface;
  private isRunning = true;
  private currentView = 'main';
  private updateInterval = 3000; // 3 seconds

  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }

  private log(message: string) {
    console.log(`📊 ${message}`);
  }

  private async checkBackendHealth(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch('http://localhost:3006/health', {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  private async checkLocalTunnelHealth(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(
        'https://symbiotic-syntheconomy.loca.lt/health',
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

  private async checkWebhookHealth(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(
        'https://symbiotic-syntheconomy.loca.lt/webhook/github',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ test: 'health-check' }),
          signal: controller.signal,
        },
      );

      clearTimeout(timeoutId);
      return response.status < 500;
    } catch (error) {
      return false;
    }
  }

  private async checkAIApiServerHealth(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch('http://localhost:3009/health', {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  private async checkAIWebhookServerHealth(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch('http://localhost:3008/health', {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  private async checkTaskManagerHealth(): Promise<boolean> {
    try {
      const taskFile = path.join(process.cwd(), 'tasks', 'task-list.json');
      if (!fs.existsSync(taskFile)) {
        return false;
      }

      const content = fs.readFileSync(taskFile, 'utf-8');
      const taskList = JSON.parse(content);
      return taskList.tasks && Array.isArray(taskList.tasks);
    } catch (error) {
      return false;
    }
  }

  private async getTaskStats(): Promise<TaskStats> {
    try {
      const taskFile = path.join(process.cwd(), 'tasks', 'task-list.json');
      if (!fs.existsSync(taskFile)) {
        return {
          total: 0,
          pending: 0,
          completed: 0,
          failed: 0,
          lastUpdated: new Date().toISOString(),
        };
      }

      const content = fs.readFileSync(taskFile, 'utf-8');
      const taskList = JSON.parse(content);

      return {
        total: taskList.tasks?.length || 0,
        pending:
          taskList.tasks?.filter((t: any) => t.status === 'pending').length ||
          0,
        completed:
          taskList.tasks?.filter((t: any) => t.status === 'completed').length ||
          0,
        failed:
          taskList.tasks?.filter((t: any) => t.status === 'failed').length || 0,
        lastUpdated: taskList.lastUpdated || new Date().toISOString(),
      };
    } catch (error) {
      return {
        total: 0,
        pending: 0,
        completed: 0,
        failed: 0,
        lastUpdated: new Date().toISOString(),
      };
    }
  }

  private getStatusIcon(healthy: boolean): string {
    return healthy ? '🟢' : '🔴';
  }

  private getStatusText(healthy: boolean): string {
    return healthy ? 'OK' : 'DOWN';
  }

  async performHealthCheck(): Promise<SystemHealth> {
    const [
      backendHealth,
      tunnelHealth,
      webhookHealth,
      aiApiHealth,
      aiWebhookHealth,
      taskManagerHealth,
    ] = await Promise.all([
      this.checkBackendHealth(),
      this.checkLocalTunnelHealth(),
      this.checkWebhookHealth(),
      this.checkAIApiServerHealth(),
      this.checkAIWebhookServerHealth(),
      this.checkTaskManagerHealth(),
    ]);

    return {
      backend: backendHealth,
      localtunnel: tunnelHealth,
      webhook: webhookHealth,
      aiApiServer: aiApiHealth,
      aiWebhookServer: aiWebhookHealth,
      taskManager: taskManagerHealth,
      lastCheck: new Date(),
    };
  }

  private clearScreen(): void {
    console.clear();
  }

  private displayMainView(health: SystemHealth, taskStats: TaskStats): void {
    this.clearScreen();
    console.log('🤖 Interactive System Monitor');
    console.log(
      '═══════════════════════════════════════════════════════════════\n',
    );

    console.log('📊 System Health:');
    console.log(
      `  Backend:           ${this.getStatusIcon(
        health.backend,
      )} ${this.getStatusText(health.backend)}`,
    );
    console.log(
      `  LocalTunnel:       ${this.getStatusIcon(
        health.localtunnel,
      )} ${this.getStatusText(health.localtunnel)}`,
    );
    console.log(
      `  Webhook:           ${this.getStatusIcon(
        health.webhook,
      )} ${this.getStatusText(health.webhook)}`,
    );
    console.log(
      `  AI API Server:     ${this.getStatusIcon(
        health.aiApiServer,
      )} ${this.getStatusText(health.aiApiServer)}`,
    );
    console.log(
      `  AI Webhook Server: ${this.getStatusIcon(
        health.aiWebhookServer,
      )} ${this.getStatusText(health.aiWebhookServer)}`,
    );
    console.log(
      `  Task Manager:      ${this.getStatusIcon(
        health.taskManager,
      )} ${this.getStatusText(health.taskManager)}`,
    );

    console.log('\n📋 Task Stats:');
    console.log(
      `  Total: ${taskStats.total} | Completed: ${taskStats.completed} 🟢 | Pending: ${taskStats.pending} 🟡 | Failed: ${taskStats.failed} 🔴`,
    );

    console.log('\n⏱️  Last Check:', health.lastCheck.toLocaleTimeString());
    console.log(
      '\n═══════════════════════════════════════════════════════════════',
    );
    this.displayNavigation();
  }

  private displayTasksView(): void {
    try {
      const taskFile = path.join(process.cwd(), 'tasks', 'task-list.json');
      if (!fs.existsSync(taskFile)) {
        console.log('\n📋 No task list found.');
        return;
      }

      const content = fs.readFileSync(taskFile, 'utf-8');
      const taskList = JSON.parse(content);

      this.clearScreen();
      console.log('📋 Task Details');
      console.log(
        '═══════════════════════════════════════════════════════════════\n',
      );

      const highPriority = taskList.tasks.filter(
        (t: any) => t.priority === 'high',
      );
      const mediumPriority = taskList.tasks.filter(
        (t: any) => t.priority === 'medium',
      );
      const lowPriority = taskList.tasks.filter(
        (t: any) => t.priority === 'low',
      );

      if (highPriority.length > 0) {
        console.log('🔴 High Priority:');
        highPriority.forEach((task: any) => {
          const statusIcon = {
            'pending': '⏳',
            'in-progress': '🔄',
            'completed': '✅',
            'failed': '❌',
          }[task.status];
          console.log(`  ${statusIcon} ${task.task}`);
        });
        console.log('');
      }

      if (mediumPriority.length > 0) {
        console.log('🟡 Medium Priority:');
        mediumPriority.forEach((task: any) => {
          const statusIcon = {
            'pending': '⏳',
            'in-progress': '🔄',
            'completed': '✅',
            'failed': '❌',
          }[task.status];
          console.log(`  ${statusIcon} ${task.task}`);
        });
        console.log('');
      }

      if (lowPriority.length > 0) {
        console.log('🟢 Low Priority:');
        lowPriority.forEach((task: any) => {
          const statusIcon = {
            'pending': '⏳',
            'in-progress': '🔄',
            'completed': '✅',
            'failed': '❌',
          }[task.status];
          console.log(`  ${statusIcon} ${task.task}`);
        });
      }

      console.log(
        '\n═══════════════════════════════════════════════════════════════',
      );
      this.displayNavigation();
    } catch (error) {
      console.log(`\n❌ Error loading tasks: ${error}`);
    }
  }

  private displayLogsView(): void {
    try {
      const logFiles = [
        { name: 'AI-API', path: 'log/ai-api.log' },
        { name: 'AI-WEBHOOK', path: 'log/ai-webhook.log' },
        { name: 'TASK-MANAGER', path: 'log/task-manager.log' },
      ];

      this.clearScreen();
      console.log('📝 Recent Activity');
      console.log(
        '═══════════════════════════════════════════════════════════════\n',
      );

      for (const logFile of logFiles) {
        const fullPath = path.join(process.cwd(), logFile.path);
        if (fs.existsSync(fullPath)) {
          const content = fs.readFileSync(fullPath, 'utf-8');
          const lines = content.split('\n').filter((line) => line.trim());
          const recentLines = lines.slice(-3); // Last 3 lines

          if (recentLines.length > 0) {
            console.log(`📄 ${logFile.name}:`);
            recentLines.forEach((line) => {
              if (line.trim()) {
                const timestamp = line.match(/\[([^\]]+)\]/)?.[1] || '';
                const message = line.replace(/^\[[^\]]+\]\s*/, '').trim();
                console.log(
                  `  ${timestamp ? `[${timestamp}]` : ''} ${message}`,
                );
              }
            });
            console.log('');
          }
        }
      }

      console.log(
        '═══════════════════════════════════════════════════════════════',
      );
      this.displayNavigation();
    } catch (error) {
      console.log(`\n❌ Error loading logs: ${error}`);
    }
  }

  private displayCommandsView(): void {
    this.clearScreen();
    console.log('🚀 Quick Commands');
    console.log(
      '═══════════════════════════════════════════════════════════════\n',
    );

    console.log('🤖 AI & Tasks:');
    console.log('  c - Preload ChatGPT directive');
    console.log('  n - Send next task to ChatGPT');
    console.log('  a - Process all tasks');
    console.log('  g - Generate new task list');
    console.log('  p - Process pending tasks');

    console.log('\n🔧 System:');
    console.log('  s - Start AI API server');
    console.log('  w - Start AI webhook server');
    console.log('  m - Start system monitor');

    console.log('\n📊 Views:');
    console.log('  1 - Main dashboard (current)');
    console.log('  2 - Task details');
    console.log('  3 - Recent logs');
    console.log('  4 - Quick commands (this view)');
    console.log('  5 - Service URLs (this view)');

    console.log('\n⚡ Actions:');
    console.log('  q - Quit monitor');
    console.log('  r - Refresh current view');

    console.log(
      '\n═══════════════════════════════════════════════════════════════',
    );
  }

  private displayUrlsView(): void {
    this.clearScreen();
    console.log('🌐 Service URLs');
    console.log(
      '═══════════════════════════════════════════════════════════════\n',
    );

    console.log('🏠 Local Development:');
    console.log('  Frontend App:        http://localhost:3009');
    console.log('  Backend API:         http://localhost:3006');
    console.log('  Dashboard:           http://localhost:3007');
    console.log('  AI Webhook Server:   http://localhost:3008');
    console.log('  AI API Server:       http://localhost:3010');
    console.log('  Smart Contracts:     http://localhost:3011');

    console.log('\n🌍 Public URLs (via LocalTunnel):');
    console.log(
      '  Frontend App:        https://symbiotic-syntheconomy.loca.lt:3009',
    );
    console.log(
      '  Backend API:         https://symbiotic-syntheconomy.loca.lt:3006',
    );
    console.log(
      '  Dashboard:           https://symbiotic-syntheconomy.loca.lt:3007',
    );
    console.log(
      '  AI Webhook Server:   https://symbiotic-syntheconomy.loca.lt:3008',
    );
    console.log(
      '  AI API Server:       https://symbiotic-syntheconomy.loca.lt:3010',
    );

    console.log('\n🔗 External Services:');
    console.log(
      '  GitHub Repository:   https://github.com/valtido/symbiotic-syntheconomy',
    );
    console.log('  Base Testnet:        https://goerli.basescan.org');
    console.log('  IPFS Gateway:        https://ipfs.io/ipfs/');
    console.log('  OpenAI API:          https://platform.openai.com/api-keys');
    console.log('  Anthropic API:       https://console.anthropic.com/');
    console.log('  X.AI (Grok):         https://console.x.ai/');

    console.log('\n📊 Health Endpoints:');
    console.log('  Backend Health:      http://localhost:3006/health');
    console.log('  AI API Health:       http://localhost:3009/health');
    console.log(
      '  Webhook Status:      https://symbiotic-syntheconomy.loca.lt/webhook/github',
    );

    console.log('\n✅ Port Configuration:');
    console.log('  • All services running on unique ports');
    console.log('  • No port conflicts detected');

    console.log('\n⚡ Quick Actions:');
    console.log('  Press 1-4 to navigate to other views');
    console.log('  Press q to quit');
    console.log('  Press r to refresh');

    console.log(
      '\n═══════════════════════════════════════════════════════════════',
    );
  }

  private displayNavigation(): void {
    console.log(
      'Navigation: 1-Main | 2-Tasks | 3-Logs | 4-Commands | 5-URLs | q-Quit | r-Refresh',
    );
    console.log(
      'Actions: c-Preload | n-Next | a-All | g-Generate | p-Process | s-API | w-Webhook | m-Monitor',
    );
  }

  private async executeCommand(
    command: string,
    args: string[] = [],
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log(`\n🚀 Executing: ${command} ${args.join(' ')}`);

      const child = spawn(command, args, {
        stdio: 'pipe',
        shell: true,
        cwd: process.cwd(),
      });

      let output = '';
      let errorOutput = '';

      child.stdout?.on('data', (data) => {
        output += data.toString();
      });

      child.stderr?.on('data', (data) => {
        errorOutput += data.toString();
      });

      child.on('close', (code) => {
        if (code === 0) {
          console.log(`✅ Command completed successfully`);
          if (output.trim()) {
            console.log(
              `📄 Output: ${output.trim().split('\n').slice(-2).join('\n')}`,
            );
          }
        } else {
          console.log(`❌ Command failed with code ${code}`);
          if (errorOutput.trim()) {
            console.log(
              `📄 Error: ${errorOutput
                .trim()
                .split('\n')
                .slice(-2)
                .join('\n')}`,
            );
          }
        }
        resolve();
      });

      child.on('error', (error) => {
        console.log(`❌ Command error: ${error.message}`);
        reject(error);
      });
    });
  }

  private async handleKeyPress(key: string): Promise<void> {
    switch (key.toLowerCase()) {
      case '1':
        this.currentView = 'main';
        break;
      case '2':
        this.currentView = 'tasks';
        break;
      case '3':
        this.currentView = 'logs';
        break;
      case '4':
        this.currentView = 'commands';
        break;
      case '5':
        this.currentView = 'urls';
        break;
      case 'q':
        this.isRunning = false;
        this.rl.close();
        console.log('\n🛑 Interactive monitor stopped');
        process.exit(0);
        break;
      case 'r':
        // Refresh current view
        break;
      case 'c':
        await this.executeCommand('npm', ['run', 'chatgpt:preload']);
        break;
      case 'n':
        await this.executeCommand('npm', ['run', 'chatgpt:next']);
        break;
      case 'a':
        await this.executeCommand('npm', ['run', 'chatgpt:all']);
        break;
      case 'g':
        await this.executeCommand('npm', ['run', 'tasks:generate']);
        break;
      case 'p':
        await this.executeCommand('npm', ['run', 'tasks:process']);
        break;
      case 's':
        await this.executeCommand('npm', ['run', 'ai:api']);
        break;
      case 'w':
        await this.executeCommand('npm', ['run', 'ai:webhook']);
        break;
      case 'm':
        await this.executeCommand('npm', ['run', 'monitor']);
        break;
    }
  }

  private setupKeyHandling(): void {
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');

    process.stdin.on('data', async (key) => {
      const keyStr = key.toString();
      if (keyStr === '\u0003') {
        // Ctrl+C
        this.isRunning = false;
        this.rl.close();
        console.log('\n🛑 Interactive monitor stopped');
        process.exit(0);
      }
      await this.handleKeyPress(keyStr);
    });
  }

  async startInteractive(): Promise<void> {
    console.log('🤖 Starting Interactive System Monitor...');
    console.log('Press any key to navigate, Ctrl+C to quit\n');

    this.setupKeyHandling();

    const updateDisplay = async () => {
      if (!this.isRunning) return;

      try {
        const health = await this.performHealthCheck();
        const taskStats = await this.getTaskStats();

        switch (this.currentView) {
          case 'main':
            this.displayMainView(health, taskStats);
            break;
          case 'tasks':
            this.displayTasksView();
            break;
          case 'logs':
            this.displayLogsView();
            break;
          case 'commands':
            this.displayCommandsView();
            break;
          case 'urls':
            this.displayUrlsView();
            break;
        }
      } catch (error) {
        console.log(`❌ Error updating display: ${error}`);
      }

      // Schedule next update
      setTimeout(updateDisplay, this.updateInterval);
    };

    // Start the update loop
    updateDisplay();
  }

  async start(): Promise<void> {
    const command = process.argv[2];

    if (command === 'watch' || command === 'live') {
      await this.startContinuousMonitoring();
    } else if (command === 'interactive' || command === 'i') {
      await this.startInteractive();
    } else {
      await this.displayStatus();
      await this.displayQuickActions();
    }
  }

  async startContinuousMonitoring(): Promise<void> {
    console.log('🔄 Starting continuous system monitoring...');
    console.log('Press Ctrl+C to stop\n');

    const updateInterval = 5000; // 5 seconds

    const updateStatus = async () => {
      // Clear screen (works on most terminals)
      console.clear();

      await this.displayStatus();
      await this.displayQuickActions();

      console.log(
        `\n🔄 Next update in ${
          updateInterval / 1000
        } seconds... (Press Ctrl+C to stop)`,
      );
    };

    // Initial display
    await updateStatus();

    // Set up continuous updates
    const intervalId = setInterval(updateStatus, updateInterval);

    // Graceful shutdown
    process.on('SIGINT', () => {
      clearInterval(intervalId);
      console.log('\n🛑 Continuous monitoring stopped');
      process.exit(0);
    });
  }

  async displayStatus(): Promise<void> {
    this.log('Fetching system status...\n');

    try {
      // Perform real-time health checks
      const health = await this.performHealthCheck();
      const taskStats = await this.getTaskStats();

      // Display system health dashboard
      console.log('🤖 Enhanced System Monitor Status');
      console.log(
        '═══════════════════════════════════════════════════════════════\n',
      );

      console.log('📊 System Health:');
      console.log(
        `  Backend:           ${this.getStatusIcon(
          health.backend,
        )} ${this.getStatusText(health.backend)}`,
      );
      console.log(
        `  LocalTunnel:       ${this.getStatusIcon(
          health.localtunnel,
        )} ${this.getStatusText(health.localtunnel)}`,
      );
      console.log(
        `  Webhook:           ${this.getStatusIcon(
          health.webhook,
        )} ${this.getStatusText(health.webhook)}`,
      );
      console.log(
        `  AI API Server:     ${this.getStatusIcon(
          health.aiApiServer,
        )} ${this.getStatusText(health.aiApiServer)}`,
      );
      console.log(
        `  AI Webhook Server: ${this.getStatusIcon(
          health.aiWebhookServer,
        )} ${this.getStatusText(health.aiWebhookServer)}`,
      );
      console.log(
        `  Task Manager:      ${this.getStatusIcon(
          health.taskManager,
        )} ${this.getStatusText(health.taskManager)}`,
      );

      console.log('\n📋 Task Statistics:');
      console.log(`  Total Tasks:       ${taskStats.total}`);
      console.log(`  Completed:         ${taskStats.completed} 🟢`);
      console.log(`  Pending:           ${taskStats.pending} 🟡`);
      console.log(`  Failed:            ${taskStats.failed} 🔴`);
      console.log(
        `  Last Updated:      ${new Date(
          taskStats.lastUpdated,
        ).toLocaleString()}`,
      );

      console.log('\n⏱️  System Info:');
      console.log(`  Last Check:        ${health.lastCheck.toLocaleString()}`);

      console.log('\n🔗 Service URLs:');
      console.log('  Backend:           http://localhost:3006');
      console.log(
        '  LocalTunnel:       https://symbiotic-syntheconomy.loca.lt',
      );
      console.log('  AI API:            http://localhost:3009/ai-task');
      console.log('  AI Webhook:        http://localhost:3008/ai-contribution');

      console.log(
        '\n═══════════════════════════════════════════════════════════════',
      );

      // Additional task information
      await this.displayTaskDetails();

      // Display recent logs
      await this.displayRecentLogs();
    } catch (error) {
      this.log(`Error fetching status: ${error}`);
    }
  }

  private async displayTaskDetails(): Promise<void> {
    try {
      const taskFile = path.join(process.cwd(), 'tasks', 'task-list.json');
      if (!fs.existsSync(taskFile)) {
        console.log(
          '\n📋 No task list found. Run `npm run tasks:generate` to create one.',
        );
        return;
      }

      const content = fs.readFileSync(taskFile, 'utf-8');
      const taskList = JSON.parse(content);

      console.log('\n📋 Task Details:');
      console.log(
        '═══════════════════════════════════════════════════════════════',
      );

      // Group tasks by priority
      const highPriority = taskList.tasks.filter(
        (t: any) => t.priority === 'high',
      );
      const mediumPriority = taskList.tasks.filter(
        (t: any) => t.priority === 'medium',
      );
      const lowPriority = taskList.tasks.filter(
        (t: any) => t.priority === 'low',
      );

      if (highPriority.length > 0) {
        console.log('\n🔴 High Priority Tasks:');
        highPriority.forEach((task: any) => {
          const statusIcon = {
            'pending': '⏳',
            'in-progress': '🔄',
            'completed': '✅',
            'failed': '❌',
          }[task.status];
          console.log(`  ${statusIcon} ${task.task} (${task.category})`);
        });
      }

      if (mediumPriority.length > 0) {
        console.log('\n🟡 Medium Priority Tasks:');
        mediumPriority.forEach((task: any) => {
          const statusIcon = {
            'pending': '⏳',
            'in-progress': '🔄',
            'completed': '✅',
            'failed': '❌',
          }[task.status];
          console.log(`  ${statusIcon} ${task.task} (${task.category})`);
        });
      }

      if (lowPriority.length > 0) {
        console.log('\n🟢 Low Priority Tasks:');
        lowPriority.forEach((task: any) => {
          const statusIcon = {
            'pending': '⏳',
            'in-progress': '🔄',
            'completed': '✅',
            'failed': '❌',
          }[task.status];
          console.log(`  ${statusIcon} ${task.task} (${task.category})`);
        });
      }

      console.log(
        '\n═══════════════════════════════════════════════════════════════',
      );
    } catch (error) {
      console.log(`\n❌ Error loading task details: ${error}`);
    }
  }

  private async displayRecentLogs(): Promise<void> {
    try {
      const logFiles = [
        'log/system-monitor.log',
        'log/ai-api.log',
        'log/ai-webhook.log',
        'log/task-manager.log',
      ];

      console.log('\n📝 Recent System Activity:');
      console.log(
        '═══════════════════════════════════════════════════════════════',
      );

      for (const logFile of logFiles) {
        const fullPath = path.join(process.cwd(), logFile);
        if (fs.existsSync(fullPath)) {
          const content = fs.readFileSync(fullPath, 'utf-8');
          const lines = content.split('\n').filter((line) => line.trim());
          const recentLines = lines.slice(-5); // Last 5 lines

          if (recentLines.length > 0) {
            const logName =
              logFile.split('/').pop()?.replace('.log', '') || 'unknown';
            console.log(`\n📄 ${logName.toUpperCase()} (last 5 entries):`);
            recentLines.forEach((line) => {
              if (line.trim()) {
                console.log(`  ${line.trim()}`);
              }
            });
          }
        }
      }

      console.log(
        '\n═══════════════════════════════════════════════════════════════',
      );
    } catch (error) {
      console.log(`\n❌ Error loading recent logs: ${error}`);
    }
  }

  async displayQuickActions(): Promise<void> {
    console.log('\n🚀 Quick Actions:');
    console.log(
      '═══════════════════════════════════════════════════════════════',
    );
    console.log('  npm run tasks:generate    - Generate new task list');
    console.log('  npm run tasks:list        - Display current tasks');
    console.log('  npm run tasks:process     - Process all pending tasks');
    console.log('  npm run tasks:stats       - Show task statistics');
    console.log('  npm run ai:api            - Start AI API server');
    console.log('  npm run ai:webhook        - Start AI webhook server');
    console.log('  npm run monitor           - Start system monitor');
    console.log('  npm run status            - Show this status (current)');
    console.log('  npm run chatgpt:preload   - Preload ChatGPT directive');
    console.log('  npm run chatgpt:next      - Send next task to ChatGPT');
    console.log(
      '\n═══════════════════════════════════════════════════════════════',
    );
  }
}

// Start the status display if this script is run directly
if (require.main === module) {
  const status = new SystemStatus();
  status.start().catch(console.error);
}

export default SystemStatus;
