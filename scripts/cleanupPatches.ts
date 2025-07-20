import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const PATCHES_DIR = path.join(process.cwd(), 'patches');
const PATCH_LOG_FILE = path.join(PATCHES_DIR, 'patch-log.md');
const MAX_PATCHES_TO_KEEP = 3;

interface PatchInfo {
  filename: string;
  timestamp: number;
  size: number;
}

function getPatchFiles(): PatchInfo[] {
  if (!fs.existsSync(PATCHES_DIR)) {
    return [];
  }

  const files = fs
    .readdirSync(PATCHES_DIR)
    .filter((file) => file.endsWith('.patch'))
    .map((file) => {
      const filePath = path.join(PATCHES_DIR, file);
      const stats = fs.statSync(filePath);
      const timestamp = parseInt(
        file.replace('generated-', '').replace('.patch', ''),
      );

      return {
        filename: file,
        timestamp,
        size: stats.size,
      };
    })
    .sort((a, b) => b.timestamp - a.timestamp); // Sort by newest first

  return files;
}

function cleanupOldPatches(): void {
  const patches = getPatchFiles();

  if (patches.length <= MAX_PATCHES_TO_KEEP) {
    console.log(
      `✅ No cleanup needed. Keeping ${patches.length} patches (max: ${MAX_PATCHES_TO_KEEP})`,
    );
    return;
  }

  const patchesToDelete = patches.slice(MAX_PATCHES_TO_KEEP);
  const patchesToKeep = patches.slice(0, MAX_PATCHES_TO_KEEP);

  console.log(`🧹 Cleaning up ${patchesToDelete.length} old patches...`);

  patchesToDelete.forEach((patch) => {
    const filePath = path.join(PATCHES_DIR, patch.filename);
    try {
      fs.unlinkSync(filePath);
      console.log(`🗑️  Deleted: ${patch.filename}`);
    } catch (error) {
      console.error(`❌ Failed to delete ${patch.filename}:`, error);
    }
  });

  console.log(`✅ Kept ${patchesToKeep.length} recent patches:`);
  patchesToKeep.forEach((patch) => {
    console.log(`   📦 ${patch.filename} (${patch.size} bytes)`);
  });
}

function updatePatchLog(): void {
  const patches = getPatchFiles();
  const timestamp = new Date().toISOString().split('T')[0];

  if (!fs.existsSync(PATCH_LOG_FILE)) {
    console.log('📝 Creating new patch log file...');
  }

  const logContent = `# Patch Application Log

This file tracks all patches that have been applied to the repository.

## Format
\`[Timestamp] [Patch File] [Description] [Status]\`

## Applied Patches

${patches
  .map((patch) => {
    const date = new Date(patch.timestamp).toISOString().split('T')[0];
    const time = new Date(patch.timestamp)
      .toISOString()
      .split('T')[1]
      .split('.')[0];
    return `- \`[${date} ${time}] ${patch.filename}\` - Auto-generated patch (${patch.size} bytes) ✅ APPLIED`;
  })
  .join('\n')}

## Patch Management Policy

- **Keep Recent**: Only the last ${MAX_PATCHES_TO_KEEP} patch files are retained
- **Log All**: All applied patches are logged here
- **Cleanup**: Old patches are automatically deleted after application
- **Reference**: Use this log for historical patch tracking

## Current Status

- **Total Patches Applied**: ${patches.length}
- **Patches Retained**: ${Math.min(
    patches.length,
    MAX_PATCHES_TO_KEEP,
  )} (most recent)
- **Last Cleanup**: ${timestamp} ${
    new Date().toISOString().split('T')[1].split('.')[0]
  }
`;

  fs.writeFileSync(PATCH_LOG_FILE, logContent);
  console.log(`📝 Updated patch log with ${patches.length} patches`);
}

function main(): void {
  console.log('🧹 Starting patch cleanup process...');

  try {
    cleanupOldPatches();
    updatePatchLog();

    console.log('✅ Patch cleanup completed successfully!');
  } catch (error) {
    console.error('❌ Patch cleanup failed:', error);
    process.exit(1);
  }
}

// Run cleanup if called directly
if (require.main === module) {
  main();
}

export { cleanupOldPatches, updatePatchLog, getPatchFiles };
