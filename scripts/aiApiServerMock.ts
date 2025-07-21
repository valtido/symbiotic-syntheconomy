// scripts/aiApiServerMock.ts
import express from 'express';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const app = express();
const PORT = 3009;

// Use more tolerant JSON parsing
app.use(
  express.json({
    strict: false,
    limit: '10mb',
  }),
);

interface AITask {
  task: string;
  filePath?: string;
  requirements?: string;
  agent?: string;
}

interface AIContribution {
  agent: string;
  task: string;
  code?: string;
  codeBase64?: string;
  filePath?: string;
  commands?: string[];
  testCommand?: string;
  testCommandBase64?: string;
}

class AIApiServerMock {
  private logFile = path.join('log', 'ai-api-mock.log');

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

  // Mock ChatGPT response based on task
  private generateMockResponse(task: AITask): string {
    const filePath = task.filePath || 'generated-file.ts';
    const fileName = path.basename(filePath, path.extname(filePath));

    // Generate appropriate code based on task
    let code = '';
    if (
      task.task.toLowerCase().includes('validation') ||
      task.task.toLowerCase().includes('validate')
    ) {
      code = `export interface RitualMetadata {
  name: string;
  description: string;
  participants: string[];
  timestamp: number;
}

export function validateRitualMetadata(metadata: any): boolean {
  if (!metadata.name || metadata.name.length < 3 || metadata.name.length > 50) {
    return false;
  }
  if (!metadata.description || metadata.description.length < 10 || metadata.description.length > 500) {
    return false;
  }
  if (!Array.isArray(metadata.participants) || metadata.participants.length === 0) {
    return false;
  }
  if (!metadata.timestamp || isNaN(metadata.timestamp)) {
    return false;
  }
  return true;
}

export function getValidationErrors(metadata: any): string[] {
  const errors = [];
  if (!metadata.name || metadata.name.length < 3 || metadata.name.length > 50) {
    errors.push("Name must be 3-50 characters");
  }
  if (!metadata.description || metadata.description.length < 10 || metadata.description.length > 500) {
    errors.push("Description must be 10-500 characters");
  }
  if (!Array.isArray(metadata.participants) || metadata.participants.length === 0) {
    errors.push("Participants must be a non-empty array");
  }
  if (!metadata.timestamp || isNaN(metadata.timestamp)) {
    errors.push("Timestamp must be a valid number");
  }
  return errors;
}`;
    } else {
      code = `// Generated code for: ${task.task}
export function ${fileName}() {
  console.log("Hello from ${fileName}!");
  return "Generated successfully";
}

export default ${fileName};`;
    }

    return JSON.stringify(
      {
        agent: task.agent || 'ChatGPT',
        task: task.task,
        filePath: filePath,
        code: code,
        commands: [
          `git add ${filePath}`,
          `git commit -m "🤖 Add ${task.task.toLowerCase()} [AI]"`,
          `git push origin main`,
        ],
        testCommand: `node -e "console.log('Test completed for ${task.task}')"`,
      },
      null,
      2,
    );
  }

  // Parse mock response into contribution
  private parseMockResponse(response: string): AIContribution {
    try {
      const parsed = JSON.parse(response);
      return parsed as AIContribution;
    } catch (error) {
      this.log(`❌ Failed to parse mock response: ${error}`);
      return {
        agent: 'ChatGPT',
        task: 'Generated from Mock API',
        code: response,
        filePath: 'mock-response.txt',
        commands: ['echo "Mock response saved"'],
      };
    }
  }

  // Process contribution
  private async processContribution(
    contribution: AIContribution,
  ): Promise<{ success: boolean; message: string }> {
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

  // Main method to handle AI task
  async handleAITask(
    task: AITask,
  ): Promise<{ success: boolean; message: string; response?: string }> {
    this.ensureLogDirectory();
    this.log(`📥 Received AI task: ${task.task}`);

    try {
      // Generate mock ChatGPT response
      this.log(`🤖 Generating mock ChatGPT response...`);
      const mockResponse = this.generateMockResponse(task);
      this.log(`📥 Generated mock response`);

      // Parse the response
      const contribution = this.parseMockResponse(mockResponse);

      // Process the contribution
      const result = await this.processContribution(contribution);

      return {
        ...result,
        response: mockResponse,
      };
    } catch (error) {
      this.log(`❌ AI task processing failed: ${error}`);
      return {
        success: false,
        message: `Failed to process AI task: ${error}`,
      };
    }
  }
}

const aiApiServerMock = new AIApiServerMock();

// AI Task API Endpoint
app.post('/ai-task', async (req, res) => {
  try {
    console.log('📥 Received AI task request (MOCK)');
    console.log('📋 Request body keys:', Object.keys(req.body));

    const task = req.body as AITask;

    // Validate required fields
    if (!task.task) {
      return res.status(400).json({
        error: 'Missing required field: task is required',
      });
    }

    const result = await aiApiServerMock.handleAITask(task);
    res.json(result);
  } catch (error) {
    console.error('AI task API error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'AI API Server (Mock)' });
});

app.listen(PORT, () => {
  console.log(`🤖 AI API Server (Mock) running on port ${PORT}`);
  console.log(`📡 API URL: http://localhost:${PORT}/ai-task`);
  console.log(
    `🌐 Public URL: https://symbiotic-syntheconomy.loca.lt:${PORT}/ai-task`,
  );
  console.log(`🔧 MOCK MODE: No OpenAI API key required`);
});

export default app;
