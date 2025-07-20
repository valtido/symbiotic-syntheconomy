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
    // Check if service is already running by looking for the actual process
    const isRunning = await checkIfServiceRunning(serviceId, service);
    if (isRunning) {
      return NextResponse.json(
        { error: 'Service is already running' },
        { status: 400 },
      );
    }

    // Check if port is in use (only for services with ports)
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

async function checkIfServiceRunning(
  serviceId: string,
  service: any,
): Promise<boolean> {
  try {
    // For services with ports, check if the port is in use
    if (service.port) {
      try {
        await execAsync(`lsof -i :${service.port}`);
        return true; // Port is in use, service is running
      } catch (error) {
        return false; // Port is not in use
      }
    }

    // For background processes, check if the command is running
    const commandPattern = getCommandPattern(service.command);
    try {
      const { stdout } = await execAsync(
        `ps aux | grep "${commandPattern}" | grep -v grep`,
      );
      return stdout.trim().length > 0;
    } catch (error) {
      return false;
    }
  } catch (error) {
    console.error(`Error checking if service ${serviceId} is running:`, error);
    return false;
  }
}

function getCommandPattern(command: string): string {
  // Extract the main command from the full command string
  const parts = command.split(' ');
  if (parts[0] === 'npx') {
    return parts[1]; // For npx commands, use the package name
  }
  return parts[0]; // For other commands, use the first part
}

async function stopService(serviceId: string) {
  try {
    const childProcess = runningProcesses.get(serviceId);

    if (!childProcess) {
      // Try to find and kill the process by command pattern
      return await killServiceByCommand(serviceId);
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

async function killServiceByCommand(serviceId: string) {
  try {
    // Get the service configuration to find the command
    const services = [
      { id: 'backend', command: 'npm run dev' },
      { id: 'frontend', command: 'npm run dev' },
      { id: 'file-watcher', command: 'npx tsx watch scripts/fileWatcher.ts' },
      { id: 'patch-cleanup', command: 'npx tsx scripts/cleanupPatches.ts' },
    ];

    const service = services.find((s) => s.id === serviceId);
    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    const commandPattern = getCommandPattern(service.command);

    // Find and kill the process
    const { stdout } = await execAsync(
      `ps aux | grep "${commandPattern}" | grep -v grep`,
    );

    if (stdout.trim().length === 0) {
      return NextResponse.json(
        { error: 'Service is not running' },
        { status: 400 },
      );
    }

    // Kill the process
    await execAsync(`pkill -f "${commandPattern}"`);

    return NextResponse.json({
      success: true,
      message: `Service ${serviceId} stopped successfully`,
    });
  } catch (error) {
    console.error(`Error killing service ${serviceId}:`, error);
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
    const services = [
      { id: 'backend', command: 'npm run dev', port: 3006 },
      { id: 'frontend', command: 'npm run dev', port: 3009 },
      {
        id: 'file-watcher',
        command: 'npx tsx watch scripts/fileWatcher.ts',
        port: null,
      },
      {
        id: 'patch-cleanup',
        command: 'npx tsx scripts/cleanupPatches.ts',
        port: null,
      },
    ];

    const serviceStatuses: Array<{
      serviceId: string;
      pid?: number;
      running: boolean;
    }> = [];

    for (const service of services) {
      const childProcess = runningProcesses.get(service.id);

      if (childProcess) {
        // Service is managed by this API
        serviceStatuses.push({
          serviceId: service.id,
          pid: childProcess.pid,
          running: !childProcess.killed,
        });
      } else {
        // Check if service is running externally
        const isRunning = await checkIfServiceRunning(service.id, service);
        if (isRunning) {
          // Try to get the PID
          try {
            const commandPattern = getCommandPattern(service.command);
            const { stdout } = await execAsync(
              `ps aux | grep "${commandPattern}" | grep -v grep | awk '{print $2}' | head -1`,
            );
            const pid = stdout.trim();

            serviceStatuses.push({
              serviceId: service.id,
              pid: pid ? parseInt(pid) : undefined,
              running: true,
            });
          } catch (error) {
            serviceStatuses.push({
              serviceId: service.id,
              running: true,
            });
          }
        } else {
          serviceStatuses.push({
            serviceId: service.id,
            running: false,
          });
        }
      }
    }

    return NextResponse.json({
      services: serviceStatuses,
      total: serviceStatuses.length,
    });
  } catch (error) {
    console.error('Error getting service status:', error);
    return NextResponse.json(
      { error: 'Failed to get service status' },
      { status: 500 },
    );
  }
}
