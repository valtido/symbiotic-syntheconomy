// scripts/fileWatcher.ts
import { watch } from 'fs';
import { exec } from 'child_process';
import path from 'path';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
dotenv.config();

const watchedFiles = [
  path.resolve('ai-sync-log.md'),
  path.resolve('rituals.json'),
  path.resolve('tasks.md'),
];

console.log('🔍 File watcher active. Monitoring:');
watchedFiles.forEach((file) => console.log(`   • ${file}`));

let debounceTimer: NodeJS.Timeout;

watchedFiles.forEach((filePath) => {
  watch(filePath, { persistent: true }, (eventType) => {
    if (eventType !== 'change') return;

    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      console.log('📝 File change detected! Triggering patch...');
      runAgentPatch();
    }, 300);
  });
});

function runAgentPatch() {
  console.log('⚙️  Running: npm run ai:next-patch');
  exec('npm run ai:next-patch', async (error, stdout, stderr) => {
    if (error) {
      console.error(`❌ Patch generation failed:\n${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`⚠️ STDERR:\n${stderr}`);
    }

    console.log(`✅ Patch output:\n${stdout}`);

    // Check if any changes exist before committing
    exec('git diff --quiet', (diffErr) => {
      if (diffErr) {
        // Changes exist
        const agent = detectAgent(stdout) ?? 'ChatGPT';
        const commitMsg = `🤖 Auto-applied patch from ${agent} [AI]`;
        exec(
          `git add . && git commit -m "${commitMsg}" && git push`,
          async (commitErr, commitOut, commitStderr) => {
            if (commitErr) {
              console.error(`❌ Git commit failed:\n${commitErr.message}`);
            } else {
              console.log(`🚀 Patch committed and pushed:\n${commitOut}`);
              await sendDiscordNotification(
                `${agent} pushed a patch to GitHub 🚀`,
              );
            }
          },
        );
      } else {
        console.log('ℹ️ No changes detected. Nothing to commit.');
      }
    });
  });
}

function detectAgent(logOutput: string): string | null {
  if (logOutput.includes('Cursor')) return 'Cursor';
  if (logOutput.includes('Grok')) return 'Grok';
  if (logOutput.includes('ChatGPT')) return 'ChatGPT';
  return null;
}

async function sendDiscordNotification(message: string) {
  const url = process.env.DISCORD_WEBHOOK_URL;
  if (!url) {
    console.warn('⚠️ DISCORD_WEBHOOK_URL not defined.');
    return;
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: message }),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    console.log('📣 Discord notification sent successfully.');
  } catch (err) {
    console.error(`❌ Discord notification failed: ${err.message}`);
  }
}
