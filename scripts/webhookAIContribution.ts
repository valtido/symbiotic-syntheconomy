// scripts/webhookAIContribution.ts
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

interface AIContribution {
  agent: string;
  task: string;
  code?: string;
  filePath?: string;
  commands?: string[];
  testCommand?: string;
}

class WebhookAIContributionHandler {
  private logFile = path.join('log', 'webhook-ai-contributions.log');

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

  async createFile(filePath: string, content: string): Promise<boolean> {
    try {
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
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

  async processWebhookContribution(
    contribution: AIContribution,
  ): Promise<void> {
    this.ensureLogDirectory();
    this.log(`🚀 Processing AI contribution from ${contribution.agent}`);
    this.log(`📋 Task: ${contribution.task}`);

    // Create file if code provided
    if (contribution.code && contribution.filePath) {
      await this.createFile(contribution.filePath, contribution.code);
    }

    // Execute commands if provided
    if (contribution.commands && contribution.commands.length > 0) {
      await this.executeCommands(contribution.commands);
    }

    // Execute test if provided
    if (contribution.testCommand) {
      try {
        this.log(`🧪 Executing test: ${contribution.testCommand}`);
        execSync(contribution.testCommand, { stdio: 'inherit' });
        this.log(`✅ Test executed successfully`);
      } catch (error) {
        this.log(`❌ Test execution failed: ${error}`);
      }
    }

    this.log(`🎉 AI contribution from ${contribution.agent} completed!`);
  }

  // Webhook endpoint handler
  async handleWebhookRequest(
    body: any,
  ): Promise<{ success: boolean; message: string }> {
    try {
      this.log(`📥 Received webhook request from ${body.agent || 'unknown'}`);

      const contribution: AIContribution = {
        agent: body.agent || 'unknown',
        task: body.task || 'unknown task',
        code: body.code,
        filePath: body.filePath,
        commands: body.commands,
        testCommand: body.testCommand,
      };

      await this.processWebhookContribution(contribution);

      return {
        success: true,
        message: `AI contribution from ${contribution.agent} processed successfully`,
      };
    } catch (error) {
      this.log(`❌ Webhook processing failed: ${error}`);
      return {
        success: false,
        message: `Failed to process AI contribution: ${error}`,
      };
    }
  }
}

export default WebhookAIContributionHandler;
