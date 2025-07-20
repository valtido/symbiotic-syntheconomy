import { NextRequest, NextResponse } from 'next/server';
import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import { platform } from 'os';
import { resolve } from 'path';

const execAsync = promisify(exec);

// Store running processes
const runningProcesses = new Map<string, any>();

interface ServiceRequest {
  serviceId: string;
  action: 'start' | 'stop' | 'restart';
  service: {
    command: string;
    directory: string;
    port: number | null;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: ServiceRequest = await request.json();
    const { serviceId, action, service } = body;

    console.log(`Service management request: ${action} ${serviceId}`);

    switch (action) {
      case 'start':
        return await startService(serviceId, service);
      case 'stop':
        return await stopService(serviceId);
      case 'restart':
        return await restartService(serviceId, service);
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Service management error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

async function startService(serviceId: string, service: any) {
  try {
    // Check if service is already running
    if (runningProcesses.has(serviceId)) {
      return NextResponse.json(
        { error: 'Service is already running' },
        { status: 400 },
      );
    }

    // Check if port is in use
    if (service.port) {
      try {
        await execAsync(`lsof -i :${service.port}`);
        return NextResponse.json(
          { error: `Port ${service.port} is already in use` },
          { status: 400 },
        );
      } catch (error) {
        // Port is available
      }
    }

    // Get absolute path to project root (one level up from dashboard)
    const projectRoot = resolve(process.cwd(), '..');
    const serviceDir = resolve(projectRoot, service.directory);

    console.log(`Starting service ${serviceId} in directory: ${serviceDir}`);
    console.log(`Command: ${service.command}`);

    // Use a simpler approach - just use the command directly with shell: true
    const childProcess = spawn(service.command, [], {
      cwd: serviceDir,
      stdio: 'pipe',
      shell: true,
      env: {
        ...process.env,
        PORT: service.port?.toString() || '',
        NODE_ENV: 'development',
      },
    });

    // Store the process
    runningProcesses.set(serviceId, childProcess);

    // Handle process events
    childProcess.on('error', (error) => {
      console.error(`Service ${serviceId} error:`, error);
      runningProcesses.delete(serviceId);
    });

    childProcess.on('exit', (code) => {
      console.log(`Service ${serviceId} exited with code ${code}`);
      runningProcesses.delete(serviceId);
    });

    // Handle stdout and stderr
    childProcess.stdout?.on('data', (data) => {
      console.log(`[${serviceId}] ${data.toString().trim()}`);
    });

    childProcess.stderr?.on('data', (data) => {
      console.error(`[${serviceId}] ERROR: ${data.toString().trim()}`);
    });

    // Wait a moment to see if the process starts successfully
    await new Promise((resolve) => setTimeout(resolve, 3000));

    if (childProcess.killed) {
      runningProcesses.delete(serviceId);
      return NextResponse.json(
        { error: 'Service failed to start' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: `Service ${serviceId} started successfully`,
      pid: childProcess.pid,
    });
  } catch (error) {
    console.error(`Error starting service ${serviceId}:`, error);
    return NextResponse.json(
      {
        error: `Failed to start service: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      },
      { status: 500 },
    );
  }
}

async function stopService(serviceId: string) {
  try {
    const childProcess = runningProcesses.get(serviceId);

    if (!childProcess) {
      return NextResponse.json(
        { error: 'Service is not running' },
        { status: 400 },
      );
    }

    // Kill the process
    childProcess.kill('SIGTERM');

    // Wait for process to terminate
    await new Promise((resolve) => {
      childProcess.on('exit', resolve);
      setTimeout(resolve, 5000); // Timeout after 5 seconds
    });

    runningProcesses.delete(serviceId);

    return NextResponse.json({
      success: true,
      message: `Service ${serviceId} stopped successfully`,
    });
  } catch (error) {
    console.error(`Error stopping service ${serviceId}:`, error);
    return NextResponse.json(
      {
        error: `Failed to stop service: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      },
      { status: 500 },
    );
  }
}

async function restartService(serviceId: string, service: any) {
  try {
    // Stop the service first
    await stopService(serviceId);

    // Wait a moment
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Start the service
    return await startService(serviceId, service);
  } catch (error) {
    console.error(`Error restarting service ${serviceId}:`, error);
    return NextResponse.json(
      {
        error: `Failed to restart service: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      },
      { status: 500 },
    );
  }
}

// Get status of all services
export async function GET() {
  try {
    const services = Array.from(runningProcesses.entries()).map(
      ([serviceId, childProcess]) => ({
        serviceId,
        pid: childProcess.pid,
        running: !childProcess.killed,
      }),
    );

    return NextResponse.json({
      services,
      total: services.length,
    });
  } catch (error) {
    console.error('Error getting service status:', error);
    return NextResponse.json(
      { error: 'Failed to get service status' },
      { status: 500 },
    );
  }
}
