// scripts/autoApplyAIContribution.ts
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

interface AIContribution {
  type: 'code' | 'command' | 'test';
  filePath?: string;
  content?: string;
  commands?: string[];
  testCommand?: string;
}

class AutoAIContributionHandler {
  private logFile = path.join('log', 'ai-contributions.log');

  private log(message: string) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}\n`;
    fs.appendFileSync(this.logFile, logEntry);
    console.log(`🤖 ${message}`);
  }

  private ensureLogDirectory() {
    const logDir = path.dirname(this.logFile);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  parseChatGPTResponse(response: string): AIContribution[] {
    const contributions: AIContribution[] = [];

    // Parse code blocks
    const codeBlockRegex =
      /```(?:typescript|solidity|javascript|bash|json)?\s*\n([\s\S]*?)\n```/g;
    let match;

    while ((match = codeBlockRegex.exec(response)) !== null) {
      const content = match[1].trim();

      // Try to extract file path from comments
      const filePathMatch = content.match(/\/\/\s*(?:In\s+)?([^\s]+)/);
      const filePath = filePathMatch ? filePathMatch[1] : undefined;

      if (filePath) {
        contributions.push({
          type: 'code',
          filePath,
          content,
        });
      }
    }

    // Parse git commands
    const gitCommandsMatch = response.match(/```bash\s*\n([\s\S]*?)\n```/);
    if (gitCommandsMatch) {
      const commands = gitCommandsMatch[1]
        .split('\n')
        .filter((cmd) => cmd.trim().startsWith('git'))
        .map((cmd) => cmd.trim());

      if (commands.length > 0) {
        contributions.push({
          type: 'command',
          commands,
        });
      }
    }

    // Parse test commands
    const testCommandMatch = response.match(
      /Test Command[:\s]*\n```bash\s*\n([\s\S]*?)\n```/,
    );
    if (testCommandMatch) {
      contributions.push({
        type: 'test',
        testCommand: testCommandMatch[1].trim(),
      });
    }

    return contributions;
  }

  async createFile(filePath: string, content: string): Promise<boolean> {
    try {
      // Ensure directory exists
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Write file
      fs.writeFileSync(filePath, content, 'utf-8');
      this.log(`📄 Created file: ${filePath}`);
      return true;
    } catch (error) {
      this.log(`❌ Failed to create file ${filePath}: ${error}`);
      return false;
    }
  }

  async executeCommands(commands: string[]): Promise<boolean> {
    try {
      for (const command of commands) {
        this.log(`🚀 Executing: ${command}`);
        execSync(command, { stdio: 'inherit' });
        this.log(`✅ Successfully executed: ${command}`);
      }
      return true;
    } catch (error) {
      this.log(`❌ Command execution failed: ${error}`);
      return false;
    }
  }

  async executeTestCommand(testCommand: string): Promise<boolean> {
    try {
      this.log(`🧪 Executing test: ${testCommand}`);
      execSync(testCommand, { stdio: 'inherit' });
      this.log(`✅ Test executed successfully`);
      return true;
    } catch (error) {
      this.log(`❌ Test execution failed: ${error}`);
      return false;
    }
  }

  async processAIContribution(chatGPTResponse: string): Promise<void> {
    this.ensureLogDirectory();
    this.log('🚀 Processing AI contribution...');

    const contributions = this.parseChatGPTResponse(chatGPTResponse);

    if (contributions.length === 0) {
      this.log('⚠️ No contributions found in response');
      return;
    }

    this.log(`📦 Found ${contributions.length} contribution(s)`);

    // Process code contributions first
    for (const contribution of contributions) {
      if (
        contribution.type === 'code' &&
        contribution.filePath &&
        contribution.content
      ) {
        await this.createFile(contribution.filePath, contribution.content);
      }
    }

    // Then process commands
    for (const contribution of contributions) {
      if (contribution.type === 'command' && contribution.commands) {
        await this.executeCommands(contribution.commands);
      }
    }

    // Finally process test commands
    for (const contribution of contributions) {
      if (contribution.type === 'test' && contribution.testCommand) {
        await this.executeTestCommand(contribution.testCommand);
      }
    }

    this.log('🎉 AI contribution processing complete!');
  }
}

// CLI interface
if (require.main === module) {
  const handler = new AutoAIContributionHandler();

  if (process.argv.length < 3) {
    console.log('Usage: npm run ai:apply <chatgpt-response-file>');
    console.log('Or: npm run ai:apply -- "response text here"');
    process.exit(1);
  }

  let response: string;

  if (process.argv[2] === '--') {
    // Response provided as command line argument
    response = process.argv.slice(3).join(' ');
  } else {
    // Response provided as file path
    const filePath = process.argv[2];
    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      process.exit(1);
    }
    response = fs.readFileSync(filePath, 'utf-8');
  }

  handler.processAIContribution(response).catch(console.error);
}

export default AutoAIContributionHandler;
