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

class AIApiServerMock {
  private logFile = path.join('log', 'ai-api-mock.log');
  private preloadedSessions = new Set<string>();

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
    // Handle preload directive
    if (task.isPreload) {
      this.log(`Processing preload directive for session: ${task.sessionId}`);
      this.preloadedSessions.add(task.sessionId || 'default');
      return `# ChatGPT Directive Acknowledged

I have received and understood the directive for the Symbiotic Syntheconomy project. I am now ready to:

- Follow TypeScript coding standards
- Use Fastify for backend APIs with type-safe JSON schemas
- Generate Solidity contracts with OpenZeppelin standards for Base testnet
- Apply ESEP (max emotional skew 0.7) and CEDA (min 2 cultural references) to ritual content
- Store ritual metadata on IPFS and log hashes on Base testnet
- Validate AI output against schemas/prd.md
- Include Narrative Forensics to detect polarizing narratives
- Enforce ESLint/Prettier for code consistency

I am ready to receive and process tasks. Session ID: ${task.sessionId}

## Next Steps
Please send me the next task to work on.`;
    }

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
    } else if (
      task.task.toLowerCase().includes('scheduler') ||
      task.task.toLowerCase().includes('schedule')
    ) {
      code = `import { RitualMetadata } from './ritualValidationUtils';

export interface RitualSchedule {
  id: string;
  ritual: RitualMetadata;
  scheduledTime: number;
  participants: string[];
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
}

export class RitualScheduler {
  private schedules: RitualSchedule[] = [];

  scheduleRitual(ritual: RitualMetadata, scheduledTime: number, participants: string[]): string {
    const id = \`ritual_\${Date.now()}_\${Math.random().toString(36).substr(2, 9)}\`;
    const schedule: RitualSchedule = {
      id,
      ritual,
      scheduledTime,
      participants,
      status: 'scheduled'
    };
    this.schedules.push(schedule);
    return id;
  }

  getScheduledRituals(): RitualSchedule[] {
    return this.schedules.filter(s => s.status === 'scheduled');
  }

  startRitual(id: string): boolean {
    const schedule = this.schedules.find(s => s.id === id);
    if (schedule && schedule.status === 'scheduled') {
      schedule.status = 'in-progress';
      return true;
    }
    return false;
  }

  completeRitual(id: string): boolean {
    const schedule = this.schedules.find(s => s.id === id);
    if (schedule && schedule.status === 'in-progress') {
      schedule.status = 'completed';
      return true;
    }
    return false;
  }
}`;
    } else if (
      task.task.toLowerCase().includes('logging') ||
      task.task.toLowerCase().includes('log')
    ) {
      code = `import fs from 'fs';
import path from 'path';

export interface RitualLog {
  id: string;
  ritualName: string;
  timestamp: number;
  participants: string[];
  outcome: string;
  metadata: any;
}

export class RitualLogger {
  private logFile: string;

  constructor(logFile: string = 'rituals.log') {
    this.logFile = logFile;
  }

  logRitual(ritual: RitualLog): void {
    const logEntry = {
      ...ritual,
      loggedAt: new Date().toISOString()
    };

    const logLine = JSON.stringify(logEntry) + '\\n';
    fs.appendFileSync(this.logFile, logLine);
  }

  getRitualLogs(): RitualLog[] {
    if (!fs.existsSync(this.logFile)) {
      return [];
    }

    const content = fs.readFileSync(this.logFile, 'utf-8');
    return content
      .split('\\n')
      .filter(line => line.trim())
      .map(line => JSON.parse(line));
  }

  getRitualLogsByDate(startDate: Date, endDate: Date): RitualLog[] {
    const logs = this.getRitualLogs();
    return logs.filter(log => {
      const logDate = new Date(log.timestamp);
      return logDate >= startDate && logDate <= endDate;
    });
  }
}`;
    } else {
      // Default code generation
      code = `// Generated code for: ${task.task}
export function ${fileName}() {
  console.log('${task.task} implementation');
  return true;
}

export default ${fileName};`;
    }

    return `# Task: ${task.task}

I have implemented the requested functionality for: **${task.task}**

## Generated Code

\`\`\`typescript
${code}
\`\`\`

## File Path
\`${filePath}\`

## Test Command
\`\`\`bash
node -e "console.log('Test completed for ${task.task}')"
\`\`\`

## Git Commands
\`\`\`bash
git add ${filePath}
git commit -m "🤖 Add ${task.task.toLowerCase()} [AI]"
git push origin main
\`\`\`

The implementation follows the project's TypeScript standards and includes proper error handling and documentation.`;
  }

  // Parse mock response into contribution
  private parseMockResponse(response: string): AIContribution {
    try {
      // Try to parse as JSON first (for backward compatibility)
      const parsed = JSON.parse(response);
      return parsed as AIContribution;
    } catch (error) {
      // Parse markdown format
      this.log(`📝 Parsing markdown response format`);

      // Extract code block
      const codeMatch = response.match(/```typescript\n([\s\S]*?)\n```/);
      const code = codeMatch ? codeMatch[1] : '';

      // Extract file path
      const filePathMatch = response.match(/`([^`]+)`/);
      const filePath = filePathMatch ? filePathMatch[1] : 'generated-file.ts';

      // Extract git commands
      const gitCommands = [
        `git add ${filePath}`,
        `git commit -m "🤖 Add ${filePath
          .split('/')
          .pop()
          ?.replace('.ts', '')} [AI]"`,
        `git push origin main`,
      ];

      // Extract test command
      const testCommand = `node -e "console.log('Test completed for ${filePath}')"`;

      return {
        agent: 'ChatGPT',
        task: 'Generated from Mock API',
        code: code,
        filePath: filePath,
        commands: gitCommands,
        testCommand: testCommand,
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
  res.json({ status: 'healthy', service: 'AI API Server' });
});

app.listen(PORT, () => {
  console.log(`🤖 AI API Server running on port ${PORT}`);
  console.log(`📡 API URL: http://localhost:${PORT}/ai-task`);
  console.log(
    `🌐 Public URL: https://symbiotic-syntheconomy.loca.lt:${PORT}/ai-task`,
  );
  console.log(`🔧 MOCK MODE: No OpenAI API key required`);
});

export default app;
