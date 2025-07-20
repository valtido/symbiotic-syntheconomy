'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';

interface Service {
  id: string;
  name: string;
  description: string;
  port: number | null;
  command: string;
  directory: string;
  healthEndpoint?: string;
  status: 'running' | 'stopped' | 'error' | 'unknown';
  pid?: number;
  lastChecked: Date;
}

const services: Omit<Service, 'status' | 'lastChecked'>[] = [
  {
    id: 'backend',
    name: 'Backend API',
    description: 'Fastify backend server with webhook endpoints',
    port: 3006,
    command: 'npm run dev',
    directory: 'backend',
    healthEndpoint: '/health',
  },
  {
    id: 'frontend',
    name: 'Frontend App',
    description: 'Next.js frontend application',
    port: 3009,
    command: 'npm run dev',
    directory: 'frontend',
  },
  {
    id: 'file-watcher',
    name: 'File Watcher',
    description: 'TypeScript file watcher for auto-patching',
    port: null,
    command: 'npx tsx watch scripts/fileWatcher.ts',
    directory: '.',
  },
  {
    id: 'contracts',
    name: 'Smart Contracts',
    description: 'Hardhat development environment',
    port: 3010,
    command: 'npm run dev',
    directory: 'contracts',
  },
  {
    id: 'patch-cleanup',
    name: 'Patch Cleanup',
    description: 'Automatic patch cleanup service',
    port: null,
    command: 'npx tsx scripts/cleanupPatches.ts',
    directory: '.',
  },
];

