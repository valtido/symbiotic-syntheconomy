// Ritual Logger System for Symbiotic Syntheconomy

import * as fs from 'fs';
import * as path from 'path';

// Define interfaces for log data structure
interface RitualParticipant {
  id: string;
  name: string;
  role: string;
}

interface RitualOutcome {
  status: 'success' | 'failure' | 'partial';
  description: string;
  metrics?: Record<string, number | string>;
}

interface RitualMetadata {
  timestamp: string;
  location?: string;
  duration?: number; // in minutes
  context?: Record<string, any>;
}

interface RitualLogEntry {
  ritualId: string;
  ritualName: string;
  participants: RitualParticipant[];
  outcome: RitualOutcome;
  metadata: RitualMetadata;
}

class RitualLogger {
  private logs: RitualLogEntry[] = [];
  private logFilePath: string;

  constructor(logDir: string = './logs', logFileName: string = 'ritual_logs.json') {
    this.logFilePath = path.join(logDir, logFileName);
    this.ensureLogDirectory(logDir);
    this.loadLogs();
  }

  // Ensure log directory exists
  private ensureLogDirectory(dir: string): void {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  // Load existing logs from file
  private loadLogs(): void {
    try {
      if (fs.existsSync(this.logFilePath)) {
        const logData = fs.readFileSync(this.logFilePath, 'utf-8');
        this.logs = JSON.parse(logData);
      }
    } catch (error) {
      console.error('Error loading logs:', error);
      this.logs = [];
    }
  }

  // Save logs to file
  private saveLogs(): void {
    try {
      fs.writeFileSync(this.logFilePath, JSON.stringify(this.logs, null, 2), 'utf-8');
    } catch (error) {
      console.error('Error saving logs:', error);
    }
  }

  // Log a new ritual activity
  public logRitual(
    ritualId: string,
    ritualName: string,
    participants: RitualParticipant[],
    outcome: RitualOutcome,
    metadata: Partial<RitualMetadata> = {}
  ): void {
    const logEntry: RitualLogEntry = {
      ritualId,
      ritualName,
      participants,
      outcome,
      metadata: {
        timestamp: new Date().toISOString(),
        ...metadata,
      },
    };

    this.logs.push(logEntry);
    this.saveLogs();
    console.log(`Ritual logged: ${ritualName} (${ritualId})`);
  }

  // Query logs by ritual ID
  public getLogById(ritualId: string): RitualLogEntry | undefined {
    return this.logs.find(log => log.ritualId === ritualId);
  }

  // Query logs by ritual name (partial match)
  public getLogsByName(ritualName: string): RitualLogEntry[] {
    return this.logs.filter(log => log.ritualName.toLowerCase().includes(ritualName.toLowerCase()));
  }

  // Query logs by participant ID
  public getLogsByParticipant(participantId: string): RitualLogEntry[] {
    return this.logs.filter(log => 
      log.participants.some(participant => participant.id === participantId)
    );
  }

  // Query logs by outcome status
  public getLogsByOutcome(status: RitualOutcome['status']): RitualLogEntry[] {
    return this.logs.filter(log => log.outcome.status === status);
  }

  // Get all logs within a time range
  public getLogsByTimeRange(startDate: Date, endDate: Date): RitualLogEntry[] {
    const start = startDate.toISOString();
    const end = endDate.toISOString();
    return this.logs.filter(log => 
      log.metadata.timestamp >= start && log.metadata.timestamp <= end
    );
  }

  // Export logs to a file
  public exportLogs(exportPath: string): void {
    try {
      fs.writeFileSync(exportPath, JSON.stringify(this.logs, null, 2), 'utf-8');
      console.log(`Logs exported to: ${exportPath}`);
    } catch (error) {
      console.error('Error exporting logs:', error);
    }
  }

  // Get total number of logs
  public getLogCount(): number {
    return this.logs.length;
  }

  // Clear all logs (with confirmation)
  public clearLogs(confirm: boolean = false): void {
    if (!confirm) {
      console.warn('Clear logs requires confirmation. Pass confirm=true to clear.');
      return;
    }
    this.logs = [];
    this.saveLogs();
    console.log('All logs cleared.');
  }
}

// Example usage
if (require.main === module) {
  const logger = new RitualLogger();

  // Example ritual log
  logger.logRitual(
    'ritual_001',
    'Initiation Ceremony',
    [
      { id: 'p1', name: 'Alice', role: 'Leader' },
      { id: 'p2', name: 'Bob', role: 'Follower' },
    ],
    {
      status: 'success',
      description: 'Successful initiation',
      metrics: { energy: 100, participation: 'high' },
    },
    {
      location: 'Virtual Space #1',
      duration: 30,
      context: { platform: 'syntheconomy' },
    }
  );

  // Query examples
  console.log('Log by ID:', logger.getLogById('ritual_001'));
  console.log('Logs by Name:', logger.getLogsByName('Initiation'));
  console.log('Logs by Participant:', logger.getLogsByParticipant('p1'));
  console.log('Logs by Outcome:', logger.getLogsByOutcome('success'));
  console.log('Total Logs:', logger.getLogCount());

  // Export logs
  logger.exportLogs('./exported_ritual_logs.json');
}

export default RitualLogger;
