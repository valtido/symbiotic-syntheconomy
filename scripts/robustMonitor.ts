// scripts/robustMonitor.ts
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

interface SystemStatus {
  commits: number;
  patches: number;
  webhookStatus: 'healthy' | 'unhealthy' | 'unknown';
  lastCheck: string;
}

class RobustMonitor {
  private lastWebhookCheck = 0;
  private webhookCheckInterval = 30000; // 30 seconds between webhook checks
  private isRunning = false;

  async getGitStats(): Promise<{ commits: number; patches: number }> {
    try {
      const { stdout: commitCount } = await execAsync(
        'git rev-list --count HEAD',
      );
      const patchesDir = path.resolve('patches');
      const patchCount = fs.existsSync(patchesDir)
        ? fs.readdirSync(patchesDir).filter((f) => f.endsWith('.md')).length
        : 0;

      return {
        commits: parseInt(commitCount.trim()),
        patches: patchCount,
      };
    } catch (error) {
      console.error('Error getting git stats:', error);
      return { commits: 0, patches: 0 };
    }
  }

  async checkWebhookHealth(): Promise<'healthy' | 'unhealthy' | 'unknown'> {
    const now = Date.now();
    if (now - this.lastWebhookCheck < this.webhookCheckInterval) {
      return 'unknown'; // Skip check if too recent
    }

    try {
      const { stdout } = await execAsync(
        'curl -s -o /dev/null -w "%{http_code}" https://symbiotic-syntheconomy.loca.lt/health',
      );
      this.lastWebhookCheck = now;

      if (stdout.trim() === '200') {
        return 'healthy';
      } else {
        return 'unhealthy';
      }
    } catch (error) {
      this.lastWebhookCheck = now;
      return 'unhealthy';
    }
  }

  async getStatus(): Promise<SystemStatus> {
    const [gitStats, webhookStatus] = await Promise.all([
      this.getGitStats(),
      this.checkWebhookHealth(),
    ]);

    return {
      ...gitStats,
      webhookStatus,
      lastCheck: new Date().toISOString(),
    };
  }

  async displayStatus(status: SystemStatus) {
    const statusEmoji = {
      healthy: '🟢',
      unhealthy: '🔴',
      unknown: '🟡',
    };

    console.clear();
    console.log('🤖 Robust AI Collaboration Monitor');
    console.log('=====================================');
    console.log(`📊 Status: ${new Date().toLocaleTimeString()}`);
    console.log(`📝 Commits: ${status.commits}`);
    console.log(`🔧 Patches: ${status.patches}`);
    console.log(
      `🌐 Webhook: ${
        statusEmoji[status.webhookStatus]
      } ${status.webhookStatus.toUpperCase()}`,
    );
    console.log(`⏰ Last Check: ${status.lastCheck}`);
    console.log('');
    console.log('💡 Waiting for AI agents to collaborate...');
    console.log('   - Webhook checks are rate-limited to prevent crashes');
    console.log('   - System is ready for real AI contributions');
    console.log('');
    console.log('Press Ctrl+C to stop monitoring');
  }

  async start() {
    if (this.isRunning) return;
    this.isRunning = true;

    console.log('🚀 Starting Robust AI Collaboration Monitor...');
    console.log('   Rate-limited webhook checks to prevent crashes');
    console.log('');

    while (this.isRunning) {
      try {
        const status = await this.getStatus();
        await this.displayStatus(status);

        // Wait 10 seconds before next check
        await new Promise((resolve) => setTimeout(resolve, 10000));
      } catch (error) {
        console.error('Monitor error:', error);
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }
  }

  stop() {
    this.isRunning = false;
    console.log('\n🛑 Monitor stopped');
  }
}

// Handle graceful shutdown
const monitor = new RobustMonitor();
process.on('SIGINT', () => {
  monitor.stop();
  process.exit(0);
});

// Start monitoring
monitor.start().catch(console.error);
