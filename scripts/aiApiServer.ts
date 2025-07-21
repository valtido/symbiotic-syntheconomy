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
  sessionId?: string;
  isPreload?: boolean;
  taskId?: string;
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

interface AIProvider {
  name: string;
  apiKey: string;
  baseUrl: string;
  models: string[];
  checkQuota: (apiKey: string) => Promise<boolean>;
  sendRequest: (task: AITask, apiKey: string, model: string) => Promise<string>;
}

class AIApiServer {
  private logFile = path.join('log', 'ai-api.log');
  private providers: AIProvider[] = [];
  private currentProviderIndex = 0;

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders() {
    // ChatGPT Provider
    if (process.env.OPENAI_API_KEY) {
      this.providers.push({
        name: 'ChatGPT',
        apiKey: process.env.OPENAI_API_KEY,
        baseUrl: 'https://api.openai.com/v1',
        models: ['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'],
        checkQuota: this.checkOpenAIQuota.bind(this),
        sendRequest: this.sendOpenAIRequest.bind(this),
      });
    }

    // Claude Provider
    if (process.env.CLAUDE_API_KEY) {
      this.providers.push({
        name: 'Claude',
        apiKey: process.env.CLAUDE_API_KEY,
        baseUrl: 'https://api.anthropic.com/v1',
        models: [
          'claude-3-5-sonnet-20241022',
          'claude-3-opus-20240229',
          'claude-3-sonnet-20240229',
        ],
        checkQuota: this.checkClaudeQuota.bind(this),
        sendRequest: this.sendClaudeRequest.bind(this),
      });
    }

    // Grok Provider (if available)
    if (process.env.GROK_API_KEY) {
      this.providers.push({
        name: 'Grok',
        apiKey: process.env.GROK_API_KEY,
        baseUrl: 'https://api.x.ai/v1',
        models: ['grok-3-latest', 'grok-beta'],
        checkQuota: this.checkGrokQuota.bind(this),
        sendRequest: this.sendGrokRequest.bind(this),
      });
    }

    this.log(
      `🤖 Initialized ${this.providers.length} AI providers: ${this.providers
        .map((p) => p.name)
        .join(', ')}`,
    );
  }

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

