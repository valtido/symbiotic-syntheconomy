// scripts/taskManager.ts
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

interface Task {
  id: string;
  task: string;
  filePath?: string;
  requirements?: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  createdAt: string;
  completedAt?: string;
}

interface TaskList {
  project: string;
  version: string;
  tasks: Task[];
  lastUpdated: string;
}

class TaskManager {
  private taskFile = 'tasks/task-list.json';
  private logFile = path.join('log', 'task-manager.log');

  private log(message: string) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}\n`;
    fs.appendFileSync(this.logFile, logEntry);
    console.log(`📋 ${message}`);
  }

  private ensureDirectories() {
    const taskDir = path.dirname(this.taskFile);
    const logDir = path.dirname(this.logFile);

    if (!fs.existsSync(taskDir)) {
      fs.mkdirSync(taskDir, { recursive: true });
    }
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  // Load existing task list or generate new one
  generateTaskList(): TaskList {
    // First try to load existing task list
    const existing = this.loadTaskList();
    if (existing) {
      this.log('📋 Loaded existing task list');
      return existing;
    }

    // If no existing task list, create a new one
    this.log('📋 Generating new task list for GRC platform development');
    const tasks: Task[] = [
      {
        id: 'task-001',
        task: 'Implement .grc file parser and validator',
        filePath: 'backend/src/utils/grcParser.ts',
        requirements:
          'Create TypeScript utility to parse and validate .grc files. Support UTF-8 encoding, max 10MB size, required fields (ritual name, bioregion ID, description, cultural context). Return structured data with validation errors.',
        priority: 'high',
        category: 'file-processing',
        status: 'pending',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'task-002',
        task: 'Create ESEP (Ethical-Spiritual Evaluation Protocol) filter',
        filePath: 'backend/src/ai/esepFilter.ts',
        requirements:
          'Implement ESEP algorithm that evaluates ethical-spiritual balance (0.0-1.0 scale, max 0.7 threshold). Analyze ethical keywords (justice, compassion, respect), spiritual keywords (sacred, divine, harmony), and balance assessment. Return score and detailed feedback.',
        priority: 'high',
        category: 'ai-validation',
        status: 'pending',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'task-003',
        task: 'Create CEDA (Cultural Expression Detection Algorithm) filter',
        filePath: 'backend/src/ai/cedaFilter.ts',
        requirements:
          'Implement CEDA algorithm to detect cultural references and expressions. Count cultural keywords, traditional practices, indigenous terms, and cultural context. Minimum 2 cultural references required for approval. Return count and identified references.',
        priority: 'high',
        category: 'ai-validation',
        status: 'pending',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'task-004',
        task: 'Set up IPFS integration for ritual metadata storage',
        filePath: 'backend/src/services/ipfsService.ts',
        requirements:
          'Create IPFS service to store ritual metadata. Functions: uploadMetadata(metadata), getMetadata(hash), validateHash(hash). Use IPFS HTTP API, handle errors, return IPFS hashes for blockchain logging.',
        priority: 'high',
        category: 'storage',
        status: 'pending',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'task-005',
        task: 'Deploy GRC_RitualSubmission smart contract to Base testnet',
        filePath: 'contracts/GRC_RitualSubmission.sol',
        requirements:
          'Create Solidity contract for ritual submission logging on Base testnet. Include: submitRitual(bioregionId, ipfsHash, esepScore, cedaScore), getRitual(ritualId), validateRitual(ritualId, isApproved). Deploy and verify on Base testnet.',
        priority: 'high',
        category: 'blockchain',
        status: 'pending',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'task-006',
        task: 'Deploy SymbiosisPledge smart contract to Base testnet',
        filePath: 'contracts/SymbiosisPledge.sol',
        requirements:
          'Create Solidity contract for bioregional pledges on Base testnet. Include: createPledge(bioregionId, pledgeType, description, amount), fulfillPledge(pledgeId, proofHash), verifyPledge(pledgeId, isVerified). Support 10 pledge types.',
        priority: 'high',
        category: 'blockchain',
        status: 'pending',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'task-007',
        task: 'Create ritual submission API endpoint',
        filePath: 'backend/src/routes/rituals.ts',
        requirements:
          'Implement POST /api/v1/rituals/submit endpoint. Handle multipart/form-data with .grc file, validate inputs, process through AI filters, store on IPFS, log to blockchain. Return ritualId, ipfsHash, transactionHash, and validation results.',
        priority: 'high',
        category: 'api',
        status: 'pending',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'task-008',
        task: 'Create bioregion management system',
        filePath: 'backend/src/services/bioregionService.ts',
        requirements:
          'Create bioregion service with functions: registerBioregion(id, name, description), getBioregion(id), listBioregions(), getBioregionRituals(id). Support 3 initial bioregions for simulation.',
        priority: 'high',
        category: 'data-management',
        status: 'pending',
        createdAt: new Date().toISOString(),
      },
    ];

    const taskList: TaskList = {
      project: 'Symbiotic Syntheconomy - Global Regeneration Ceremony (GRC)',
      version: '2.0.0',
      tasks: tasks,
      lastUpdated: new Date().toISOString(),
    };

    return taskList;
  }

  // Save task list to file
  saveTaskList(taskList: TaskList): void {
    this.ensureDirectories();
    fs.writeFileSync(this.taskFile, JSON.stringify(taskList, null, 2), 'utf-8');
    this.log(`💾 Saved task list with ${taskList.tasks.length} tasks`);
  }

  // Load task list from file
  loadTaskList(): TaskList | null {
    this.ensureDirectories();

    if (!fs.existsSync(this.taskFile)) {
      this.log(`📄 Task file not found, creating new task list`);
      const taskList = this.generateTaskList();
      this.saveTaskList(taskList);
      return taskList;
    }

    try {
      const content = fs.readFileSync(this.taskFile, 'utf-8');
      const taskList = JSON.parse(content) as TaskList;
      this.log(`📄 Loaded task list with ${taskList.tasks.length} tasks`);
      return taskList;
    } catch (error) {
      this.log(`❌ Failed to load task list: ${error}`);
      return null;
    }
  }

  // Get next pending task
  getNextTask(): Task | null {
    const taskList = this.loadTaskList();
    if (!taskList) return null;

    // Get highest priority pending task
    const pendingTasks = taskList.tasks.filter((t) => t.status === 'pending');
    if (pendingTasks.length === 0) return null;

    // Sort by priority (high -> medium -> low)
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    pendingTasks.sort(
      (a, b) => priorityOrder[b.priority] - priorityOrder[a.priority],
    );

    return pendingTasks[0];
  }

  // Mark task as completed
  markTaskCompleted(taskId: string): void {
    const taskList = this.loadTaskList();
    if (!taskList) return;

    const task = taskList.tasks.find((t) => t.id === taskId);
    if (task) {
      task.status = 'completed';
      task.completedAt = new Date().toISOString();
      taskList.lastUpdated = new Date().toISOString();
      this.saveTaskList(taskList);
      this.log(`✅ Marked task ${taskId} as completed`);
    }
  }

  // Mark task as failed
  markTaskFailed(taskId: string): void {
    const taskList = this.loadTaskList();
    if (!taskList) return;

    const task = taskList.tasks.find((t) => t.id === taskId);
    if (task) {
      task.status = 'failed';
      taskList.lastUpdated = new Date().toISOString();
      this.saveTaskList(taskList);
      this.log(`❌ Marked task ${taskId} as failed`);
    }
  }

  // Send task to API
  async sendTaskToAPI(task: Task): Promise<boolean> {
    try {
      this.log(`🚀 Sending task ${task.id} to API: ${task.task}`);

      const apiPayload = {
        task: task.task,
        filePath: task.filePath,
        requirements: task.requirements,
        agent: 'ChatGPT',
        taskId: task.id,
      };

      const response = await fetch('http://localhost:3009/ai-task', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiPayload),
      });

      if (!response.ok) {
        throw new Error(
          `API request failed: ${response.status} ${response.statusText}`,
        );
      }

      const result = await response.json();

      if (result.success) {
        this.log(`✅ Task ${task.id} completed successfully`);
        this.markTaskCompleted(task.id);
        return true;
      } else {
        this.log(`❌ Task ${task.id} failed: ${result.message}`);
        this.markTaskFailed(task.id);
        return false;
      }
    } catch (error) {
      this.log(`❌ Failed to send task ${task.id} to API: ${error}`);
      this.markTaskFailed(task.id);
      return false;
    }
  }

  // Process all pending tasks
  async processAllTasks(): Promise<void> {
    this.log(`🔄 Starting task processing...`);

    let processedCount = 0;
    let maxAttempts = 50; // Prevent infinite loops

    while (maxAttempts > 0) {
      const nextTask = this.getNextTask();

      if (!nextTask) {
        this.log(`🎉 All tasks completed! Processed ${processedCount} tasks`);
        break;
      }

      this.log(`📋 Processing task ${nextTask.id}: ${nextTask.task}`);

      const success = await this.sendTaskToAPI(nextTask);
      processedCount++;

      if (!success) {
        this.log(`⚠️ Task ${nextTask.id} failed, continuing with next task`);
      }

      // Small delay between tasks
      await new Promise((resolve) => setTimeout(resolve, 2000));
      maxAttempts--;
    }

    if (maxAttempts === 0) {
      this.log(`⚠️ Reached maximum attempts, stopping task processing`);
    }
  }

  // Get task statistics
  getTaskStats(): {
    total: number;
    pending: number;
    completed: number;
    failed: number;
  } {
    const taskList = this.loadTaskList();
    if (!taskList) return { total: 0, pending: 0, completed: 0, failed: 0 };

    const stats = {
      total: taskList.tasks.length,
      pending: taskList.tasks.filter((t) => t.status === 'pending').length,
      completed: taskList.tasks.filter((t) => t.status === 'completed').length,
      failed: taskList.tasks.filter((t) => t.status === 'failed').length,
    };

    return stats;
  }

  // Display task list
  displayTaskList(): void {
    const taskList = this.loadTaskList();
    if (!taskList) {
      console.log('❌ No task list available');
      return;
    }

    console.log(`\n📋 Task List for ${taskList.project} v${taskList.version}`);
    console.log(`Last updated: ${taskList.lastUpdated}\n`);

    const stats = this.getTaskStats();
    console.log(
      `📊 Statistics: ${stats.total} total, ${stats.pending} pending, ${stats.completed} completed, ${stats.failed} failed\n`,
    );

    taskList.tasks.forEach((task) => {
      const statusIcon = {
        'pending': '⏳',
        'in-progress': '🔄',
        'completed': '✅',
        'failed': '❌',
      }[task.status];

      const priorityIcon = {
        high: '🔴',
        medium: '🟡',
        low: '🟢',
      }[task.priority];

      console.log(`${statusIcon} ${priorityIcon} [${task.id}] ${task.task}`);
      console.log(`   Category: ${task.category} | Status: ${task.status}`);
      if (task.filePath) console.log(`   File: ${task.filePath}`);
      console.log('');
    });
  }
}

// CLI interface
async function main() {
  const taskManager = new TaskManager();
  const command = process.argv[2];

  switch (command) {
    case 'generate':
      console.log('🔄 Generating new task list...');
      const taskList = taskManager.generateTaskList();
      taskManager.saveTaskList(taskList);
      console.log('✅ Task list generated and saved');
      break;

    case 'process':
      console.log('🔄 Processing all pending tasks...');
      await taskManager.processAllTasks();
      break;

    case 'list':
      taskManager.displayTaskList();
      break;

    case 'stats':
      const stats = taskManager.getTaskStats();
      console.log('📊 Task Statistics:');
      console.log(`Total: ${stats.total}`);
      console.log(`Pending: ${stats.pending}`);
      console.log(`Completed: ${stats.completed}`);
      console.log(`Failed: ${stats.failed}`);
      break;

    case 'next':
      const nextTask = taskManager.getNextTask();
      if (nextTask) {
        console.log('📋 Next task:');
        console.log(`ID: ${nextTask.id}`);
        console.log(`Task: ${nextTask.task}`);
        console.log(`Priority: ${nextTask.priority}`);
        console.log(`Category: ${nextTask.category}`);
      } else {
        console.log('🎉 No pending tasks!');
      }
      break;

    default:
      console.log('📋 Task Manager Commands:');
      console.log('  generate  - Generate new task list');
      console.log('  process   - Process all pending tasks');
      console.log('  list      - Display current task list');
      console.log('  stats     - Show task statistics');
      console.log('  next      - Show next pending task');
      break;
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export default TaskManager;
