#!/usr/bin/env tsx

import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

interface TaskStats {
  total: number;
  pending: number;
  completed: number;
  failed: number;
  lastUpdated: string;
}

interface SystemStatus {
  backend: boolean;
  localtunnel: boolean;
  webhook: boolean;
  aiApiServer: boolean;
  aiWebhookServer: boolean;
  taskManager: boolean;
  lastCheck: Date;
  uptime: number;
  recoveryAttempts: number;
  taskStats: TaskStats;
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
      aiApiServer: false,
      aiWebhookServer: false,
      taskManager: false,
      lastCheck: new Date(),
      uptime: 0,
      recoveryAttempts: 0,
      taskStats: {
        total: 0,
        pending: 0,
        completed: 0,
        failed: 0,
        lastUpdated: new Date().toISOString(),
      },
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

  async checkAIApiServerHealth(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch('http://localhost:3009/health', {
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
      this.log(`AI API Server health check failed: ${error}`, 'WARN');
      return false;
    }
  }

  async checkAIWebhookServerHealth(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch('http://localhost:3008/health', {
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
      this.log(`AI Webhook Server health check failed: ${error}`, 'WARN');
      return false;
    }
  }

  async checkTaskManagerHealth(): Promise<boolean> {
    try {
      // Check if task list file exists and is readable
      const taskFile = path.join(process.cwd(), 'tasks', 'task-list.json');
      if (!fs.existsSync(taskFile)) {
        return false;
      }

      const content = fs.readFileSync(taskFile, 'utf-8');
      const taskList = JSON.parse(content);

      // Update task stats
      this.status.taskStats = {
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

      return true;
    } catch (error) {
      this.log(`Task Manager health check failed: ${error}`, 'WARN');
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
      try {
        await this.killProcessOnPort(3006);
      } catch (error) {
        // No process to kill, which is fine
        this.log('No existing backend process found to kill', 'INFO');
      }

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
      try {
        await execAsync('pkill -f "localtunnel.*3006"');
      } catch (error) {
        // No process to kill, which is fine
        this.log('No existing LocalTunnel process found to kill', 'INFO');
      }

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

  async restartAIApiServer(): Promise<boolean> {
    try {
      this.log('Restarting AI API Server...', 'WARN');

      // Kill any existing AI API server process
      try {
        await this.killProcessOnPort(3009);
      } catch (error) {
        this.log('No existing AI API Server process found to kill', 'INFO');
      }

      // Wait a moment for port to be freed
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Start AI API server in background
      const apiProcess = spawn('npm', ['run', 'ai:api:mock'], {
        cwd: process.cwd(),
        detached: true,
        stdio: 'ignore',
      });

      apiProcess.unref();

      // Wait for server to start
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // Check if server is healthy
      const isHealthy = await this.checkAIApiServerHealth();

      if (isHealthy) {
        this.log('AI API Server restarted successfully', 'INFO');
        return true;
      } else {
        this.log('AI API Server restart failed', 'ERROR');
        return false;
      }
    } catch (error) {
      this.log(`AI API Server restart error: ${error}`, 'ERROR');
      return false;
    }
  }

  async restartAIWebhookServer(): Promise<boolean> {
    try {
      this.log('Restarting AI Webhook Server...', 'WARN');

      // Kill any existing AI webhook server process
      try {
        await this.killProcessOnPort(3008);
      } catch (error) {
        this.log('No existing AI Webhook Server process found to kill', 'INFO');
      }

      // Wait a moment for port to be freed
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Start AI webhook server in background
      const webhookProcess = spawn('npm', ['run', 'ai:webhook'], {
        cwd: process.cwd(),
        detached: true,
        stdio: 'ignore',
      });

      webhookProcess.unref();

      // Wait for server to start
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // Check if server is healthy
      const isHealthy = await this.checkAIWebhookServerHealth();

      if (isHealthy) {
        this.log('AI Webhook Server restarted successfully', 'INFO');
        return true;
      } else {
        this.log('AI Webhook Server restart failed', 'ERROR');
        return false;
      }
    } catch (error) {
      this.log(`AI Webhook Server restart error: ${error}`, 'ERROR');
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
      {
        name: 'AI API Server',
        check: () => this.checkAIApiServerHealth(),
        restart: () => this.restartAIApiServer(),
      },
      {
        name: 'AI Webhook Server',
        check: () => this.checkAIWebhookServerHealth(),
        restart: () => this.restartAIWebhookServer(),
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
      const aiApiHealth = await this.checkAIApiServerHealth();
      const aiWebhookHealth = await this.checkAIWebhookServerHealth();
      const taskManagerHealth = await this.checkTaskManagerHealth();

      // Update status
      const previousStatus = { ...this.status };
      this.status = {
        backend: backendHealth,
        localtunnel: tunnelHealth,
        webhook: webhookHealth,
        aiApiServer: aiApiHealth,
        aiWebhookServer: aiWebhookHealth,
        taskManager: taskManagerHealth,
        lastCheck: new Date(),
        uptime: this.status.uptime + (Date.now() - startTime),
        recoveryAttempts: this.status.recoveryAttempts,
        taskStats: this.status.taskStats,
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

      if (aiApiHealth !== previousStatus.aiApiServer) {
        this.log(
          `AI API Server status: ${aiApiHealth ? 'HEALTHY' : 'UNHEALTHY'}`,
          aiApiHealth ? 'INFO' : 'WARN',
        );
      }

      if (aiWebhookHealth !== previousStatus.aiWebhookServer) {
        this.log(
          `AI Webhook Server status: ${
            aiWebhookHealth ? 'HEALTHY' : 'UNHEALTHY'
          }`,
          aiWebhookHealth ? 'INFO' : 'WARN',
        );
      }

      if (taskManagerHealth !== previousStatus.taskManager) {
        this.log(
          `Task Manager status: ${taskManagerHealth ? 'HEALTHY' : 'UNHEALTHY'}`,
          taskManagerHealth ? 'INFO' : 'WARN',
        );
      }

      // Log task statistics if available
      if (taskManagerHealth && this.status.taskStats.total > 0) {
        this.log(
          `Task Stats: ${this.status.taskStats.completed}/${this.status.taskStats.total} completed, ${this.status.taskStats.pending} pending, ${this.status.taskStats.failed} failed`,
          'INFO',
        );
      }

      // Check if recovery is needed
      const allHealthy =
        backendHealth &&
        tunnelHealth &&
        webhookHealth &&
        aiApiHealth &&
        aiWebhookHealth;

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
    this.log('🚀 Starting Enhanced System Monitor...', 'INFO');
    this.log(`📊 Check interval: ${this.checkInterval}ms`, 'INFO');
    this.log(`🔄 Max recovery attempts: ${this.maxRecoveryAttempts}`, 'INFO');
    this.log(`⏰ Recovery cooldown: ${this.recoveryCooldown}ms`, 'INFO');
    this.log(
      `🤖 Monitoring: Backend, LocalTunnel, Webhook, AI API, AI Webhook, Task Manager`,
      'INFO',
    );

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

  // Get formatted status for display
  getFormattedStatus(): string {
    const status = this.getStatus();
    const uptimeMinutes = Math.floor(status.uptime / 60000);
    const uptimeHours = Math.floor(uptimeMinutes / 60);
    const uptimeDays = Math.floor(uptimeHours / 24);

    let uptimeStr = '';
    if (uptimeDays > 0) uptimeStr += `${uptimeDays}d `;
    if (uptimeHours % 24 > 0) uptimeStr += `${uptimeHours % 24}h `;
    uptimeStr += `${uptimeMinutes % 60}m`;

    return `
🤖 Enhanced System Monitor Status
═══════════════════════════════════════════════════════════════

📊 System Health:
  Backend:           ${status.backend ? '🟢 HEALTHY' : '🔴 UNHEALTHY'}
  LocalTunnel:       ${status.localtunnel ? '🟢 HEALTHY' : '🔴 UNHEALTHY'}
  Webhook:           ${status.webhook ? '🟢 HEALTHY' : '🔴 UNHEALTHY'}
  AI API Server:     ${status.aiApiServer ? '🟢 HEALTHY' : '🔴 UNHEALTHY'}
  AI Webhook Server: ${status.aiWebhookServer ? '🟢 HEALTHY' : '🔴 UNHEALTHY'}
  Task Manager:      ${status.taskManager ? '🟢 HEALTHY' : '🔴 UNHEALTHY'}

📋 Task Statistics:
  Total Tasks:       ${status.taskStats.total}
  Completed:         ${status.taskStats.completed} 🟢
  Pending:           ${status.taskStats.pending} 🟡
  Failed:            ${status.taskStats.failed} 🔴
  Last Updated:      ${new Date(status.taskStats.lastUpdated).toLocaleString()}

⏱️  System Info:
  Uptime:            ${uptimeStr}
  Last Check:        ${status.lastCheck.toLocaleString()}
  Recovery Attempts: ${status.recoveryAttempts}/${this.maxRecoveryAttempts}

🔗 Service URLs:
  Backend:           http://localhost:3006
  LocalTunnel:       https://symbiotic-syntheconomy.loca.lt
  AI API:            http://localhost:3009/ai-task
  AI Webhook:        http://localhost:3008/ai-contribution

═══════════════════════════════════════════════════════════════
`;
  }
}

// Start the monitor if this script is run directly
if (require.main === module) {
  const monitor = new SystemMonitor();
  monitor.start().catch(console.error);
}

export default SystemMonitor;
