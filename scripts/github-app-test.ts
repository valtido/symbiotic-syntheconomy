// scripts/github-app-test.ts
import { Octokit } from '@octokit/rest';
import { createAppAuth } from '@octokit/auth-app';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  const appId = process.env.GH_APP_ID!;
  const privateKey = process.env.GH_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const installationId = process.env.GH_INSTALLATION_ID!;
  if (!privateKey) {
    throw new Error('GH_PRIVATE_KEY is not set');
  }
  if (!installationId) {
    throw new Error('GH_INSTALLATION_ID is not set');
  }

  const auth = createAppAuth({ appId, privateKey, installationId });
  const installationAuthentication = await auth({ type: 'installation' });
  const octokit = new Octokit({ auth: installationAuthentication.token });

  const owner = process.env.REPO_OWNER!;
  const repo = process.env.REPO_NAME!;
  if (!owner || !repo) {
    throw new Error('REPO_OWNER or REPO_NAME is not set');
  }
  const path = '.github/test-github-app.txt';

  try {
    const { data: current } = await octokit.repos.getContent({
      owner,
      repo,
      path,
    });

    const content = Buffer.from(
      `${new Date().toISOString()} - GitHub App test\n` +
        Buffer.from((current as any).content, 'base64').toString('utf8'),
    ).toString('base64');

    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message: `🤖 GitHub App test commit at ${new Date().toISOString()}`,
      content,
      sha: (current as any).sha,
    });

    console.log('✅ GitHub App commit pushed successfully.');
  } catch (e: any) {
    if (e.status === 404) {
      await octokit.repos.createOrUpdateFileContents({
        owner,
        repo,
        path,
        message: `🚀 First GitHub App test commit at ${new Date().toISOString()}`,
        content: Buffer.from(
          `${new Date().toISOString()} - First GitHub App test\n`,
        ).toString('base64'),
      });
      console.log('✅ GitHub App test file created.');
    } else {
      console.error('❌ GitHub App push failed:', e);
    }
  }
}

main();
