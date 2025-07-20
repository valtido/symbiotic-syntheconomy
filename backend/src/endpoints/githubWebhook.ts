import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { exec } from 'child_process';
import { promisify } from 'util';
import crypto from 'crypto';

const execAsync = promisify(exec);

interface GitHubWebhookPayload {
  ref: string;
  before: string;
  after: string;
  repository: {
    name: string;
    full_name: string;
  };
  commits: Array<{
    id: string;
    message: string;
    author: {
      name: string;
      email: string;
    };
    added: string[];
    modified: string[];
    removed: string[];
  }>;
  sender: {
    login: string;
  };
}

export default async function githubWebhookRoutes(fastify: FastifyInstance) {
  // Webhook endpoint for GitHub push events
  fastify.post(
    '/webhook/github',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const payload = request.body as GitHubWebhookPayload;
        const signature = request.headers['x-hub-signature-256'] as string;

        // Verify webhook signature (optional but recommended)
        if (process.env.GITHUB_WEBHOOK_SECRET) {
          const expectedSignature = `sha256=${crypto
            .createHmac('sha256', process.env.GITHUB_WEBHOOK_SECRET)
            .update(JSON.stringify(payload))
            .digest('hex')}`;

          if (signature !== expectedSignature) {
            fastify.log.warn('Invalid webhook signature');
            return reply.status(401).send({ error: 'Invalid signature' });
          }
        }

        // Only process push events to main branch
        if (payload.ref !== 'refs/heads/main') {
          return reply.send({ message: 'Ignored non-main branch push' });
        }

        fastify.log.info(
          `GitHub webhook received: ${payload.commits.length} commits from ${payload.sender.login}`,
        );

        // Check if any commits are from AI agents
        const aiAgentCommits = payload.commits.filter((commit) => {
          const isAIAgent =
            commit.author.name.includes('Cursor') ||
            commit.author.name.includes('Grok') ||
            commit.author.name.includes('AI') ||
            commit.author.email.includes('cursor') ||
            commit.author.email.includes('grok') ||
            commit.message.includes('[AI]') ||
            commit.message.includes('🤖') ||
            commit.message.includes('AI Agent');

          return isAIAgent;
        });

        if (aiAgentCommits.length === 0) {
          fastify.log.info('No AI agent commits detected');
          return reply.send({ message: 'No AI agent commits found' });
        }

        fastify.log.info(
          `Found ${aiAgentCommits.length} AI agent commits, triggering patch generation`,
        );

        // Trigger patch generation for AI agent commits
        await triggerAIPatchGeneration(fastify, aiAgentCommits);

        return reply.send({
          success: true,
          message: `Processed ${aiAgentCommits.length} AI agent commits`,
          commits: aiAgentCommits.map((c) => ({
            id: c.id,
            message: c.message,
          })),
        });
      } catch (error) {
        fastify.log.error('GitHub webhook error:', error);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    },
  );

  // Manual trigger endpoint for testing
  fastify.post(
    '/webhook/trigger-sync',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { action } = request.body as { action: string };

        if (action === 'test') {
          fastify.log.info('Manual sync trigger received');
          await triggerAIPatchGeneration(fastify, []);
          return reply.send({
            success: true,
            message: 'Manual sync triggered',
          });
        }

        return reply.status(400).send({ error: 'Invalid action' });
      } catch (error) {
        fastify.log.error('Manual sync error:', error);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    },
  );
}

async function triggerAIPatchGeneration(
  fastify: FastifyInstance,
  commits: any[],
) {
  try {
    fastify.log.info('Starting AI patch generation...');

    // Pull latest changes
    await execAsync('git pull origin main');
    fastify.log.info('Git pull completed');

    // Run the AI patch generation
    const { stdout, stderr } = await execAsync('npm run ai:next-patch');

    if (stderr) {
      fastify.log.warn('AI patch generation stderr:', stderr);
    }

    fastify.log.info('AI patch generation completed:', stdout);

    // Check if any patches were generated
    const { stdout: patchStatus } = await execAsync('git status --porcelain');

    if (patchStatus.trim()) {
      fastify.log.info('Patches detected, committing and pushing...');

      // Commit and push patches
      await execAsync('git add .');
      await execAsync('git commit -m "🤖 Auto-patch: AI agent sync [webhook]"');
      await execAsync('git push origin main');

      fastify.log.info('Patches committed and pushed successfully');
    } else {
      fastify.log.info('No patches generated');
    }
  } catch (error) {
    fastify.log.error('Error in AI patch generation:', error);
    throw error;
  }
}