export default function ManagementPage() {
  const [serviceStates, setServiceStates] = useState<Record<string, Service>>(
    () => {
      const initial: Record<string, Service> = {};
      services.forEach((service) => {
        initial[service.id] = {
          ...service,
          status: 'unknown',
          lastChecked: new Date(),
        };
      });
      return initial;
    },
  );
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  const checkServiceHealth = async (
    service: Omit<Service, 'status' | 'lastChecked'>,
  ): Promise<Service> => {
    // For services with health endpoints, check them
    if (service.port && service.healthEndpoint) {
      try {
        const response = await fetch(
          `http://localhost:${service.port}${service.healthEndpoint}`,
          {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            signal: AbortSignal.timeout(5000), // 5 second timeout
          },
        );

        if (response.ok) {
          return { ...service, status: 'running', lastChecked: new Date() };
        } else {
          return { ...service, status: 'error', lastChecked: new Date() };
        }
      } catch (error) {
        return { ...service, status: 'stopped', lastChecked: new Date() };
      }
    }

    // For services with ports but no health endpoint, try a basic connection
    if (service.port) {
      try {
        const response = await fetch(`http://localhost:${service.port}`, {
          method: 'GET',
          signal: AbortSignal.timeout(3000), // 3 second timeout
        });

        if (response.ok || response.status < 500) {
          return { ...service, status: 'running', lastChecked: new Date() };
        } else {
          return { ...service, status: 'error', lastChecked: new Date() };
        }
      } catch (error) {
        return { ...service, status: 'stopped', lastChecked: new Date() };
      }
    }

    // For services without ports (background processes), we can't easily check
    // They'll show as unknown unless we implement process checking
    return { ...service, status: 'unknown', lastChecked: new Date() };
  };

  const checkAllServices = async () => {
    setError(null);
    const updatedStates = { ...serviceStates };

    for (const service of services) {
      try {
        const updatedService = await checkServiceHealth(service);
        updatedStates[service.id] = updatedService;
      } catch (error) {
        console.error(`Error checking ${service.name}:`, error);
        updatedStates[service.id] = {
          ...service,
          status: 'error',
          lastChecked: new Date(),
        };
      }
    }

    setServiceStates(updatedStates);
  };

  const executeServiceAction = async (
    serviceId: string,
    action: 'start' | 'stop' | 'restart',
  ) => {
    setLoading((prev) => ({ ...prev, [serviceId]: true }));
    setError(null);

    try {
      const service = serviceStates[serviceId];
      const response = await fetch('/api/management/service', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId,
          action,
          service: {
            command: service.command,
            directory: service.directory,
            port: service.port,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action} ${service.name}`);
      }

      // Wait a moment for the service to start/stop, then check status
      setTimeout(() => {
        checkAllServices();
        setLoading((prev) => ({ ...prev, [serviceId]: false }));
      }, 2000);
    } catch (error) {
      console.error(`Error ${action}ing ${serviceId}:`, error);
      setError(
        `Failed to ${action} ${serviceStates[serviceId].name}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
      setLoading((prev) => ({ ...prev, [serviceId]: false }));
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return '🟢';
      case 'stopped':
        return '🔴';
      case 'error':
        return '⚠️';
      default:
        return '🟡';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'success';
      case 'stopped':
        return 'error';
      case 'error':
        return 'error';
      default:
        return 'warning';
    }
  };

  useEffect(() => {
    checkAllServices();
    const interval = setInterval(checkAllServices, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant='h4' gutterBottom>
        Service Management Dashboard
      </Typography>

      <Typography variant='body1' color='text.secondary' sx={{ mb: 3 }}>
        Monitor and control all project services
      </Typography>

      {error && (
        <Alert severity='error' sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 3 }}>
        <Button variant='contained' onClick={checkAllServices} sx={{ mr: 2 }}>
          🔄 Refresh All
        </Button>
        <Button
          variant='outlined'
          onClick={() => {
            services.forEach((service) => {
              if (serviceStates[service.id].status !== 'running') {
                executeServiceAction(service.id, 'start');
              }
            });
          }}
        >
          ▶️ Start All
        </Button>
      </Box>

      {/* Vertical List Layout */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {services.map((service) => {
          const state = serviceStates[service.id];
          const isLoading = loading[service.id];

          return (
            <Card key={service.id} sx={{ width: '100%' }}>
              <CardContent>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mb: 2,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant='h6' sx={{ mr: 1 }}>
                      {getStatusIcon(state.status)}
                    </Typography>
                    <Typography variant='h6'>{service.name}</Typography>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title='Start Service'>
                      <IconButton
                        onClick={() =>
                          executeServiceAction(service.id, 'start')
                        }
                        disabled={isLoading || state.status === 'running'}
                        color='success'
                        size='small'
                      >
                        {isLoading && state.status === 'stopped' ? (
                          <CircularProgress size={20} />
                        ) : (
                          '▶️'
                        )}
                      </IconButton>
                    </Tooltip>

                    <Tooltip title='Stop Service'>
                      <IconButton
                        onClick={() => executeServiceAction(service.id, 'stop')}
                        disabled={isLoading || state.status === 'stopped'}
                        color='error'
                        size='small'
                      >
                        {isLoading && state.status === 'running' ? (
                          <CircularProgress size={20} />
                        ) : (
                          '⏹️'
                        )}
                      </IconButton>
                    </Tooltip>

                    <Tooltip title='Restart Service'>
                      <IconButton
                        onClick={() =>
                          executeServiceAction(service.id, 'restart')
                        }
                        disabled={isLoading}
                        color='primary'
                        size='small'
                      >
                        {isLoading ? <CircularProgress size={20} /> : '🔄'}
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>

                <Typography
                  variant='body2'
                  color='text.secondary'
                  sx={{ mb: 2 }}
                >
                  {service.description}
                </Typography>

                <Box
                  sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}
                >
                  <Chip
                    label={state.status}
                    color={getStatusColor(state.status) as any}
                    size='small'
                  />
                  {service.port && (
                    <Chip
                      label={`Port ${service.port}`}
                      variant='outlined'
                      size='small'
                    />
                  )}
                  <Typography variant='caption' color='text.secondary'>
                    Last checked: {state.lastChecked.toLocaleTimeString()}
                  </Typography>
                </Box>

                <Typography
                  variant='caption'
                  color='text.secondary'
                  display='block'
                >
                  Command: {service.command}
                </Typography>
              </CardContent>
            </Card>
          );
        })}
      </Box>

      <Box sx={{ mt: 4, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
        <Typography variant='h6' gutterBottom>
          Port Allocation
        </Typography>
        <Typography variant='body2' color='text.secondary'>
          Reserved ports 3000-3005 and 4000 are off-limits. Services are
          configured to use:
        </Typography>
        <Box component='ul' sx={{ mt: 1, pl: 2 }}>
          <li>Backend API: Port 3006</li>
          <li>Frontend App: Port 3009</li>
          <li>Smart Contracts: Port 3010</li>
        </Box>
      </Box>
    </Box>
  );
}
