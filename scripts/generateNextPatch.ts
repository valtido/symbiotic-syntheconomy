// scripts/generateNextPatch.ts
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const patchesDir = path.resolve('patches');
const patchPrefix = 'generated-';

function generatePatch() {
  const timestamp = Date.now();
  const patchFile = `patches/${patchPrefix}${timestamp}.patch`;

  try {
    execSync(`git diff > ${patchFile}`);
    const content = fs.readFileSync(patchFile, 'utf-8').trim();

    if (!content) {
      fs.unlinkSync(patchFile);
      console.log('✅ No changes to patch.');
      return null;
    }

    console.log(`📦 Patch generated: ${patchFile}`);
    return patchFile;
  } catch (e) {
    console.error('❌ Patch generation failed:', e.message);
    return null;
  }
}

function applyAndCommitPatch(patchFile: string) {
  try {
    execSync(`git apply "${patchFile}"`, { stdio: 'inherit' });
    console.log(`✅ Patch applied: ${patchFile}`);

    execSync(`git add .`);
    execSync(`git commit -m "🤖 Auto-applied patch from AI agent [AI]"`);
    execSync(`git push`);
    console.log('🚀 Patch committed and pushed to GitHub.');

    fs.unlinkSync(patchFile);
    console.log('🧹 Patch file cleaned up.');
  } catch (e) {
    console.error('❌ Failed to apply or commit patch:', e.message);
  }
}

// Main
const patchFile = generatePatch();
if (patchFile) {
  applyAndCommitPatch(patchFile);
}
