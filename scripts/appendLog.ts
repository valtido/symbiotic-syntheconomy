// scripts/appendLog.ts

import fs from 'fs';
import path from 'path';
import { Octokit } from '@octokit/rest';
import dotenv from 'dotenv';
dotenv.config();

const { GH_REPO, GH_BRANCH, GH_FILE_PATH, GH_PAT } = process.env;

if (!GH_PAT) throw new Error('Missing GH_PAT');
if (!GH_REPO || !GH_BRANCH || !GH_FILE_PATH)
  throw new Error('Missing GitHub config');

const octokit = new Octokit({ auth: GH_PAT });

const [owner, repo] = GH_REPO.split('/');
const filePath = GH_FILE_PATH;

async function appendLogEntry(entry: string) {
  const { data: fileData } = await octokit.repos.getContent({
    owner,
    repo,
    path: filePath,
    ref: GH_BRANCH,
  });

  const sha = (fileData as any).sha;
  const content = Buffer.from((fileData as any).content, 'base64').toString(
    'utf-8',
  );

  const newContent = `${content}\n\n---\n\n${entry.trim()}`;

  await octokit.repos.createOrUpdateFileContents({
    owner,
    repo,
    path: filePath,
    message: `🤖 Append AI log entry [${new Date().toISOString()}]`,
    content: Buffer.from(newContent).toString('base64'),
    sha,
    branch: GH_BRANCH,
  });

  console.log('✅ Log entry appended successfully.');
}

const exampleEntry = `
### ${new Date().toLocaleString()} - Cursor AI Deployment Log

- ✅ Contracts deployed: \`GRC_RitualSubmission\` and \`SymbiosisPledge\`
- 🔍 Verified on BaseScan
- 🧠 AI agent coordination initiated
`;

appendLogEntry(exampleEntry);
