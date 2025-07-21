#!/usr/bin/env tsx

import SystemMonitor from './systemMonitor';

interface StatusDisplay {
  component: string;
  status: '🟢' | '🔴' | '🟡';
  lastCheck: string;
  uptime: string;
  details: string;
}

class SystemStatus {
  private monitor: SystemMonitor;
  private updateInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.monitor = new SystemMonitor();
  }

  private formatUptime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  private formatTime(date: Date): string {
    return date.toLocaleTimeString();
  }

  private getStatusIcon(healthy: boolean): '🟢' | '🔴' | '🟡' {
    return healthy ? '🟢' : '🔴';
  }

  private async getSystemStatus(): Promise<StatusDisplay[]> {
    const status = this.monitor.getStatus();

    return [
      {
        component: 'Backend API',
        status: this.getStatusIcon(status.backend),
        lastCheck: this.formatTime(status.lastCheck),
        uptime: this.formatUptime(status.uptime),
        details: status.backend
          ? 'Healthy - responding on port 3006'
          : 'Unhealthy - not responding',
      },
      {
        component: 'LocalTunnel',
        status: this.getStatusIcon(status.localtunnel),
        lastCheck: this.formatTime(status.lastCheck),
        uptime: this.formatUptime(status.uptime),
        details: status.localtunnel
          ? 'Healthy - tunnel active'
          : 'Unhealthy - tunnel down',
      },
      {
        component: 'Webhook',
        status: this.getStatusIcon(status.webhook),
        lastCheck: this.formatTime(status.lastCheck),
        uptime: this.formatUptime(status.uptime),
        details: status.webhook
          ? 'Healthy - receiving GitHub events'
          : 'Unhealthy - not receiving events',
      },
      {
        component: 'Auto-Recovery',
        status: status.recoveryAttempts > 0 ? '🟡' : '🟢',
        lastCheck: this.formatTime(status.lastCheck),
        uptime: this.formatUptime(status.uptime),
        details:
          status.recoveryAttempts > 0
            ? `Recovery attempts: ${status.recoveryAttempts}/5`
            : 'No recovery needed',
      },
    ];
  }

  private clearScreen(): void {
    console.clear();
  }

  private async displayStatus(): Promise<void> {
    this.clearScreen();

    console.log('🤖 Symbiotic Syntheconomy - System Status Dashboard');
    console.log('='.repeat(60));
    console.log(`📊 Last Updated: ${new Date().toLocaleString()}`);
    console.log('');

    const statuses = await this.getSystemStatus();

    for (const status of statuses) {
      console.log(`${status.status} ${status.component}`);
      console.log(`   Last Check: ${status.lastCheck}`);
      console.log(`   Uptime: ${status.uptime}`);
      console.log(`   Details: ${status.details}`);
      console.log('');
    }

    console.log('📋 Commands:');
    console.log('   Ctrl+C - Exit dashboard');
    console.log('   npm run start:system - Start all services');
    console.log('   npm run monitor:system - Start auto-recovery');
    console.log('');
  }

  async start(): Promise<void> {
    console.log('🚀 Starting System Status Dashboard...');

    // Initial display
    await this.displayStatus();

    // Update every 5 seconds
    this.updateInterval = setInterval(async () => {
      await this.displayStatus();
    }, 5000);

    // Graceful shutdown
    process.on('SIGINT', () => {
      if (this.updateInterval) {
        clearInterval(this.updateInterval);
      }
      console.log('\n🛑 Dashboard stopped');
      process.exit(0);
    });
  }
}

// Start the dashboard if this script is run directly
if (require.main === module) {
  const dashboard = new SystemStatus();
  dashboard.start().catch(console.error);
}

export default SystemStatus;
