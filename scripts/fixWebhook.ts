// scripts/fixWebhook.ts
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function fixWebhook() {
  console.log('🔧 Fixing Webhook Configuration...\n');

  try {
    // Check current tunnel status
    const { stdout: healthCheck } = await execAsync(
      'curl -s https://symbiotic-syntheconomy.loca.lt/health',
    );
    console.log('✅ Current tunnel status:', healthCheck);

    // Test webhook endpoint
    const { stdout: webhookTest } = await execAsync(
      'curl -s -X POST https://symbiotic-syntheconomy.loca.lt/webhook/github -H "Content-Type: application/json" -d \'{"test": "webhook_test"}\'',
    );
    console.log('✅ Webhook endpoint test:', webhookTest);

    console.log('\n🎯 **Webhook URL to Update in GitHub:**');
    console.log('https://symbiotic-syntheconomy.loca.lt/webhook/github');

    console.log('\n📋 **Steps to Fix:**');
    console.log(
      '1. Go to: https://github.com/valtido/symbiotic-syntheconomy/settings/hooks',
    );
    console.log('2. Find your webhook (should show red warning icons)');
    console.log('3. Click "Edit" on the webhook');
    console.log(
      '4. Update "Payload URL" to: https://symbiotic-syntheconomy.loca.lt/webhook/github',
    );
    console.log('5. Make sure "Content type" is set to: application/json');
    console.log('6. Select events: "Just the push event"');
    console.log('7. Click "Update webhook"');

    console.log('\n🔍 **To Verify Fix:**');
    console.log('- Make a test commit');
    console.log(
      '- Check GitHub webhook deliveries (should show green checkmarks)',
    );
    console.log('- Look for new patch files in patches/ folder');
  } catch (error) {
    console.error('❌ Error checking webhook:', error);
  }
}

fixWebhook().catch(console.error);
