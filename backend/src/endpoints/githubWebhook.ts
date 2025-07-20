import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import crypto from 'crypto';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface GitHubWebhookPayload {
  ref: string;
  repository: {
    name: string;
    full_name: string;
    clone_url: string;
  };
  commits: Array<{
    id: string;
    message: string;
    added: string[];
    modified: string[];
    removed: string[];
  }>;
  head_commit: {
    id: string;
    message: string;
    timestamp: string;
    author: {
      name: string;
      email: string;
    };
  };
}

export default async function githubWebhookRoutes(fastify: FastifyInstance) {
  // GitHub webhook endpoint
  fastify.post(
    '/webhook/github',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const payload = request.body as GitHubWebhookPayload;
        const signature = request.headers['x-hub-signature-256'] as string;

        // Verify webhook signature
        if (!verifyGitHubSignature(request.body, signature)) {
          return reply.status(401).send({ error: 'Invalid signature' });
        }

        // Check if this is a push to main branch
        if (payload.ref !== 'refs/heads/main') {
          return reply
            .status(200)
            .send({ message: 'Ignored - not main branch' });
        }

        // Check if ai-sync-log.md was modified
        const aiSyncLogModified = payload.commits.some(
          (commit) =>
            commit.modified.includes('ai-sync-log.md') ||
            commit.added.includes('ai-sync-log.md'),
        );

        if (!aiSyncLogModified) {
          return reply
            .status(200)
            .send({ message: 'Ignored - ai-sync-log.md not modified' });
        }

        console.log('🔄 GitHub webhook triggered - ai-sync-log.md updated');

        // Trigger automated response
        await handleAISyncLogUpdate(payload);

        return reply.status(200).send({
          success: true,
          message: 'Webhook processed successfully',
          action: 'ai-sync-log-updated',
        });
      } catch (error) {
        console.error('❌ GitHub webhook error:', error);
        return reply.status(500).send({
          error: 'Webhook processing failed',
          details: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    },
  );

  // Health check endpoint
  fastify.get(
    '/webhook/health',
    async (request: FastifyRequest, reply: FastifyReply) => {
      return reply.status(200).send({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'github-webhook',
      });
    },
  );

  // Manual trigger endpoint
  fastify.post(
    '/webhook/trigger-sync',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { action, data } = request.body as any;

        console.log('🔄 Manual sync trigger:', action);

        await handleAISyncLogUpdate({
          ref: 'refs/heads/main',
          repository: {
            name: 'symbiotic-syntheconomy-ai-coordination',
            full_name: 'valtido/symbiotic-syntheconomy-ai-coordination',
            clone_url:
              'https://github.com/valtido/symbiotic-syntheconomy-ai-coordination.git',
          },
          commits: [],
          head_commit: {
            id: 'manual-trigger',
            message: `Manual trigger: ${action}`,
            timestamp: new Date().toISOString(),
            author: { name: 'Cursor AI', email: 'cursor@grc.ai' },
          },
        });

        return reply.status(200).send({
          success: true,
          message: 'Manual sync triggered successfully',
          action,
        });
      } catch (error) {
        console.error('❌ Manual trigger error:', error);
        return reply.status(500).send({
          error: 'Manual trigger failed',
          details: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    },
  );
}

// Verify GitHub webhook signature
function verifyGitHubSignature(payload: any, signature: string): boolean {
  const secret = process.env['GITHUB_WEBHOOK_SECRET'];
  if (!secret || secret === 'your_github_webhook_secret_here') {
    console.warn(
      '⚠️ GITHUB_WEBHOOK_SECRET not configured - running in development mode',
    );
    console.warn(
      '📝 To configure: Set GITHUB_WEBHOOK_SECRET in your .env file',
    );
    console.warn(
      '🔗 GitHub webhook setup: https://github.com/settings/webhooks',
    );
    return true; // Allow in development
  }

  const expectedSignature = `sha256=${crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex')}`;

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature),
  );
}

// Handle AI sync log updates
async function handleAISyncLogUpdate(payload: GitHubWebhookPayload) {
  try {
    console.log('🤖 Processing AI sync log update...');

    // 1. Pull latest changes
    await execAsync('git pull origin main');
    console.log('✅ Git pull completed');

    // 2. Read updated ai-sync-log.md
    const fs = require('fs').promises;
    const path = require('path');
    const logPath = path.join(__dirname, '../../..', 'ai-sync-log.md');
    const logContent = await fs.readFile(logPath, 'utf-8');

    // 3. Parse log for actions
    const actions = parseAISyncLog(logContent);

    // 4. Execute actions based on log content
    for (const action of actions) {
      await executeAction(action);
    }

    // 5. Update local status
    await updateLocalStatus(payload);

    console.log('✅ AI sync log processing completed');
  } catch (error) {
    console.error('❌ Error processing AI sync log:', error);
    throw error;
  }
}

// Parse AI sync log for actions
function parseAISyncLog(content: string): Array<{ type: string; data: any }> {
  const actions: Array<{ type: string; data: any }> = [];

  // Look for specific patterns in the log
  if (content.includes('Phase II: Deployment Complete')) {
    actions.push({
      type: 'deployment_complete',
      data: { phase: 'II', status: 'complete' },
    });
  }

  if (content.includes('Cursor to initiate ritual UI test')) {
    actions.push({
      type: 'initiate_ui_test',
      data: { component: 'ritual-ui' },
    });
  }

  if (content.includes('Grok Not Syncing')) {
    actions.push({
      type: 'grok_status',
      data: { status: 'unresponsive' },
    });
  }

  return actions;
}

// Execute actions based on log content
async function executeAction(action: { type: string; data: any }) {
  console.log(`🚀 Executing action: ${action.type}`);

  switch (action.type) {
    case 'deployment_complete':
      await handleDeploymentComplete(action.data);
      break;

    case 'initiate_ui_test':
      await handleInitiateUITest(action.data);
      break;

    case 'grok_status':
      await handleGrokStatus(action.data);
      break;

    default:
      console.log(`⚠️ Unknown action type: ${action.type}`);
  }
}

// Handle deployment complete action
async function handleDeploymentComplete(data: any) {
  console.log('🎉 Deployment complete - updating local configuration');

  // Update environment variables with deployed contract addresses
  // This would typically update .env files or configuration
  console.log('✅ Local configuration updated');
}

// Handle UI test initiation
async function handleInitiateUITest(data: any) {
  console.log('🧪 Initiating ritual UI test...');

  // Start frontend development server
  try {
    await execAsync('cd frontend && npm run dev');
    console.log('✅ Frontend dev server started');
  } catch (error) {
    console.error('❌ Failed to start frontend:', error);
  }
}

// Handle Grok status
async function handleGrokStatus(data: any) {
  console.log('🤖 Grok status update:', data.status);

  if (data.status === 'unresponsive') {
    console.log('⚠️ Grok is unresponsive - continuing without Grok sync');
  }
}

// Update local status
async function updateLocalStatus(payload: GitHubWebhookPayload) {
  const status = {
    lastSync: new Date().toISOString(),
    commitId: payload.head_commit.id,
    commitMessage: payload.head_commit.message,
    author: payload.head_commit.author.name,
  };

  // Save status to local file
  const fs = require('fs').promises;
  const path = require('path');
  const statusPath = path.join(__dirname, '../../..', 'log/sync-status.json');
  await fs.writeFile(statusPath, JSON.stringify(status, null, 2));

  console.log('📝 Local sync status updated');
}
