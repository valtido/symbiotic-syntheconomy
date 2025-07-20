import { watch } from 'fs';
import { exec } from 'child_process';
import path from 'path';
import { sendDiscordNotification } from './notifyDiscord';
import { cleanupOldPatches, updatePatchLog } from './cleanupPatches';

const watchFiles = ['ai-sync-log.md', 'rituals.json', 'tasks.md'];
const absolutePaths = watchFiles.map((f) => path.resolve(f));

console.log('🔍 File watcher active. Monitoring:');
absolutePaths.forEach((p) => console.log(`   • ${p}`));

let debounceTimer = null;
let lastTriggeredAt = 0;
const debounceMs = 300;

absolutePaths.forEach((filePath) => {
  watch(filePath, { persistent: true }, (eventType) => {
    if (eventType !== 'change') return;

    const now = Date.now();
    if (now - lastTriggeredAt < 1000) return; // Prevent rapid consecutive triggers

    if (debounceTimer) clearTimeout(debounceTimer);
    // @ts-ignore
    debounceTimer = setTimeout(() => {
      lastTriggeredAt = now;
      console.log(`📝 Change detected in ${path.basename(filePath)}!`);
      runAgentPatch();
    }, debounceMs);
  });
});

function runAgentPatch() {
  console.log('⚙️ Running: npm run ai:next-patch');

  exec('npm run ai:next-patch', (err, stdout, stderr) => {
    if (err) {
      console.error(`❌ Patch generation failed:\n${err.message}`);
      return;
    }
    if (stderr) console.error(`⚠️ STDERR:\n${stderr}`);
    if (stdout) console.log(`✅ Patch output:\n${stdout}`);

    checkForGitChanges();
  });
}

function checkForGitChanges() {
  exec('git diff --quiet', (diffErr) => {
    if (diffErr) {
      commitAndPush();
    } else {
      console.log('ℹ️ No changes to commit.');
    }
  });
}

async function commitAndPush() {
  exec(
    'git add . && git commit -m "🤖 Auto-applied patch from AI agent" && git push',
    async (err, stdout, stderr) => {
      if (err) {
        console.error(`❌ Git commit/push failed:\n${err.message}`);
        return;
      }
      if (stderr) console.error(`⚠️ Git STDERR:\n${stderr}`);
      console.log(`🚀 Patch committed and pushed:\n${stdout}`);

      // Clean up old patches after successful commit
      try {
        cleanupOldPatches();
        updatePatchLog();
        console.log('🧹 Patch cleanup completed');
      } catch (cleanupError) {
        console.error('⚠️ Patch cleanup failed:', cleanupError);
      }

      await sendDiscordNotification({
        agent: 'Cursor',
        task: 'Patch Generation',
        status: 'Success',
        emoji: '🤖',
        details: 'Patch saved and old patches cleaned up',
      });
    },
  );
}
