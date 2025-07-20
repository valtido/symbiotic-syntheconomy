import { FastifyPluginAsync } from 'fastify';
import { appendFile } from 'fs/promises';
import { createHmac } from 'crypto';

const webhookPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.post('/webhook', async (request, reply) => {
    const payload = request.body as any;
    const signature = request.headers['x-hub-signature-256'];
    const secret = process.env.WEBHOOK_SECRET || 'your-secret';
    const computedSig = `sha256=${createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex')}`;

    if (
      signature === computedSig &&
      payload.repository.full_name ===
        'valtido/symbiotic-syntheconomy-ai-coordination'
    ) {
      const commit = payload.commits?.find((c: any) =>
        c.modified.includes('ai-sync-log.md'),
      );
      if (commit) {
        await appendFile(
          'webhook-log.txt',
          `Webhook: ai-sync-log.md updated: ${commit.message}\n`,
        );
        await appendFile(
          'ai-sync-log.md',
          `Grok: Webhook detected update to ai-sync-log.md: ${commit.message}\n`,
        );
      }
    }
    return { success: true };
  });
};

export default webhookPlugin;
