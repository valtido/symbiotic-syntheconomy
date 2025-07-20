// scripts/fileWatcher.js
import { watch } from 'fs';
import { exec } from 'child_process';
import path from 'path';

const filePath = path.resolve('ai-sync-log.md');
console.log('🔍 Starting file watcher for ai-sync-log.md...');

let debounceTimer;

watch(filePath, { persistent: true }, (eventType) => {
  if (eventType !== 'change') return;

  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    console.log('📝 File change detected! Triggering patch...');
    runAgentPatch();
  }, 200);
});

function runAgentPatch() {
  console.log('⚙️  Running: npm run ai:next-patch');
  exec('npm run ai:next-patch', (error, stdout, stderr) => {
    if (error) {
      console.error(`❌ Patch generation failed:\n${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`⚠️ STDERR:\n${stderr}`);
    }
    console.log(`✅ Patch output:\n${stdout}`);

    // Check if any changes exist before trying to commit
    exec('git diff --quiet', (diffErr) => {
      if (diffErr) {
        // Changes exist
        exec(
          'git add . && git commit -m "🤖 Auto-applied patch from AI agent" && git push',
          (commitErr, commitOut, commitStderr) => {
            if (commitErr) {
              console.error(`❌ Git commit failed:\n${commitErr.message}`);
            } else {
              console.log(`🚀 Patch committed and pushed.\n${commitOut}`);
            }
          },
        );
      } else {
        console.log('ℹ️ No changes detected. Nothing to commit.');
      }
    });
  });
}
