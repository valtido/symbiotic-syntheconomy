#!/usr/bin/env tsx

import { exec } from 'child_process';
import { promisify } from 'util';
import { watch } from 'fs';
import { join } from 'path';

const execAsync = promisify(exec);

class ActivityMonitor {
  private lastCommitCount = 0;
  private lastPatchCount = 0;

  async start() {
    console.log('📊 Starting Activity Monitor...');
    console.log('🔄 Monitoring AI agent commits and patch generation...\n');

    // Initial counts
    await this.updateCounts();

    // Monitor git commits
    setInterval(async () => {
      await this.checkGitActivity();
    }, 5000); // Check every 5 seconds

    // Monitor patch generation
    setInterval(async () => {
      await this.checkPatchActivity();
    }, 3000); // Check every 3 seconds

    // Monitor webhook status
    setInterval(async () => {
      await this.checkWebhookStatus();
    }, 10000); // Check every 10 seconds
  }

  private async updateCounts() {
    try {
      // Get commit count
      const { stdout: commitOutput } = await execAsync(
        'git rev-list --count HEAD',
      );
      this.lastCommitCount = parseInt(commitOutput.trim());

      // Get patch count
      const { stdout: patchOutput } = await execAsync(
        'ls patches/patch-*.md 2>/dev/null | wc -l',
      );
      this.lastPatchCount = parseInt(patchOutput.trim()) || 0;

      console.log(`📈 Current Status:`);
      console.log(`   Commits: ${this.lastCommitCount}`);
      console.log(`   Patches: ${this.lastPatchCount}`);
      console.log(`   Time: ${new Date().toLocaleTimeString()}\n`);
    } catch (error) {
      // Ignore errors for initial setup
    }
  }

  private async checkGitActivity() {
    try {
      const { stdout } = await execAsync('git rev-list --count HEAD');
      const currentCommitCount = parseInt(stdout.trim());

      if (currentCommitCount > this.lastCommitCount) {
        const newCommits = currentCommitCount - this.lastCommitCount;
        console.log(`🎉 New commits detected: +${newCommits}`);

        // Show recent commits
        const { stdout: recentCommits } = await execAsync(
          'git log --oneline -3',
        );
        console.log('📝 Recent commits:');
        console.log(recentCommits);

        this.lastCommitCount = currentCommitCount;
      }
    } catch (error) {
      // Ignore errors
    }
  }

  private async checkPatchActivity() {
    try {
      const { stdout } = await execAsync(
        'ls patches/patch-*.md 2>/dev/null | wc -l',
      );
      const currentPatchCount = parseInt(stdout.trim()) || 0;

      if (currentPatchCount > this.lastPatchCount) {
        const newPatches = currentPatchCount - this.lastPatchCount;
        console.log(`🤖 New patches generated: +${newPatches}`);

        // Show recent patches
        const { stdout: recentPatches } = await execAsync(
          'ls -t patches/patch-*.md | head -3',
        );
        console.log('📄 Recent patches:');
        console.log(recentPatches);

        this.lastPatchCount = currentPatchCount;
      }
    } catch (error) {
      // Ignore errors
    }
  }

  private async checkWebhookStatus() {
    try {
      const { stdout } = await execAsync(
        'curl -s https://symbiotic-syntheconomy.loca.lt/webhook/github -X POST -H "Content-Type: application/json" -d \'{"test":"status"}\'',
      );

      if (
        stdout.includes('Ignored non-main branch push') ||
        stdout.includes('No AI agent commits found')
      ) {
        console.log(`✅ Webhook is responding correctly`);
      } else {
        console.log(`⚠️  Webhook response: ${stdout.substring(0, 100)}...`);
      }
    } catch (error) {
      console.log(`❌ Webhook check failed: ${error.message}`);
    }
  }
}

// Start monitoring if run directly
if (require.main === module) {
  const monitor = new ActivityMonitor();
  monitor.start();
}

export default ActivityMonitor;
