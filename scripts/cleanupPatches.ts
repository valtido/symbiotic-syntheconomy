// scripts/cleanupPatches.ts
import fs from 'fs';
import path from 'path';

const patchesDir = path.resolve('patches');

interface PatchInfo {
  filename: string;
  commitId: string;
  timestamp: string;
  content: string;
}

function extractCommitId(filename: string): string | null {
  // Extract commit ID from filename like "patch-3e5e321e-2025-07-20T23-15-39-740Z.md"
  const match = filename.match(/patch-([a-f0-9]+)-/);
  return match ? match[1] : null;
}

function cleanupDuplicatePatches() {
  console.log('🧹 Cleaning up duplicate patches...');

  if (!fs.existsSync(patchesDir)) {
    console.log('✅ No patches directory found.');
    return;
  }

  const files = fs.readdirSync(patchesDir);
  const patchFiles = files.filter(
    (file) => file.endsWith('.md') && file.startsWith('patch-'),
  );

  console.log(`📁 Found ${patchFiles.length} patch files`);

  // Group patches by commit ID
  const patchesByCommit: Record<string, PatchInfo[]> = {};

  patchFiles.forEach((filename) => {
    const commitId = extractCommitId(filename);
    if (!commitId) {
      console.log(`⚠️  Could not extract commit ID from: ${filename}`);
      return;
    }

    const filePath = path.join(patchesDir, filename);
    const content = fs.readFileSync(filePath, 'utf-8');

    if (!patchesByCommit[commitId]) {
      patchesByCommit[commitId] = [];
    }

    patchesByCommit[commitId].push({
      filename,
      commitId,
      timestamp: filename.split('-').slice(-1)[0].replace('.md', ''),
      content,
    });
  });

  let totalRemoved = 0;

  // For each commit, keep only the latest patch
  Object.entries(patchesByCommit).forEach(([commitId, patches]) => {
    if (patches.length > 1) {
      console.log(`🔄 Found ${patches.length} patches for commit ${commitId}`);

      // Sort by timestamp (newest first)
      patches.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

      // Keep the first (newest) one, remove the rest
      const toRemove = patches.slice(1);

      toRemove.forEach((patch) => {
        const filePath = path.join(patchesDir, patch.filename);
        fs.unlinkSync(filePath);
        console.log(`🗑️  Removed duplicate: ${patch.filename}`);
        totalRemoved++;
      });
    }
  });

  console.log(
    `✅ Cleanup complete! Removed ${totalRemoved} duplicate patches.`,
  );

  // Count remaining patches
  const remainingFiles = fs
    .readdirSync(patchesDir)
    .filter((file) => file.endsWith('.md') && file.startsWith('patch-'));
  console.log(`📊 Remaining unique patches: ${remainingFiles.length}`);
}

// Run cleanup
cleanupDuplicatePatches();
