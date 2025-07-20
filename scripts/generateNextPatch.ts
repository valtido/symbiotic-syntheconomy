// scripts/generateNextPatch.ts
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const patchesDir = path.resolve('patches');
const files = fs.readdirSync(patchesDir).filter((f) => f.endsWith('.patch'));

if (files.length === 0) {
  console.log('✅ No patches to apply.');
  process.exit(0);
}

const patchToApply = files[files.length - 1]; // use latest
const patchPath = path.join(patchesDir, patchToApply);

console.log(`🧩 Applying patch: ${patchToApply}`);

try {
  execSync(`git apply "${patchPath}"`, { stdio: 'inherit' });
  console.log('✅ Patch applied.');

  // Optional: remove the patch after applying
  fs.unlinkSync(patchPath);
  console.log('🧹 Cleaned up patch file.');
} catch (e) {
  console.error('❌ Failed to apply patch:', e.message);
}
