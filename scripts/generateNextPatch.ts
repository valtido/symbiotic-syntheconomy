// scripts/generateNextPatch.ts
import fs from 'fs';
import path from 'path';

const PATCH_DIR = path.join(process.cwd(), 'patches');
const PATCH_NAME = `generated-${Date.now()}.patch`;
const PATCH_PATH = path.join(PATCH_DIR, PATCH_NAME);

function ensurePatchDir() {
  if (!fs.existsSync(PATCH_DIR)) {
    fs.mkdirSync(PATCH_DIR);
  }
}

function generatePatch() {
  ensurePatchDir();
  const cmd = `git diff HEAD > ${PATCH_PATH}`;
  require('child_process').exec(cmd, (err: any) => {
    if (err) {
      console.error('❌ Failed to generate patch:', err.message);
      process.exit(1);
    }
    const size = fs.statSync(PATCH_PATH).size;
    if (size === 0) {
      fs.unlinkSync(PATCH_PATH);
      console.log('✅ No changes to patch.');
    } else {
      console.log(`📦 Patch generated: ${PATCH_PATH}`);
    }
  });
}

generatePatch();
