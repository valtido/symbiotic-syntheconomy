// scripts/ritualCoordination.ts
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const execAsync = promisify(exec);

interface RitualTask {
  id: string;
  type: 'development' | 'execution' | 'validation' | 'coordination';
  agent: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  description: string;
  ipfsHash?: string;
  timestamp: number;
  dependencies?: string[];
}

interface AgentStatus {
  name: string;
  address: string;
  status: 'available' | 'busy' | 'offline';
  currentTask?: string;
  lastActivity: number;
  capabilities: string[];
}

class MultiAgentRitualCoordination {
  private tasks: Map<string, RitualTask> = new Map();
  private agents: Map<string, AgentStatus> = new Map();
  private coordinationLog: string[] = [];

  constructor() {
    this.initializeAgents();
  }

  private initializeAgents() {
    // Initialize AI agents with their capabilities
    this.agents.set('cursor', {
      name: 'Cursor AI',
      address: '0x1234567890123456789012345678901234567890',
      status: 'available',
      lastActivity: Date.now(),
      capabilities: ['development', 'validation', 'coordination'],
    });

    this.agents.set('grok', {
      name: 'Grok AI',
      address: '0x2345678901234567890123456789012345678901',
      status: 'available',
      lastActivity: Date.now(),
      capabilities: ['development', 'execution', 'validation'],
    });

    this.agents.set('chatgpt', {
      name: 'ChatGPT',
      address: '0x3456789012345678901234567890123456789012',
      status: 'available',
      lastActivity: Date.now(),
      capabilities: ['development', 'validation', 'coordination'],
    });
  }

  /**
   * Create a new ritual development task
   */
  async createRitualTask(
    ritualName: string,
    bioregion: string,
    culturalTradition: string,
    description: string,
  ): Promise<string> {
    const taskId = `ritual_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    const task: RitualTask = {
      id: taskId,
      type: 'development',
      agent: 'cursor', // Start with Cursor AI
      status: 'pending',
      description: `Develop ritual: ${ritualName} for ${bioregion} region`,
      timestamp: Date.now(),
      dependencies: [],
    };

    this.tasks.set(taskId, task);
    this.logCoordination(`Created ritual task: ${taskId} for ${ritualName}`);

    // Trigger webhook to notify agents
    await this.notifyAgents(taskId, 'new_task');

    return taskId;
  }

  /**
   * Assign task to available agent
   */
  async assignTask(taskId: string, agentName: string): Promise<boolean> {
    const task = this.tasks.get(taskId);
    const agent = this.agents.get(agentName);

    if (!task || !agent) {
      this.logCoordination(
        `Failed to assign task ${taskId}: Task or agent not found`,
      );
      return false;
    }

    if (agent.status !== 'available') {
      this.logCoordination(
        `Agent ${agentName} is not available for task ${taskId}`,
      );
      return false;
    }

    if (!agent.capabilities.includes(task.type)) {
      this.logCoordination(
        `Agent ${agentName} cannot handle task type: ${task.type}`,
      );
      return false;
    }

    task.agent = agentName;
    task.status = 'in_progress';
    agent.status = 'busy';
    agent.currentTask = taskId;
    agent.lastActivity = Date.now();

    this.logCoordination(`Assigned task ${taskId} to ${agentName}`);
    await this.notifyAgents(taskId, 'task_assigned');

    return true;
  }

  /**
   * Complete a task and trigger next steps
   */
  async completeTask(
    taskId: string,
    ipfsHash: string,
    result: string,
  ): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) {
      this.logCoordination(`Task ${taskId} not found for completion`);
      return;
    }

    task.status = 'completed';
    task.ipfsHash = ipfsHash;

    const agent = this.agents.get(task.agent);
    if (agent) {
      agent.status = 'available';
      agent.currentTask = undefined;
      agent.lastActivity = Date.now();
    }

    this.logCoordination(
      `Completed task ${taskId} by ${task.agent} with result: ${result}`,
    );

    // Create follow-up tasks based on completion
    await this.createFollowUpTasks(taskId, task.type);

    // Notify other agents
    await this.notifyAgents(taskId, 'task_completed');
  }

  /**
   * Create follow-up tasks based on completed task
   */
  private async createFollowUpTasks(
    completedTaskId: string,
    taskType: string,
  ): Promise<void> {
    const completedTask = this.tasks.get(completedTaskId);
    if (!completedTask) return;

    switch (taskType) {
      case 'development':
        // After development, create validation task
        const validationTaskId = await this.createTask(
          'validation',
          'chatgpt',
          `Validate ritual developed by ${completedTask.agent}`,
          [completedTaskId],
        );
        this.logCoordination(
          `Created validation task ${validationTaskId} after development`,
        );
        break;

      case 'validation':
        // After validation, create execution task
        const executionTaskId = await this.createTask(
          'execution',
          'grok',
          `Execute validated ritual`,
          [completedTaskId],
        );
        this.logCoordination(
          `Created execution task ${executionTaskId} after validation`,
        );
        break;

      case 'execution':
        // After execution, create coordination task
        const coordinationTaskId = await this.createTask(
          'coordination',
          'cursor',
          `Coordinate ritual results and documentation`,
          [completedTaskId],
        );
        this.logCoordination(
          `Created coordination task ${coordinationTaskId} after execution`,
        );
        break;
    }
  }

  /**
   * Create a new task
   */
  private async createTask(
    type: RitualTask['type'],
    agent: string,
    description: string,
    dependencies: string[] = [],
  ): Promise<string> {
    const taskId = `task_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    const task: RitualTask = {
      id: taskId,
      type,
      agent,
      status: 'pending',
      description,
      timestamp: Date.now(),
      dependencies,
    };

    this.tasks.set(taskId, task);
    return taskId;
  }

