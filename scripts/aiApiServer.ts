// scripts/aiApiServer.ts
import express from 'express';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import dotenv from 'dotenv';

dotenv.config();

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

class AIApiServer {
  private logFile = path.join('log', 'ai-api.log');
  private openaiApiKey = process.env.OPENAI_API_KEY;

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

  // Send task to ChatGPT API
  private async sendToChatGPT(task: AITask): Promise<string> {
    if (!this.openaiApiKey) {
      throw new Error('OPENAI_API_KEY not found in environment variables');
    }

    const prompt = this.buildPrompt(task);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content:
              'You are an AI developer contributing to the Symbiotic Syntheconomy project. Generate code and commands based on the task requirements.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `OpenAI API error: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  // Build prompt for ChatGPT
  private buildPrompt(task: AITask): string {
    return `
TASK: ${task.task}

${task.requirements ? `REQUIREMENTS: ${task.requirements}` : ''}
${task.filePath ? `FILE PATH: ${task.filePath}` : ''}

Please provide your contribution in the following JSON format:

{
  "agent": "${task.agent || 'ChatGPT'}",
  "task": "${task.task}",
  "filePath": "${task.filePath || ''}",
  "code": "// Your code here",
  "commands": [
    "git add ${task.filePath || 'your-file.ts'}",
    "git commit -m \"🤖 Add ${task.task.toLowerCase()} [AI]\"",
    "git push origin main"
  ],
  "testCommand": "node -e \"console.log('Test completed')\""
}

IMPORTANT:
- Use base64 encoding for code if it contains special characters
- Keep commands simple and safe
- Provide working, testable code
- Use TypeScript for JavaScript files
`;
  }

  // Parse ChatGPT response into contribution
  private parseChatGPTResponse(response: string): AIContribution {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed as AIContribution;
      }

      // If no JSON found, create a basic contribution
      return {
        agent: 'ChatGPT',
        task: 'Generated from API',
        code: response,
        filePath: 'generated-response.txt',
        commands: ['echo "Response generated successfully"'],
      };
    } catch (error) {
      this.log(`❌ Failed to parse ChatGPT response: ${error}`);
      // Fallback: create a file with the raw response
      return {
        agent: 'ChatGPT',
        task: 'Generated from API (fallback)',
        code: response,
        filePath: 'chatgpt-response.txt',
        commands: ['echo "Raw response saved"'],
      };
    }
  }

  // Process contribution through webhook
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
      // Send task to ChatGPT
      this.log(`🤖 Sending task to ChatGPT API...`);
      const chatGPTResponse = await this.sendToChatGPT(task);
      this.log(`📥 Received response from ChatGPT`);

      // Parse the response
      const contribution = this.parseChatGPTResponse(chatGPTResponse);

      // Process the contribution
      const result = await this.processContribution(contribution);

      return {
        ...result,
        response: chatGPTResponse,
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

const aiApiServer = new AIApiServer();

// AI Task API Endpoint
app.post('/ai-task', async (req, res) => {
  try {
    console.log('📥 Received AI task request');
    console.log('📋 Request body keys:', Object.keys(req.body));

    const task = req.body as AITask;

    // Validate required fields
    if (!task.task) {
      return res.status(400).json({
        error: 'Missing required field: task is required',
      });
    }

    const result = await aiApiServer.handleAITask(task);
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
  res.json({
    status: 'healthy',
    service: 'AI API Server (Real)',
    timestamp: new Date().toISOString(),
    hasApiKey: !!process.env.OPENAI_API_KEY,
  });
});

app.listen(PORT, () => {
  console.log(`🤖 AI API Server running on port ${PORT}`);
  console.log(`📡 API URL: http://localhost:${PORT}/ai-task`);
  console.log(
    `🌐 Public URL: https://symbiotic-syntheconomy.loca.lt:${PORT}/ai-task`,
  );
});

export default app;
