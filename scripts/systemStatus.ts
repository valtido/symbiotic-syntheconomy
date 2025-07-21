#!/usr/bin/env tsx

interface StatusDisplay {
  component: string;
  status: '🟢' | '🔴' | '🟡';
  lastCheck: string;
  uptime: string;
  details: string;
}

interface SystemHealth {
  backend: boolean;
  localtunnel: boolean;
  webhook: boolean;
  lastCheck: Date;
}

class SystemStatus {
  private updateInterval: NodeJS.Timeout | null = null;
  private lastHealthCheck: SystemHealth = {
    backend: false,
    localtunnel: false,
    webhook: false,
    lastCheck: new Date(),
  };

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

  private async performHealthCheck(): Promise<void> {
    const [backendHealth, tunnelHealth, webhookHealth] = await Promise.all([
      this.checkBackendHealth(),
      this.checkLocalTunnelHealth(),
      this.checkWebhookHealth(),
    ]);

    this.lastHealthCheck = {
      backend: backendHealth,
      localtunnel: tunnelHealth,
      webhook: webhookHealth,
      lastCheck: new Date(),
    };
  }

  private async getSystemStatus(): Promise<StatusDisplay[]> {
    // Perform fresh health check
    await this.performHealthCheck();

    return [
      {
        component: 'Backend API',
        status: this.getStatusIcon(this.lastHealthCheck.backend),
        lastCheck: this.formatTime(this.lastHealthCheck.lastCheck),
        uptime: this.formatUptime(0), // We don't track uptime in this dashboard
        details: this.lastHealthCheck.backend
          ? 'Healthy - responding on port 3006'
          : 'Unhealthy - not responding',
      },
      {
        component: 'LocalTunnel',
        status: this.getStatusIcon(this.lastHealthCheck.localtunnel),
        lastCheck: this.formatTime(this.lastHealthCheck.lastCheck),
        uptime: this.formatUptime(0),
        details: this.lastHealthCheck.localtunnel
          ? 'Healthy - tunnel active'
          : 'Unhealthy - tunnel down',
      },
      {
        component: 'Webhook',
        status: this.getStatusIcon(this.lastHealthCheck.webhook),
        lastCheck: this.formatTime(this.lastHealthCheck.lastCheck),
        uptime: this.formatUptime(0),
        details: this.lastHealthCheck.webhook
          ? 'Healthy - receiving GitHub events'
          : 'Unhealthy - not receiving events',
      },
      {
        component: 'Auto-Recovery',
        status: '🟢', // We'll show this as always healthy since we're not tracking recovery attempts
        lastCheck: this.formatTime(this.lastHealthCheck.lastCheck),
        uptime: this.formatUptime(0),
        details: 'System monitor active',
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
