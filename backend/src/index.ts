import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import multipart from '@fastify/multipart';
import { config } from 'dotenv';

// Import routes
import { ritualRoutes } from './routes/ritualRoutes';
import { bioregionRoutes } from './routes/bioregionRoutes';
import { daoRoutes } from './routes/daoRoutes';
import githubWebhookRoutes from './endpoints/githubWebhook';

// Import services
import { DatabaseService } from './services/DatabaseService';
import { IPFSService } from './services/IPFSService';
import { BlockchainService } from './services/BlockchainService';

// Load environment variables
config();

const fastify = Fastify({
  logger: {
    level: process.env['LOG_LEVEL'] || 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    },
  },
});

// Register plugins
async function registerPlugins() {
  await fastify.register(cors, {
    origin: [
      process.env['FRONTEND_URL'] || 'http://localhost:3000',
      'http://localhost:3007', // Dashboard
      'http://localhost:3009', // Frontend (new port)
    ],
    credentials: true,
  });

  await fastify.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
  });

  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  await fastify.register(multipart);

  // Swagger documentation
  await fastify.register(swagger, {
    swagger: {
      info: {
        title: 'Global Regeneration Ceremony API',
        description: 'API for bioregional ritual submission and validation',
        version: '1.0.0',
      },
      host: process.env['API_HOST'] || 'localhost:3001',
      schemes: ['http', 'https'],
      consumes: ['application/json'],
      produces: ['application/json'],
    },
  });

  await fastify.register(swaggerUi, {
    routePrefix: '/docs',
  });
}

// Register routes
async function registerRoutes() {
  await fastify.register(ritualRoutes, { prefix: '/api/v1/rituals' });
  await fastify.register(bioregionRoutes, { prefix: '/api/v1/bioregions' });
  await fastify.register(daoRoutes, { prefix: '/api/v1/dao' });
  await fastify.register(githubWebhookRoutes);
}

// Initialize services
async function initializeServices() {
  await validateRitualRoute(fastify); // 👈 This registers the route

  // Initialize database connection
  const dbService = new DatabaseService();
  await dbService.connect();
  fastify.decorate('db', dbService);

  // Initialize IPFS service
  const ipfsService = new IPFSService();
  fastify.decorate('ipfs', ipfsService);

  // Initialize blockchain service
  const blockchainService = new BlockchainService();
  fastify.decorate('blockchain', blockchainService);
}

// Health check endpoint
fastify.get('/health', async (request, reply) => {
  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  };
});

// Graceful shutdown
process.on('SIGINT', async () => {
  fastify.log.info('Shutting down gracefully...');
  await fastify.close();
  process.exit(0);
});

// Start server
async function start() {
  try {
    await registerPlugins();
    await registerRoutes();
    await initializeServices();

    const port = parseInt(process.env['PORT'] || '3006');
    const host = process.env['HOST'] || '0.0.0.0';

    await fastify.listen({ port, host });
    fastify.log.info(`Server listening on ${host}:${port}`);
    fastify.log.info(
      `API documentation available at http://${host}:${port}/docs`,
    );
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();
function validateRitualRoute(fastify: any) {
  // Register the validate-ritual endpoint
  fastify.post('/api/validate-ritual', async (request: any, reply: any) => {
    try {
      const { ritualId, participant, timestamp } = request.body as any;

      // Basic validation
      if (!ritualId || !participant || !timestamp) {
        return reply.status(400).send({
          error: 'Missing required fields: ritualId, participant, timestamp',
        });
      }

      // Validate Ethereum address format
      const addressRegex = /^0x[a-fA-F0-9]{40}$/;
      if (!addressRegex.test(participant)) {
        return reply.status(400).send({
          error: 'Invalid participant address format',
        });
      }

      // Validate timestamp (must be recent)
      const now = Date.now();
      const timeDiff = Math.abs(now - timestamp);
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours

      if (timeDiff > maxAge) {
        return reply.status(400).send({
          error: 'Timestamp too old or in the future',
        });
      }

      return {
        valid: true,
        ritualId,
        participant,
        timestamp,
        validatedAt: new Date().toISOString(),
      };
    } catch (error) {
      fastify.log.error('Validation error:', error);
      return reply.status(500).send({
        error: 'Internal validation error',
      });
    }
  });
}
