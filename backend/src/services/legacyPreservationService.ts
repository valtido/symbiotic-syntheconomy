// Import necessary dependencies
import { injectable, inject } from 'tsyringe';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';

// Interfaces for data structures
interface Ritual {
  id: string;
  name: string;
  description: string;
  origin: string;
  dateRecorded: Date;
  metadata: Record<string, any>;
}

interface OralHistory {
  id: string;
  narrator: string;
  content: string;
  language: string;
  recordingDate: Date;
  audioFilePath?: string;
}

interface CulturalMemory {
  id: string;
  title: string;
  category: string;
  content: string;
  contributors: string[];
  timestamp: Date;
}

// Storage configuration
const STORAGE_DIR = path.join(__dirname, '../../storage/legacy');
const RITUALS_FILE = path.join(STORAGE_DIR, 'rituals.json');
const ORAL_HISTORY_FILE = path.join(STORAGE_DIR, 'oralHistory.json');
const MEMORY_BANK_FILE = path.join(STORAGE_DIR, 'memoryBank.json');

@injectable()
export class LegacyPreservationService {
  constructor() {
    this.initializeStorage();
  }

  private async initializeStorage(): Promise<void> {
    try {
      await fs.mkdir(STORAGE_DIR, { recursive: true });
      const files = [RITUALS_FILE, ORAL_HISTORY_FILE, MEMORY_BANK_FILE];
      for (const file of files) {
        try {
          await fs.access(file);
        } catch {
          await fs.writeFile(file, JSON.stringify([]));
        }
      }
    } catch (error) {
      console.error('Error initializing storage:', error);
      throw error;
    }
  }

  // Ritual Documentation Methods
  async documentRitual(ritualData: Omit<Ritual, 'id' | 'dateRecorded'>): Promise<Ritual> {
    const newRitual: Ritual = {
      ...ritualData,
      id: uuidv4(),
      dateRecorded: new Date(),
    };

    const rituals = await this.readData<Ritual[]>(RITUALS_FILE);
    rituals.push(newRitual);
    await this.writeData(RITUALS_FILE, rituals);
    return newRitual;
  }

  async getRituals(): Promise<Ritual[]> {
    return this.readData<Ritual[]>(RITUALS_FILE);
  }

  // Oral History Recording Methods
  async recordOralHistory(historyData: Omit<OralHistory, 'id' | 'recordingDate'>, audioBuffer?: Buffer): Promise<OralHistory> {
    const newHistory: OralHistory = {
      ...historyData,
      id: uuidv4(),
      recordingDate: new Date(),
    };

    if (audioBuffer) {
      const audioPath = path.join(STORAGE_DIR, `audio_${newHistory.id}.mp3`);
      await fs.writeFile(audioPath, audioBuffer);
      newHistory.audioFilePath = audioPath;
    }

    const histories = await this.readData<OralHistory[]>(ORAL_HISTORY_FILE);
    histories.push(newHistory);
    await this.writeData(ORAL_HISTORY_FILE, histories);
    return newHistory;
  }

  async getOralHistories(): Promise<OralHistory[]> {
    return this.readData<OralHistory[]>(ORAL_HISTORY_FILE);
  }

  // Cultural Memory Bank Methods
  async addToMemoryBank(memoryData: Omit<CulturalMemory, 'id' | 'timestamp'>): Promise<CulturalMemory> {
    const newMemory: CulturalMemory = {
      ...memoryData,
      id: uuidv4(),
      timestamp: new Date(),
    };

    const memories = await this.readData<CulturalMemory[]>(MEMORY_BANK_FILE);
    memories.push(newMemory);
    await this.writeData(MEMORY_BANK_FILE, memories);
    return newMemory;
  }

  async getMemoryBankEntries(category?: string): Promise<CulturalMemory[]> {
    const memories = await this.readData<CulturalMemory[]>(MEMORY_BANK_FILE);
    return category ? memories.filter(m => m.category === category) : memories;
  }

  // Helper methods for file operations
  private async readData<T>(filePath: string): Promise<T> {
    try {
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data) as T;
    } catch (error) {
      console.error(`Error reading data from ${filePath}:`, error);
      throw error;
    }
  }

  private async writeData<T>(filePath: string, data: T): Promise<void> {
    try {
      await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error(`Error writing data to ${filePath}:`, error);
      throw error;
    }
  }

  // Backup method for digital preservation
  async createBackup(): Promise<string> {
    const backupDir = path.join(STORAGE_DIR, 'backups');
    await fs.mkdir(backupDir, { recursive: true });
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `backup_${timestamp}.json`);

    const rituals = await this.getRituals();
    const histories = await this.getOralHistories();
    const memories = await this.getMemoryBankEntries();

    const backupData = {
      rituals,
      oralHistories: histories,
      culturalMemories: memories,
      timestamp: new Date(),
    };

    await this.writeData(backupPath, backupData);
    return backupPath;
  }
}
