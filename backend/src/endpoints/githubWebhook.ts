import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { exec } from 'child_process';
import { promisify } from 'util';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
// AI contribution handler will be imported differently

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

const processedCommitsFile = path.join(
  process.cwd(),
  'patches',
  'processed-commits.json',
);

function loadProcessedCommits(): Set<string> {
  try {
    if (fs.existsSync(processedCommitsFile)) {
      const data = fs.readFileSync(processedCommitsFile, 'utf-8');
      return new Set(JSON.parse(data));
    }
  } catch (error) {
    console.warn('Could not load processed commits file:', error);
  }
  return new Set();
}

function saveProcessedCommits(commits: Set<string>) {
  try {
    const patchesDir = path.dirname(processedCommitsFile);
    if (!fs.existsSync(patchesDir)) {
      fs.mkdirSync(patchesDir, { recursive: true });
    }
    fs.writeFileSync(processedCommitsFile, JSON.stringify(Array.from(commits)));
  } catch (error) {
    console.warn('Could not save processed commits file:', error);
  }
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
        if (process.env['GH_WEBHOOK_SECRET']) {
          const expectedSignature = `sha256=${crypto
            .createHmac('sha256', process.env['GH_WEBHOOK_SECRET'])
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

        // Deduplication: Check if commits have already been processed
        const processedCommits = loadProcessedCommits();
        const newCommits = aiAgentCommits.filter(
          (commit) => !processedCommits.has(commit.id),
        );

        if (newCommits.length === 0) {
          fastify.log.info('All AI agent commits have already been processed');
          return reply.send({ message: 'All commits already processed' });
        }

        // Mark commits as processed
        newCommits.forEach((commit) => processedCommits.add(commit.id));
        saveProcessedCommits(processedCommits);

        fastify.log.info(
          `Found ${newCommits.length} new AI agent commits (${
            aiAgentCommits.length - newCommits.length
          } already processed), triggering patch generation`,
        );

        // Trigger patch generation for new AI agent commits only
        await triggerAIPatchGeneration(fastify, newCommits);

        return reply.send({
          success: true,
          message: `Processed ${newCommits.length} new AI agent commits`,
          commits: newCommits.map((c) => ({
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
        fastify.log.error(
          'Error details:',
          error instanceof Error ? error.message : String(error),
        );
        fastify.log.error(
          'Error stack:',
          error instanceof Error ? error.stack : 'No stack trace',
        );
        return reply.status(500).send({ error: 'Internal server error' });
      }
    },
  );

  // Agent notification endpoint for ritual coordination
  fastify.post(
    '/webhook/agent-notification',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const notification = request.body as {
          event: string;
          taskId: string;
          task: {
            id: string;
            type: string;
            agent: string;
            status: string;
            description: string;
          };
          timestamp: number;
        };

        fastify.log.info(
          `Agent notification received: ${notification.event} for task ${notification.taskId}`,
        );

        // Process the notification based on event type
        switch (notification.event) {
          case 'new_task':
            fastify.log.info(
              `New ritual task created: ${notification.task.description}`,
            );
            break;
          case 'task_assigned':
            fastify.log.info(
              `Task ${notification.taskId} assigned to ${notification.task.agent}`,
            );
            break;
          case 'task_completed':
            fastify.log.info(
              `Task ${notification.taskId} completed by ${notification.task.agent}`,
            );
            // Trigger patch generation for completed tasks
            await triggerAIPatchGeneration(fastify, []);
            break;
          default:
            fastify.log.info(
              `Unknown notification event: ${notification.event}`,
            );
        }

        return reply.send({
          success: true,
          message: `Notification processed: ${notification.event}`,
          taskId: notification.taskId,
        });
      } catch (error) {
        fastify.log.error('Agent notification error:', error);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    },
  );

  // AI Contribution Webhook Endpoint
  fastify.post(
    '/webhook/ai-contribution',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const body = request.body as any;

        // Validate required fields
        if (!body.agent || !body.task) {
          return reply.status(400).send({
            error: 'Missing required fields: agent and task are required',
          });
        }

        fastify.log.info(`AI contribution webhook received from ${body.agent}`);

        // Process the AI contribution
        const result = await processAIContribution(body);

        return reply.send(result);
      } catch (error) {
        fastify.log.error('AI contribution webhook error:', error);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    },
  );
}

async function processAIContribution(
  contribution: any,
): Promise<{ success: boolean; message: string }> {
  try {
    // Create file if code provided
    if (contribution.code && contribution.filePath) {
      const dir = path.dirname(contribution.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(contribution.filePath, contribution.code, 'utf-8');
      console.log(`📄 Created file: ${contribution.filePath}`);
    }

    // Execute commands if provided
    if (contribution.commands && Array.isArray(contribution.commands)) {
      for (const command of contribution.commands) {
        console.log(`🚀 Executing: ${command}`);
        await execAsync(command);
        console.log(`✅ Successfully executed: ${command}`);
      }
    }

    // Execute test if provided
    if (contribution.testCommand) {
      console.log(`🧪 Executing test: ${contribution.testCommand}`);
      await execAsync(contribution.testCommand);
      console.log(`✅ Test executed successfully`);
    }

    return {
      success: true,
      message: `AI contribution from ${contribution.agent} processed successfully`,
    };
  } catch (error) {
    console.error(`❌ AI contribution processing failed: ${error}`);
    return {
      success: false,
      message: `Failed to process AI contribution: ${error}`,
    };
  }
}

async function triggerAIPatchGeneration(
  fastify: FastifyInstance,
  commits: any[],
) {
  try {
    fastify.log.info('Starting AI patch generation...');

    // Change to project root directory
    const projectRoot = process.cwd();
    fastify.log.info(`Working directory: ${projectRoot}`);

    // Pull latest changes
    fastify.log.info('Pulling latest changes...');
    const { stdout: pullOutput, stderr: pullError } = await execAsync(
      'git pull origin main',
      { cwd: projectRoot },
    );

    if (pullError) {
      fastify.log.warn('Git pull stderr:', pullError);
    }
    fastify.log.info('Git pull completed:', pullOutput);

    // Run the AI patch generation
    fastify.log.info('Running AI patch generation...');
    const { stdout, stderr } = await execAsync(
      'npx tsx scripts/generateNextPatch.ts',
      {
        cwd: projectRoot,
      },
    );

    if (stderr) {
      fastify.log.warn('AI patch generation stderr:', stderr);
    }

    fastify.log.info('AI patch generation completed:', stdout);

    // Check if any patches were generated
    const { stdout: patchStatus } = await execAsync('git status --porcelain', {
      cwd: projectRoot,
    });

    if (patchStatus.trim()) {
      fastify.log.info('Patches detected, committing and pushing...');

      // Commit and push patches
      await execAsync('git add .', { cwd: projectRoot });
      await execAsync(
        'git commit -m "🤖 Auto-patch: AI agent sync [webhook]"',
        { cwd: projectRoot },
      );
      await execAsync('git push origin main', { cwd: projectRoot });

      fastify.log.info('Patches committed and pushed successfully');
    } else {
      fastify.log.info('No patches generated');
    }
  } catch (error) {
    fastify.log.error('Error in AI patch generation:', error);
    // Don't throw error, just log it and continue
    fastify.log.error(
      'Error details:',
      error instanceof Error ? error.message : String(error),
    );
    fastify.log.error(
      'Error stack:',
      error instanceof Error ? error.stack : 'No stack trace',
    );
  }
}
