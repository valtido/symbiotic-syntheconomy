// scripts/testAiProviders.ts
import dotenv from 'dotenv';

dotenv.config();

interface AIProvider {
  name: string;
  apiKey: string;
  baseUrl: string;
  models: string[];
  checkQuota: (apiKey: string) => Promise<boolean>;
  sendRequest: (task: any, apiKey: string, model: string) => Promise<string>;
}

class AIProviderTester {
  private providers: AIProvider[] = [];

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
  }

  private log(message: string) {
    console.log(`🧪 ${message}`);
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
    task: any,
    apiKey: string,
    model: string,
  ): Promise<string> {
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
            role: 'user',
            content: task.task,
          },
        ],
        temperature: 0.7,
        max_tokens: 100,
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
    task: any,
    apiKey: string,
    model: string,
  ): Promise<string> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: model,
        max_tokens: 100,
        messages: [
          {
            role: 'user',
            content: task.task,
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
    task: any,
    apiKey: string,
    model: string,
  ): Promise<string> {
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
            role: 'user',
            content: task.task,
          },
        ],
        stream: false,
        temperature: 0.7,
        max_tokens: 100,
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

  async testProviders() {
    this.log(`🔍 Testing ${this.providers.length} AI providers...`);

    if (this.providers.length === 0) {
      this.log(`❌ No AI providers configured. Please set up API keys.`);
      return;
    }

    const testTask = {
      task: 'Say "Hello from AI provider test"',
    };

    // Test each provider
    for (const provider of this.providers) {
      this.log(`\n📋 Testing ${provider.name}...`);

      try {
        // Check quota
        this.log(`🔍 Checking ${provider.name} quota...`);
        const hasQuota = await provider.checkQuota(provider.apiKey);

        if (!hasQuota) {
          this.log(`⚠️ ${provider.name} quota exceeded or unavailable`);
          continue;
        }

        this.log(`✅ ${provider.name} quota check passed`);

        // Test each model
        for (const model of provider.models) {
          try {
            this.log(`🤖 Testing ${provider.name} (${model})...`);
            const response = await provider.sendRequest(
              testTask,
              provider.apiKey,
              model,
            );
            this.log(
              `✅ ${provider.name} (${model}) success: ${response.substring(
                0,
                50,
              )}...`,
            );
            break; // Success, move to next provider
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
                `⚠️ ${provider.name} quota/rate limit reached, skipping remaining models`,
              );
              break;
            }
          }
        }
      } catch (error) {
        this.log(`❌ ${provider.name} provider test failed: ${error}`);
      }
    }

    this.log(`\n🎉 Provider testing completed!`);
  }
}

// Run the test
async function main() {
  const tester = new AIProviderTester();
  await tester.testProviders();
}

main().catch(console.error);
