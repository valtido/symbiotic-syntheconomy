// Community Events and Gatherings Platform for Ritual Celebrations

import { Database } from '../database';
import { v4 as uuidv4 } from 'uuid';

// Types for event data structure
export interface CommunityEvent {
  id: string;
  title: string;
  description: string;
  date: string; // ISO format: YYYY-MM-DDTHH:MM:SSZ
  location: string;
  organizer: string;
  participants: string[];
  ritualType: string;
  createdAt: string;
  updatedAt: string;
}

// Community Events Service Class
export class CommunityEventsService {
  private db: Database;
  private collectionName = 'communityEvents';

  constructor(database: Database) {
    this.db = database;
  }

  // Create a new community event
  async createEvent(eventData: Omit<CommunityEvent, 'id' | 'createdAt' | 'updatedAt' | 'participants'>): Promise<CommunityEvent> {
    const now = new Date().toISOString();
    const newEvent: CommunityEvent = {
      id: uuidv4(),
      ...eventData,
      participants: [],
      createdAt: now,
      updatedAt: now,
    };

    await this.db.insert(this.collectionName, newEvent);
    return newEvent;
  }

  // Get all upcoming events
  async getUpcomingEvents(): Promise<CommunityEvent[]> {
    const now = new Date().toISOString();
    return await this.db.find(this.collectionName, { date: { $gte: now } });
  }

  // Get event by ID
  async getEventById(id: string): Promise<CommunityEvent | null> {
    return await this.db.findOne(this.collectionName, { id });
  }

  // Update event details
  async updateEvent(id: string, updateData: Partial<CommunityEvent>): Promise<CommunityEvent | null> {
    const event = await this.getEventById(id);
    if (!event) return null;

    const updatedEvent = {
      ...event,
      ...updateData,
      updatedAt: new Date().toISOString(),
    };

    await this.db.update(this.collectionName, { id }, updatedEvent);
    return updatedEvent;
  }

  // Delete an event
  async deleteEvent(id: string): Promise<boolean> {
    const result = await this.db.delete(this.collectionName, { id });
    return result > 0;
  }

  // Register a participant for an event
  async registerParticipant(eventId: string, userId: string): Promise<CommunityEvent | null> {
    const event = await this.getEventById(eventId);
    if (!event) return null;

    if (!event.participants.includes(userId)) {
      event.participants.push(userId);
      event.updatedAt = new Date().toISOString();
      await this.db.update(this.collectionName, { id: eventId }, event);
    }

    return event;
  }

  // Remove a participant from an event
  async removeParticipant(eventId: string, userId: string): Promise<CommunityEvent | null> {
    const event = await this.getEventById(eventId);
    if (!event) return null;

    event.participants = event.participants.filter(participant => participant !== userId);
    event.updatedAt = new Date().toISOString();
    await this.db.update(this.collectionName, { id: eventId }, event);

    return event;
  }

  // Get events by ritual type
  async getEventsByRitualType(ritualType: string): Promise<CommunityEvent[]> {
    return await this.db.find(this.collectionName, { ritualType });
  }

  // Get events by organizer
  async getEventsByOrganizer(organizer: string): Promise<CommunityEvent[]> {
    return await this.db.find(this.collectionName, { organizer });
  }
}

export default CommunityEventsService;
