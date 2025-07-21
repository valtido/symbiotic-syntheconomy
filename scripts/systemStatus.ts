#!/usr/bin/env tsx

import SystemMonitor from './systemMonitor';
import fs from 'fs';
import path from 'path';

class SystemStatus {
  private monitor: SystemMonitor;

  constructor() {
    this.monitor = new SystemMonitor();
  }

  private log(message: string) {
    console.log(`📊 ${message}`);
  }

  async displayStatus(): Promise<void> {
    this.log('Fetching system status...\n');

    try {
      // Get formatted status from monitor
      const formattedStatus = this.monitor.getFormattedStatus();
      console.log(formattedStatus);

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
    console.log('  npm run ai:api:mock       - Start AI API server');
    console.log('  npm run ai:webhook        - Start AI webhook server');
    console.log('  npm run monitor           - Start system monitor');
    console.log('  npm run status            - Show this status (current)');
    console.log(
      '\n═══════════════════════════════════════════════════════════════',
    );
  }

  async start(): Promise<void> {
    await this.displayStatus();
    await this.displayQuickActions();
  }
}

// Start the status display if this script is run directly
if (require.main === module) {
  const status = new SystemStatus();
  status.start().catch(console.error);
}

export default SystemStatus;
