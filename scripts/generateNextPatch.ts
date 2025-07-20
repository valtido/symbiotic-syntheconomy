import fs from 'fs';
import { execSync } from 'child_process';

const PATCH_FILE = `patches/generated-${Date.now()}.patch`;

function run(cmd: string): string {
  return execSync(cmd, { stdio: 'pipe' }).toString().trim();
}

function ensureDirectoryExists(path: string) {
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path, { recursive: true });
  }
}

function generatePatch() {
  ensureDirectoryExists('patches');

  try {
    const diff = run('git diff');
    if (!diff) {
      console.log('✅ No changes to patch.');
      return;
    }

    run(`git diff > ${PATCH_FILE}`);
    console.log(`📦 Patch generated: ${PATCH_FILE}`);

    run(`git add .`);
    run(`git commit -m "🤖 Auto-patch: ${new Date().toISOString()}"`);
    run(`git push origin main`);
    console.log('🚀 Patch committed and pushed.');
  } catch (error) {
    console.error('❌ Error during patch generation or push:', error);
  }
}

generatePatch();
