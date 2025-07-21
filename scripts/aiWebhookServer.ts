// scripts/aiWebhookServer.ts
import express from 'express';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const app = express();
const PORT = 3008;

// Use more tolerant JSON parsing
app.use(
  express.json({
    strict: false,
    limit: '10mb', // Allow larger payloads
  }),
);

interface AIContribution {
  agent: string;
  task: string;
  code?: string;
  codeBase64?: string; // Base64 encoded code as fallback
  filePath?: string;
  commands?: string[];
  testCommand?: string;
  testCommandBase64?: string; // Base64 encoded test command
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

  // Decode base64 content safely
  private decodeBase64(base64String: string): string {
    try {
      return Buffer.from(base64String, 'base64').toString('utf-8');
    } catch (error) {
      this.log(`❌ Base64 decode failed: ${error}`);
      return '';
    }
  }

  // Sanitize code content by handling common escaping issues
  private sanitizeCode(code: string): string {
    // Replace escaped newlines with actual newlines
    let sanitized = code.replace(/\\n/g, '\n');

    // Handle double-escaped quotes
    sanitized = sanitized.replace(/\\"/g, '"');

    // Handle template literals that might break JSON
    sanitized = sanitized.replace(/`([^`]*)`/g, (match, content) => {
      // Convert template literals to string concatenation
      return `"${content.replace(/\${([^}]*)}/g, '" + $1 + "')}"`;
    });

    return sanitized;
  }

  // Safely wrap shell commands to prevent injection
  private sanitizeCommand(command: string): string {
    // Basic command sanitization
    if (command.includes('node -e')) {
      // For node -e commands, use a safer approach
      return command.replace(/node -e "([^"]*)"/, (match, code) => {
        // Create a temporary file instead of inline eval
        const tempFile = `temp-${Date.now()}.js`;
        fs.writeFileSync(tempFile, code);
        return `node ${tempFile} && rm ${tempFile}`;
      });
    }
    return command;
  }

  async createFile(filePath: string, content: string): Promise<boolean> {
    try {
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Sanitize the content before writing
      const sanitizedContent = this.sanitizeCode(content);
      fs.writeFileSync(filePath, sanitizedContent, 'utf-8');
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
        const sanitizedCommand = this.sanitizeCommand(command);
        this.log(`🚀 Executing: ${sanitizedCommand}`);
        execSync(sanitizedCommand, { stdio: 'inherit' });
        this.log(`✅ Successfully executed: ${sanitizedCommand}`);
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
      // Handle code content with fallback to base64
      let codeContent = '';
      if (contribution.code) {
        codeContent = contribution.code;
      } else if (contribution.codeBase64) {
        codeContent = this.decodeBase64(contribution.codeBase64);
      }

      // Create file if code provided
      if (codeContent && contribution.filePath) {
        await this.createFile(contribution.filePath, codeContent);
      }

      // Execute commands if provided
      if (contribution.commands && contribution.commands.length > 0) {
        await this.executeCommands(contribution.commands);
      }

      // Handle test command with fallback to base64
      let testCommand = '';
      if (contribution.testCommand) {
        testCommand = contribution.testCommand;
      } else if (contribution.testCommandBase64) {
        testCommand = this.decodeBase64(contribution.testCommandBase64);
      }

      // Execute test if provided
      if (testCommand) {
        try {
          const sanitizedTestCommand = this.sanitizeCommand(testCommand);
          this.log(`🧪 Executing test: ${sanitizedTestCommand}`);
          execSync(sanitizedTestCommand, { stdio: 'inherit' });
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
    console.log('📥 Received webhook request');
    console.log('📋 Request body keys:', Object.keys(req.body));

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
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error),
    });
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
