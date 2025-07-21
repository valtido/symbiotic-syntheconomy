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
  dateCreated: Date;
  lastUpdated: Date;
  mediaUrls: string[];
  oralHistories: OralHistory[];
}

interface OralHistory {
  id: string;
  narrator: string;
  content: string;
  recordedDate: Date;
  audioUrl?: string;
  transcription?: string;
}

interface CulturalMemory {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  dateAdded: Date;
}

// Storage configuration
const STORAGE_DIR = path.join(__dirname, '../../storage/legacy');
const RITUALS_FILE = path.join(STORAGE_DIR, 'rituals.json');
const MEMORIES_FILE = path.join(STORAGE_DIR, 'memories.json');

@injectable()
export class LegacyPreservationService {
  private rituals: Ritual[] = [];
  private memories: CulturalMemory[] = [];

  constructor() {
    this.initializeStorage();
  }

  private async initializeStorage(): Promise<void> {
    try {
      await fs.mkdir(STORAGE_DIR, { recursive: true });

      // Initialize rituals storage
      try {
        const ritualsData = await fs.readFile(RITUALS_FILE, 'utf-8');
        this.rituals = JSON.parse(ritualsData);
      } catch (error) {
        this.rituals = [];
        await this.saveRituals();
      }

      // Initialize memories storage
      try {
        const memoriesData = await fs.readFile(MEMORIES_FILE, 'utf-8');
        this.memories = JSON.parse(memoriesData);
      } catch (error) {
        this.memories = [];
        await this.saveMemories();
      }
    } catch (error) {
      console.error('Failed to initialize storage:', error);
      throw new Error('Storage initialization failed');
    }
  }

  private async saveRituals(): Promise<void> {
    await fs.writeFile(RITUALS_FILE, JSON.stringify(this.rituals, null, 2));
  }

  private async saveMemories(): Promise<void> {
    await fs.writeFile(MEMORIES_FILE, JSON.stringify(this.memories, null, 2));
  }

  // Ritual Documentation Methods
  async addRitual(ritualData: Omit<Ritual, 'id' | 'dateCreated' | 'lastUpdated' | 'oralHistories'>): Promise<Ritual> {
    const newRitual: Ritual = {
      ...ritualData,
      id: uuidv4(),
      dateCreated: new Date(),
      lastUpdated: new Date(),
      oralHistories: []
    };
    this.rituals.push(newRitual);
    await this.saveRituals();
    return newRitual;
  }

  async getRitualById(id: string): Promise<Ritual | undefined> {
    return this.rituals.find(r => r.id === id);
  }

  async updateRitual(id: string, updateData: Partial<Ritual>): Promise<Ritual | undefined> {
    const index = this.rituals.findIndex(r => r.id === id);
    if (index !== -1) {
      this.rituals[index] = { 
        ...this.rituals[index], 
        ...updateData, 
        lastUpdated: new Date() 
      };
      await this.saveRituals();
      return this.rituals[index];
    }
    return undefined;
  }

  // Oral History Recording Methods
  async addOralHistory(ritualId: string, historyData: Omit<OralHistory, 'id' | 'recordedDate'>): Promise<OralHistory | undefined> {
    const ritualIndex = this.rituals.findIndex(r => r.id === ritualId);
    if (ritualIndex !== -1) {
      const newHistory: OralHistory = {
        ...historyData,
        id: uuidv4(),
        recordedDate: new Date()
      };
      this.rituals[ritualIndex].oralHistories.push(newHistory);
      this.rituals[ritualIndex].lastUpdated = new Date();
      await this.saveRituals();
      return newHistory;
    }
    return undefined;
  }

  async getOralHistoriesByRitualId(ritualId: string): Promise<OralHistory[] | undefined> {
    const ritual = this.rituals.find(r => r.id === ritualId);
    return ritual?.oralHistories;
  }

  // Cultural Memory Bank Methods
  async addCulturalMemory(memoryData: Omit<CulturalMemory, 'id' | 'dateAdded'>): Promise<CulturalMemory> {
    const newMemory: CulturalMemory = {
      ...memoryData,
      id: uuidv4(),
      dateAdded: new Date()
    };
    this.memories.push(newMemory);
    await this.saveMemories();
    return newMemory;
  }

  async getMemoriesByCategory(category: string): Promise<CulturalMemory[]> {
    return this.memories.filter(m => m.category === category);
  }

  async searchMemoriesByTags(tags: string[]): Promise<CulturalMemory[]> {
    return this.memories.filter(m => tags.some(tag => m.tags.includes(tag)));
  }

  // Digital Preservation Methods
  async addMediaToRitual(ritualId: string, mediaUrl: string): Promise<Ritual | undefined> {
    const ritualIndex = this.rituals.findIndex(r => r.id === ritualId);
    if (ritualIndex !== -1) {
      this.rituals[ritualIndex].mediaUrls.push(mediaUrl);
      this.rituals[ritualIndex].lastUpdated = new Date();
      await this.saveRituals();
      return this.rituals[ritualIndex];
    }
    return undefined;
  }
}
