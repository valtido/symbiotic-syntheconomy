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
    console.log('📝 File changed detected!');
    runAgentPatch();
  }, 200);
});

function runAgentPatch() {
  console.log('⚙️  Generating patch via AI agent...');
  exec('npm run ai:next-patch', (error, stdout, stderr) => {
    if (error) {
      console.error(`❌ Patch generation failed: ${error.message}`);
      return;
    }
    if (stderr) console.error(`⚠️  STDERR: ${stderr}`);

    console.log(`✅ Patch applied:
${stdout}`);

    exec(
      'git add . && git commit -m "🤖 Auto-applied patch from AI agent" && git push',
      (err, out, errout) => {
        if (err) {
          console.error(`❌ Git commit failed: ${err.message}`);
        } else {
          console.log('🚀 Patch committed and pushed to GitHub.');
        }
      },
    );
  });
}
