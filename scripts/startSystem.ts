#!/usr/bin/env tsx

import { spawn } from 'child_process';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const execAsync = promisify(exec);

class SystemStarter {
  private processes: Map<string, any> = new Map();
  private logFile: string;

  constructor() {
    this.logFile = path.join(process.cwd(), 'log', 'system-startup.log');
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

  async killExistingProcesses(): Promise<void> {
    this.log('Killing existing processes...', 'WARN');

    try {
      // Kill processes on port 3006
      await execAsync('lsof -ti:3006 | xargs kill -9');
      this.log('Killed processes on port 3006');
    } catch (error) {
      // No processes to kill
    }

    try {
      // Kill localtunnel processes
      await execAsync('pkill -f "localtunnel.*3006"');
      this.log('Killed localtunnel processes');
    } catch (error) {
      // No processes to kill
    }
  }

  async startBackend(): Promise<void> {
    this.log('Starting backend...', 'INFO');

    const backendProcess = spawn('npm', ['run', 'dev'], {
      cwd: path.join(process.cwd(), 'backend'),
      detached: true,
      stdio: 'pipe',
    });

    backendProcess.stdout?.on('data', (data) => {
      this.log(`Backend: ${data.toString().trim()}`);
    });

    backendProcess.stderr?.on('data', (data) => {
      this.log(`Backend Error: ${data.toString().trim()}`, 'ERROR');
    });

    this.processes.set('backend', backendProcess);

    // Wait for backend to start
    await new Promise((resolve) => setTimeout(resolve, 5000));
    this.log('Backend started', 'INFO');
  }

  async startLocalTunnel(): Promise<void> {
    this.log('Starting LocalTunnel...', 'INFO');

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
        stdio: 'pipe',
      },
    );

    tunnelProcess.stdout?.on('data', (data) => {
      this.log(`LocalTunnel: ${data.toString().trim()}`);
    });

    tunnelProcess.stderr?.on('data', (data) => {
      this.log(`LocalTunnel Error: ${data.toString().trim()}`, 'ERROR');
    });

    this.processes.set('localtunnel', tunnelProcess);

    // Wait for tunnel to establish
    await new Promise((resolve) => setTimeout(resolve, 10000));
    this.log('LocalTunnel started', 'INFO');
  }

  async startSystemMonitor(): Promise<void> {
    this.log('Starting System Monitor...', 'INFO');

    const monitorProcess = spawn('npx', ['tsx', 'scripts/systemMonitor.ts'], {
      cwd: process.cwd(),
      detached: true,
      stdio: 'pipe',
    });

    monitorProcess.stdout?.on('data', (data) => {
      this.log(`Monitor: ${data.toString().trim()}`);
    });

    monitorProcess.stderr?.on('data', (data) => {
      this.log(`Monitor Error: ${data.toString().trim()}`, 'ERROR');
    });

    this.processes.set('monitor', monitorProcess);
    this.log('System Monitor started', 'INFO');
  }

  async startActivityMonitor(): Promise<void> {
    this.log('Starting Activity Monitor...', 'INFO');

    const activityProcess = spawn('npm', ['run', 'monitor:activity'], {
      cwd: process.cwd(),
      detached: true,
      stdio: 'pipe',
    });

    activityProcess.stdout?.on('data', (data) => {
      this.log(`Activity: ${data.toString().trim()}`);
    });

    activityProcess.stderr?.on('data', (data) => {
      this.log(`Activity Error: ${data.toString().trim()}`, 'ERROR');
    });

    this.processes.set('activity', activityProcess);
    this.log('Activity Monitor started', 'INFO');
  }

  async healthCheck(): Promise<boolean> {
    try {
      // Check backend
      const backendResponse = await fetch('http://localhost:3006/health', {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });

      if (!backendResponse.ok) {
        this.log('Backend health check failed', 'ERROR');
        return false;
      }

      // Check tunnel
      const tunnelResponse = await fetch(
        'https://symbiotic-syntheconomy.loca.lt/health',
        {
          method: 'GET',
          signal: AbortSignal.timeout(10000),
        },
      );

      if (!tunnelResponse.ok) {
        this.log('LocalTunnel health check failed', 'ERROR');
        return false;
      }

      this.log('All systems healthy!', 'INFO');
      return true;
    } catch (error) {
      this.log(`Health check failed: ${error}`, 'ERROR');
      return false;
    }
  }

  async start(): Promise<void> {
    this.log('🚀 Starting Symbiotic Syntheconomy System...', 'INFO');

    try {
      // Kill existing processes
      await this.killExistingProcesses();

      // Start components in sequence
      await this.startBackend();
      await this.startLocalTunnel();
      await this.startSystemMonitor();
      await this.startActivityMonitor();

      // Wait for everything to stabilize
      await new Promise((resolve) => setTimeout(resolve, 15000));

      // Health check
      const isHealthy = await this.healthCheck();

      if (isHealthy) {
        this.log('✅ System started successfully!', 'INFO');
        this.log(
          '📊 Monitoring active - system will auto-recover from failures',
          'INFO',
        );
        this.log('🛑 Press Ctrl+C to stop all services', 'INFO');
      } else {
        this.log('❌ System startup incomplete - check logs', 'ERROR');
      }

      // Graceful shutdown
      process.on('SIGINT', async () => {
        this.log('🛑 Shutting down system...', 'INFO');

        for (const [name, process] of this.processes) {
          try {
            process.kill('SIGTERM');
            this.log(`Stopped ${name}`);
          } catch (error) {
            this.log(`Error stopping ${name}: ${error}`, 'ERROR');
          }
        }

        process.exit(0);
      });
    } catch (error) {
      this.log(`System startup failed: ${error}`, 'ERROR');
      process.exit(1);
    }
  }
}

// Start the system if this script is run directly
if (require.main === module) {
  const starter = new SystemStarter();
  starter.start().catch(console.error);
}

export default SystemStarter;
