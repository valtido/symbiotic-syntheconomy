// scripts/aiWebhookServer.ts
import express from 'express';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const app = express();
const PORT = 3008;

app.use(express.json());

interface AIContribution {
  agent: string;
  task: string;
  code?: string;
  filePath?: string;
  commands?: string[];
  testCommand?: string;
}

class AIWebhookServer {
  private logFile = path.join('log', 'ai-webhook.log');

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

  async processContribution(
    contribution: AIContribution,
  ): Promise<{ success: boolean; message: string }> {
    this.ensureLogDirectory();
    this.log(`🚀 Processing AI contribution from ${contribution.agent}`);
    this.log(`📋 Task: ${contribution.task}`);

    try {
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
      return {
        success: true,
        message: `AI contribution from ${contribution.agent} processed successfully`,
      };
    } catch (error) {
      this.log(`❌ AI contribution processing failed: ${error}`);
      return {
        success: false,
        message: `Failed to process AI contribution: ${error}`,
      };
    }
  }
}

const aiServer = new AIWebhookServer();

// AI Contribution Webhook Endpoint
app.post('/ai-contribution', async (req, res) => {
  try {
    const contribution = req.body as AIContribution;

    // Validate required fields
    if (!contribution.agent || !contribution.task) {
      return res.status(400).json({
        error: 'Missing required fields: agent and task are required',
      });
    }

    console.log(`📥 Received AI contribution from ${contribution.agent}`);
    const result = await aiServer.processContribution(contribution);

    res.json(result);
  } catch (error) {
    console.error('AI contribution webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'AI Webhook Server' });
});

app.listen(PORT, () => {
  console.log(`🤖 AI Webhook Server running on port ${PORT}`);
  console.log(`📡 Webhook URL: http://localhost:${PORT}/ai-contribution`);
  console.log(
    `🌐 Public URL: https://symbiotic-syntheconomy.loca.lt:${PORT}/ai-contribution`,
  );
});

export default app;
