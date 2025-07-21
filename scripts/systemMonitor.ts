#!/usr/bin/env tsx

import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

interface SystemStatus {
  backend: boolean;
  localtunnel: boolean;
  webhook: boolean;
  lastCheck: Date;
  uptime: number;
  recoveryAttempts: number;
}

class SystemMonitor {
  private status: SystemStatus;
  private logFile: string;
  private maxRecoveryAttempts = 5;
  private checkInterval = 30000; // 30 seconds
  private recoveryCooldown = 60000; // 1 minute

  constructor() {
    this.status = {
      backend: false,
      localtunnel: false,
      webhook: false,
      lastCheck: new Date(),
      uptime: 0,
      recoveryAttempts: 0,
    };

    this.logFile = path.join(process.cwd(), 'log', 'system-monitor.log');
    this.ensureLogDirectory();
  }

  private ensureLogDirectory() {
    const logDir = path.dirname(this.logFile);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  private log(message: string, level: 'INFO' | 'WARN' | 'ERROR' = 'INFO') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level}] ${message}\n`;

    console.log(logMessage.trim());
    fs.appendFileSync(this.logFile, logMessage);
  }

  async checkBackendHealth(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch('http://localhost:3006/health', {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        return data.status === 'healthy';
      }
      return false;
    } catch (error) {
      this.log(`Backend health check failed: ${error}`, 'WARN');
      return false;
    }
  }

  async checkLocalTunnelHealth(): Promise<boolean> {
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

      if (response.ok) {
        const data = await response.json();
        return data.status === 'healthy';
      }
      return false;
    } catch (error) {
      this.log(`LocalTunnel health check failed: ${error}`, 'WARN');
      return false;
    }
  }

  async checkWebhookHealth(): Promise<boolean> {
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

      // Any response means the webhook is reachable
      return response.status < 500;
    } catch (error) {
      this.log(`Webhook health check failed: ${error}`, 'WARN');
      return false;
    }
  }

  async killProcessOnPort(port: number): Promise<void> {
    try {
      const { stdout } = await execAsync(`lsof -ti:${port}`);
      if (stdout.trim()) {
        const pids = stdout.trim().split('\n');
        for (const pid of pids) {
          await execAsync(`kill -9 ${pid}`);
          this.log(`Killed process ${pid} on port ${port}`);
        }
      }
    } catch (error) {
      // No process found on port, which is fine
    }
  }

  async restartBackend(): Promise<boolean> {
    try {
      this.log('Restarting backend...', 'WARN');

      // Kill any existing backend process
      await this.killProcessOnPort(3006);

      // Wait a moment for port to be freed
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Start backend in background
      const backendProcess = spawn('npm', ['run', 'dev'], {
        cwd: path.join(process.cwd(), 'backend'),
        detached: true,
        stdio: 'ignore',
      });

      backendProcess.unref();

      // Wait for backend to start
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // Check if backend is healthy
      const isHealthy = await this.checkBackendHealth();

      if (isHealthy) {
        this.log('Backend restarted successfully', 'INFO');
        return true;
      } else {
        this.log('Backend restart failed', 'ERROR');
        return false;
      }
    } catch (error) {
      this.log(`Backend restart error: ${error}`, 'ERROR');
      return false;
    }
  }

  async restartLocalTunnel(): Promise<boolean> {
    try {
      this.log('Restarting LocalTunnel...', 'WARN');

      // Kill any existing localtunnel process
      const { stdout } = await execAsync('pkill -f "localtunnel.*3006"');

      // Wait a moment
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Start localtunnel in background
      const tunnelProcess = spawn(
        'npx',
        [
          'localtunnel',
          '--port',
          '3006',
          '--subdomain',
          'symbiotic-syntheconomy',
        ],
        {
          cwd: process.cwd(),
          detached: true,
          stdio: 'ignore',
        },
      );

      tunnelProcess.unref();

      // Wait for tunnel to establish
      await new Promise((resolve) => setTimeout(resolve, 10000));

      // Check if tunnel is healthy
      const isHealthy = await this.checkLocalTunnelHealth();

      if (isHealthy) {
        this.log('LocalTunnel restarted successfully', 'INFO');
        return true;
      } else {
        this.log('LocalTunnel restart failed', 'ERROR');
        return false;
      }
    } catch (error) {
      this.log(`LocalTunnel restart error: ${error}`, 'ERROR');
      return false;
    }
  }

  async performRecovery(): Promise<void> {
    if (this.status.recoveryAttempts >= this.maxRecoveryAttempts) {
      this.log(
        'Max recovery attempts reached. Manual intervention required.',
        'ERROR',
      );
      return;
    }

    this.status.recoveryAttempts++;
    this.log(
      `Starting recovery attempt ${this.status.recoveryAttempts}/${this.maxRecoveryAttempts}`,
      'WARN',
    );

    // Recovery sequence
    const recoverySteps = [
      {
        name: 'Backend',
        check: () => this.checkBackendHealth(),
        restart: () => this.restartBackend(),
      },
      {
        name: 'LocalTunnel',
        check: () => this.checkLocalTunnelHealth(),
        restart: () => this.restartLocalTunnel(),
      },
    ];

    for (const step of recoverySteps) {
      const isHealthy = await step.check();
      if (!isHealthy) {
        this.log(`Recovering ${step.name}...`, 'WARN');
        const success = await step.restart();
        if (!success) {
          this.log(`${step.name} recovery failed`, 'ERROR');
        }
      }
    }

    // Wait before next recovery attempt
    await new Promise((resolve) => setTimeout(resolve, this.recoveryCooldown));
  }

  async checkSystemHealth(): Promise<void> {
    const startTime = Date.now();

    try {
      // Check all components
      const backendHealth = await this.checkBackendHealth();
      const tunnelHealth = await this.checkLocalTunnelHealth();
      const webhookHealth = await this.checkWebhookHealth();

      // Update status
      const previousStatus = { ...this.status };
      this.status = {
        backend: backendHealth,
        localtunnel: tunnelHealth,
        webhook: webhookHealth,
        lastCheck: new Date(),
        uptime: this.status.uptime + (Date.now() - startTime),
        recoveryAttempts: this.status.recoveryAttempts,
      };

      // Log status changes
      if (backendHealth !== previousStatus.backend) {
        this.log(
          `Backend status: ${backendHealth ? 'HEALTHY' : 'UNHEALTHY'}`,
          backendHealth ? 'INFO' : 'WARN',
        );
      }

      if (tunnelHealth !== previousStatus.localtunnel) {
        this.log(
          `LocalTunnel status: ${tunnelHealth ? 'HEALTHY' : 'UNHEALTHY'}`,
          tunnelHealth ? 'INFO' : 'WARN',
        );
      }

      if (webhookHealth !== previousStatus.webhook) {
        this.log(
          `Webhook status: ${webhookHealth ? 'HEALTHY' : 'UNHEALTHY'}`,
          webhookHealth ? 'INFO' : 'WARN',
        );
      }

      // Check if recovery is needed
      const allHealthy = backendHealth && tunnelHealth && webhookHealth;

      if (!allHealthy) {
        this.log('System unhealthy, initiating recovery...', 'WARN');
        await this.performRecovery();
      } else {
        // Reset recovery attempts on healthy state
        this.status.recoveryAttempts = 0;
        this.log('All systems healthy', 'INFO');
      }
    } catch (error) {
      this.log(`Health check error: ${error}`, 'ERROR');
    }
  }

  async start(): Promise<void> {
    this.log('🚀 Starting System Monitor...', 'INFO');
    this.log(`📊 Check interval: ${this.checkInterval}ms`, 'INFO');
    this.log(`🔄 Max recovery attempts: ${this.maxRecoveryAttempts}`, 'INFO');
    this.log(`⏰ Recovery cooldown: ${this.recoveryCooldown}ms`, 'INFO');

    // Initial health check
    await this.checkSystemHealth();

    // Start monitoring loop
    setInterval(async () => {
      await this.checkSystemHealth();
    }, this.checkInterval);

    // Graceful shutdown
    process.on('SIGINT', () => {
      this.log('🛑 System Monitor shutting down...', 'INFO');
      process.exit(0);
    });
  }

  getStatus(): SystemStatus {
    return { ...this.status };
  }
}

// Start the monitor if this script is run directly
if (require.main === module) {
  const monitor = new SystemMonitor();
  monitor.start().catch(console.error);
}

export default SystemMonitor;
