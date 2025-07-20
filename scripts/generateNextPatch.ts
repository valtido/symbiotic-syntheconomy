// scripts/generateNextPatch.ts
import { execSync } from 'child_process';
import { writeFileSync } from 'fs';

const timestamp = Date.now();
const outputPath = `patches/generated-${timestamp}.patch`;

try {
  const diff = execSync('git diff HEAD').toString().trim();

  if (!diff) {
    console.log('✅ No changes to patch.');
    process.exit(0);
  }

  writeFileSync(outputPath, diff);
  console.log(`📦 Patch generated: ${outputPath}`);
} catch (err) {
  console.error('❌ Failed to generate patch:', err);
  process.exit(1);
}