  /**
   * Notify agents about task updates
   */
  private async notifyAgents(taskId: string, event: string): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) return;

    const notification = {
      event,
      taskId,
      task: {
        id: task.id,
        type: task.type,
        agent: task.agent,
        status: task.status,
        description: task.description,
      },
      timestamp: Date.now(),
    };

    // Send webhook notification
    try {
      await execAsync(`curl -X POST http://localhost:3006/webhook/agent-notification \
        -H "Content-Type: application/json" \
        -d '${JSON.stringify(notification)}'`);
    } catch (error) {
      this.logCoordination(`Failed to send agent notification: ${error}`);
    }
  }

  /**
   * Get available agents for a task type
   */
  getAvailableAgents(taskType: string): AgentStatus[] {
    return Array.from(this.agents.values()).filter(
      (agent) =>
        agent.status === 'available' && agent.capabilities.includes(taskType),
    );
  }

  /**
   * Get task status
   */
  getTaskStatus(taskId: string): RitualTask | undefined {
    return this.tasks.get(taskId);
  }

  /**
   * Get all tasks for an agent
   */
  getAgentTasks(agentName: string): RitualTask[] {
    return Array.from(this.tasks.values()).filter(
      (task) => task.agent === agentName,
    );
  }

  /**
   * Log coordination activity
   */
  private logCoordination(message: string): void {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}`;
    this.coordinationLog.push(logEntry);
    console.log(logEntry);

    // Save to coordination log file
    const logDir = path.join(process.cwd(), 'log');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    fs.appendFileSync(
      path.join(logDir, 'ritual-coordination.log'),
      logEntry + '\n',
    );
  }

  /**
   * Generate coordination report
   */
  generateReport(): any {
    const report = {
      timestamp: new Date().toISOString(),
      agents: Array.from(this.agents.values()),
      tasks: Array.from(this.tasks.values()),
      statistics: {
        totalTasks: this.tasks.size,
        completedTasks: Array.from(this.tasks.values()).filter(
          (t) => t.status === 'completed',
        ).length,
        pendingTasks: Array.from(this.tasks.values()).filter(
          (t) => t.status === 'pending',
        ).length,
        activeAgents: Array.from(this.agents.values()).filter(
          (a) => a.status === 'available',
        ).length,
      },
      recentLogs: this.coordinationLog.slice(-10),
    };

    return report;
  }

  /**
   * Start ritual development process
   */
  async startRitualDevelopment(ritualData: {
    name: string;
    bioregion: string;
    culturalTradition: string;
    description: string;
  }): Promise<string> {
    this.logCoordination(`Starting ritual development for: ${ritualData.name}`);

    // Create initial development task
    const taskId = await this.createRitualTask(
      ritualData.name,
      ritualData.bioregion,
      ritualData.culturalTradition,
      ritualData.description,
    );

    // Assign to Cursor AI for development
    await this.assignTask(taskId, 'cursor');

    // Generate and save ritual metadata
    const ritualMetadata = {
      id: taskId,
      name: ritualData.name,
      bioregion: ritualData.bioregion,
      culturalTradition: ritualData.culturalTradition,
      description: ritualData.description,
      createdAt: new Date().toISOString(),
      status: 'in_development',
      agents: ['cursor', 'grok', 'chatgpt'],
      coordinationId: taskId,
    };

    // Save to rituals.json
    const ritualsFile = path.join(process.cwd(), 'rituals.json');
    let rituals: any[] = [];
    if (fs.existsSync(ritualsFile)) {
      const fileContent = fs.readFileSync(ritualsFile, 'utf8');
      if (fileContent.trim()) {
        rituals = JSON.parse(fileContent);
      }
    }
    rituals.push(ritualMetadata);
    fs.writeFileSync(ritualsFile, JSON.stringify(rituals, null, 2));

    this.logCoordination(`Ritual development started with task ID: ${taskId}`);
    return taskId;
  }
}

// Export for use in other modules
export { MultiAgentRitualCoordination, RitualTask, AgentStatus };

// Main execution if run directly
if (require.main === module) {
  const coordinator = new MultiAgentRitualCoordination();

  // Example: Start a ritual development
  coordinator
    .startRitualDevelopment({
      name: 'Salmon River Blessing Ceremony',
      bioregion: 'Pacific Northwest',
      culturalTradition: 'Coast Salish',
      description: 'A ceremony honoring the salmon and the cycle of life',
    })
    .then((taskId) => {
      console.log(`Ritual development started with task ID: ${taskId}`);

      // Generate initial report
      const report = coordinator.generateReport();
      console.log(
        'Initial coordination report:',
        JSON.stringify(report, null, 2),
      );
    })
    .catch((error) => {
      console.error('Error starting ritual development:', error);
    });
}