  // Check OpenAI quota
  private async checkOpenAIQuota(apiKey: string): Promise<boolean> {
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });
      return response.ok;
    } catch (error) {
      this.log(`❌ OpenAI quota check failed: ${error}`);
      return false;
    }
  }

  // Check Claude quota
  private async checkClaudeQuota(apiKey: string): Promise<boolean> {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1,
          messages: [{ role: 'user', content: 'test' }],
        }),
      });

      // If we get a quota error, return false
      if (response.status === 429 || response.status === 402) {
        return false;
      }
      return true;
    } catch (error) {
      this.log(`❌ Claude quota check failed: ${error}`);
      return false;
    }
  }

  // Check Grok quota
  private async checkGrokQuota(apiKey: string): Promise<boolean> {
    try {
      // Test with a minimal request to check quota
      const response = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'grok-3-latest',
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 1,
          stream: false,
          temperature: 0,
        }),
      });

      // If we get a quota error, return false
      if (response.status === 429 || response.status === 402) {
        return false;
      }
      return response.ok;
    } catch (error) {
      this.log(`❌ Grok quota check failed: ${error}`);
      return false;
    }
  }

  // Send request to OpenAI
  private async sendOpenAIRequest(
    task: AITask,
    apiKey: string,
    model: string,
  ): Promise<string> {
    const prompt = this.buildPrompt(task);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
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
      const errorText = await response.text();
      throw new Error(
        `OpenAI API error: ${response.status} ${response.statusText} - ${errorText}`,
      );
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  // Send request to Claude
  private async sendClaudeRequest(
    task: AITask,
    apiKey: string,
    model: string,
  ): Promise<string> {
    const prompt = this.buildPrompt(task);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: model,
        max_tokens: 4000,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Claude API error: ${response.status} ${response.statusText} - ${errorText}`,
      );
    }

    const data = await response.json();
    return data.content[0].text;
  }

  // Send request to Grok
  private async sendGrokRequest(
    task: AITask,
    apiKey: string,
    model: string,
  ): Promise<string> {
    const prompt = this.buildPrompt(task);

    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
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
        stream: false,
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Grok API error: ${response.status} ${response.statusText} - ${errorText}`,
      );
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  // Build prompt for AI providers
  private buildPrompt(task: AITask): string {
    return `
TASK: ${task.task}

${task.requirements ? `REQUIREMENTS: ${task.requirements}` : ''}
${task.filePath ? `FILE PATH: ${task.filePath}` : ''}

Please provide your contribution in the following JSON format:

{
  "agent": "${task.agent || 'AI Assistant'}",
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

  // Parse AI response into contribution
  private parseAIResponse(
    response: string,
    providerName: string,
  ): AIContribution {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          ...parsed,
          agent: parsed.agent || providerName,
        } as AIContribution;
      }

      // If no JSON found, create a basic contribution
      return {
        agent: providerName,
        task: 'Generated from API',
        code: response,
        filePath: `${providerName.toLowerCase()}-response.txt`,
        commands: ['echo "Response generated successfully"'],
      };
    } catch (error) {
      this.log(`❌ Failed to parse ${providerName} response: ${error}`);
      // Fallback: create a file with the raw response
      return {
        agent: providerName,
        task: 'Generated from API (fallback)',
        code: response,
        filePath: `${providerName.toLowerCase()}-response.txt`,
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

  // Main method to handle AI task with automatic fallback
  async handleAITask(task: AITask): Promise<{
    success: boolean;
    message: string;
    response?: string;
    provider?: string;
  }> {
    this.ensureLogDirectory();
    this.log(`📥 Received AI task: ${task.task}`);

    if (this.providers.length === 0) {
      return {
        success: false,
        message:
          'No AI providers configured. Please set up API keys for at least one provider.',
      };
    }

    // Try each provider in order
    for (let attempt = 0; attempt < this.providers.length; attempt++) {
      const providerIndex =
        (this.currentProviderIndex + attempt) % this.providers.length;
      const provider = this.providers[providerIndex];

      this.log(
        `🔄 Trying provider: ${provider.name} (attempt ${attempt + 1}/${
          this.providers.length
        })`,
      );

      try {
        // Check quota first
        const hasQuota = await provider.checkQuota(provider.apiKey);
        if (!hasQuota) {
          this.log(
            `⚠️ ${provider.name} quota exceeded, trying next provider...`,
          );
          continue;
        }

        // Try each model for this provider
        for (const model of provider.models) {
          try {
            this.log(`🤖 Sending task to ${provider.name} (${model})...`);
            const response = await provider.sendRequest(
              task,
              provider.apiKey,
              model,
            );
            this.log(`📥 Received response from ${provider.name}`);

            // Parse the response
            const contribution = this.parseAIResponse(response, provider.name);

            // Process the contribution
            const result = await this.processContribution(contribution);

            // Update current provider index for next request
            this.currentProviderIndex = providerIndex;

            return {
              ...result,
              response: response,
              provider: provider.name,
            };
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : String(error);
            this.log(`❌ ${provider.name} (${model}) failed: ${errorMessage}`);

            // Check if it's a quota/rate limit error
            if (
              errorMessage.includes('429') ||
              errorMessage.includes('insufficient_quota') ||
              errorMessage.includes('quota')
            ) {
              this.log(
                `⚠️ ${provider.name} quota/rate limit reached, trying next model...`,
              );
              continue;
            }

            // For other errors, try next model
            this.log(
              `⚠️ ${provider.name} (${model}) error, trying next model...`,
            );
          }
        }

        this.log(
          `⚠️ All models for ${provider.name} failed, trying next provider...`,
        );
      } catch (error) {
        this.log(`❌ ${provider.name} provider check failed: ${error}`);
        continue;
      }
    }

    // All providers failed
    this.log(`❌ All AI providers failed to process task`);
    return {
      success: false,
      message:
        'All AI providers failed to process the task. Please check API keys and quota limits.',
    };
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
  const providers = aiApiServer['providers'].map((p) => ({
    name: p.name,
    hasApiKey: !!p.apiKey,
    models: p.models,
  }));

  res.json({
    status: 'healthy',
    service: 'AI API Server (Dynamic Multi-Provider)',
    timestamp: new Date().toISOString(),
    providers: providers,
    totalProviders: providers.length,
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
