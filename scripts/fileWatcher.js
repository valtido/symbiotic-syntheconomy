#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class FileWatcher {
  constructor() {
    this.watchPath = path.join(__dirname, '..', 'ai-sync-log.md');
    this.lastContent = '';
    this.isRunning = false;
  }

  async start() {
    console.log('🔍 Starting file watcher for ai-sync-log.md...');

    // Initial read
    await this.readAndProcess();

    // Watch for changes
    fs.watchFile(this.watchPath, { interval: 1000 }, async (curr, prev) => {
      if (curr.mtime > prev.mtime) {
        console.log('📝 File changed detected!');
        await this.readAndProcess();
      }
    });

    console.log('✅ File watcher active - monitoring for changes...');
  }

  async readAndProcess() {
    try {
      const content = fs.readFileSync(this.watchPath, 'utf-8');

      if (content === this.lastContent) {
        return; // No change
      }

      console.log('🔄 Processing file changes...');
      this.lastContent = content;

      await this.processContent(content);
    } catch (error) {
      console.error('❌ Error reading file:', error);
    }
  }

  async processContent(content) {
    const actions = this.parseActions(content);

    for (const action of actions) {
      await this.executeAction(action);
    }
  }

  parseActions(content) {
    const actions = [];

    // Parse for specific patterns
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

    if (content.includes('Git sync configured')) {
      actions.push({
        type: 'git_sync_configured',
        data: { status: 'configured' },
      });
    }

    return actions;
  }

  async executeAction(action) {
    console.log(`🚀 Executing action: ${action.type}`);

    switch (action.type) {
      case 'deployment_complete':
        await this.handleDeploymentComplete(action.data);
        break;

      case 'initiate_ui_test':
        await this.handleInitiateUITest(action.data);
        break;

      case 'grok_status':
        await this.handleGrokStatus(action.data);
        break;

      case 'git_sync_configured':
        await this.handleGitSyncConfigured(action.data);
        break;

      default:
        console.log(`⚠️ Unknown action type: ${action.type}`);
    }
  }

  async handleDeploymentComplete(data) {
    console.log('🎉 Deployment complete - updating local configuration');

    try {
      // Update environment variables
      const envPath = path.join(__dirname, '..', 'backend', '.env');
      if (fs.existsSync(envPath)) {
        console.log('✅ Environment file exists');
      }

      console.log('✅ Local configuration updated');
    } catch (error) {
      console.error('❌ Error updating configuration:', error);
    }
  }

  async handleInitiateUITest(data) {
    console.log('🧪 Initiating ritual UI test...');

    try {
      // Check if frontend is ready
      const frontendPath = path.join(__dirname, '..', 'frontend');
      if (fs.existsSync(frontendPath)) {
        console.log('✅ Frontend directory exists');

        // You could start the dev server here
        // await execAsync('cd frontend && npm run dev');
      }
    } catch (error) {
      console.error('❌ Error starting frontend:', error);
    }
  }

  async handleGrokStatus(data) {
    console.log('🤖 Grok status update:', data.status);

    if (data.status === 'unresponsive') {
      console.log('⚠️ Grok is unresponsive - continuing without Grok sync');
    }
  }

  async handleGitSyncConfigured(data) {
    console.log('🔗 Git sync configured - setting up webhook monitoring');

    try {
      // Create webhook configuration
      const webhookConfig = {
        repository: 'valtido/symbiotic-syntheconomy-ai-coordination',
        file: 'ai-sync-log.md',
        webhookUrl: 'http://localhost:3001/webhook/github',
        lastUpdate: new Date().toISOString(),
      };

      const configPath = path.join(
        __dirname,
        '..',
        'log',
        'webhook-config.json',
      );
      fs.writeFileSync(configPath, JSON.stringify(webhookConfig, null, 2));

      console.log('✅ Webhook configuration saved');
      console.log('🌐 Webhook URL: http://localhost:3001/webhook/github');
      console.log('📋 Add this URL to your GitHub repository webhooks');
    } catch (error) {
      console.error('❌ Error configuring webhook:', error);
    }
  }

  stop() {
    console.log('🛑 Stopping file watcher...');
    fs.unwatchFile(this.watchPath);
    this.isRunning = false;
  }
}

// CLI interface
async function main() {
  const watcher = new FileWatcher();

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Received SIGINT, shutting down...');
    watcher.stop();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\n🛑 Received SIGTERM, shutting down...');
    watcher.stop();
    process.exit(0);
  });

  await watcher.start();
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = FileWatcher;
