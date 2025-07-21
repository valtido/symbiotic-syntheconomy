// ritualSocialNetwork.ts - Advanced Social Networking for Ritual Communities

import { Database } from '../utils/database';
import { Logger } from '../utils/logger';
import { User, RitualCommunity, RitualEvent, ConnectionRequest } from '../models/types';

class RitualSocialNetwork {
  private db: Database;
  private logger: Logger;

  constructor() {
    this.db = Database.getInstance();
    this.logger = Logger.getInstance();
  }

  // Create a new ritual community
  async createCommunity(communityData: Omit<RitualCommunity, 'id' | 'createdAt' | 'members'>): Promise<RitualCommunity> {
    try {
      const newCommunity: RitualCommunity = {
        ...communityData,
        id: this.generateId(),
        createdAt: new Date().toISOString(),
        members: []
      };
      await this.db.insert('ritualCommunities', newCommunity);
      this.logger.info(`Created new community: ${newCommunity.name}`);
      return newCommunity;
    } catch (error) {
      this.logger.error(`Error creating community: ${error}`);
      throw new Error('Failed to create community');
    }
  }

  // Join a ritual community
  async joinCommunity(userId: string, communityId: string): Promise<boolean> {
    try {
      const community = await this.db.findOne<RitualCommunity>('ritualCommunities', { id: communityId });
      if (!community) throw new Error('Community not found');

      if (!community.members.includes(userId)) {
        community.members.push(userId);
        await this.db.update('ritualCommunities', { id: communityId }, community);
        this.logger.info(`User ${userId} joined community ${communityId}`);
      }
      return true;
    } catch (error) {
      this.logger.error(`Error joining community: ${error}`);
      throw new Error('Failed to join community');
    }
  }

  // Create a ritual event within a community
  async createRitualEvent(eventData: Omit<RitualEvent, 'id' | 'createdAt'>): Promise<RitualEvent> {
    try {
      const newEvent: RitualEvent = {
        ...eventData,
        id: this.generateId(),
        createdAt: new Date().toISOString()
      };
      await this.db.insert('ritualEvents', newEvent);
      this.logger.info(`Created new ritual event: ${newEvent.title}`);
      return newEvent;
    } catch (error) {
      this.logger.error(`Error creating ritual event: ${error}`);
      throw new Error('Failed to create ritual event');
    }
  }

  // Send connection request between users
  async sendConnectionRequest(senderId: string, receiverId: string, message?: string): Promise<ConnectionRequest> {
    try {
      const request: ConnectionRequest = {
        id: this.generateId(),
        senderId,
        receiverId,
        message: message || '',
        status: 'pending',
        createdAt: new Date().toISOString()
      };
      await this.db.insert('connectionRequests', request);
      this.logger.info(`Connection request sent from ${senderId} to ${receiverId}`);
      return request;
    } catch (error) {
      this.logger.error(`Error sending connection request: ${error}`);
      throw new Error('Failed to send connection request');
    }
  }

  // Accept or reject connection request
  async handleConnectionRequest(requestId: string, status: 'accepted' | 'rejected'): Promise<boolean> {
    try {
      const request = await this.db.findOne<ConnectionRequest>('connectionRequests', { id: requestId });
      if (!request) throw new Error('Request not found');

      request.status = status;
      await this.db.update('connectionRequests', { id: requestId }, request);

      if (status === 'accepted') {
        // Add mutual connection
        await this.addConnection(request.senderId, request.receiverId);
      }

      this.logger.info(`Connection request ${requestId} ${status}`);
      return true;
    } catch (error) {
      this.logger.error(`Error handling connection request: ${error}`);
      throw new Error('Failed to handle connection request');
    }
  }

  // Get community members
  async getCommunityMembers(communityId: string): Promise<User[]> {
    try {
      const community = await this.db.findOne<RitualCommunity>('ritualCommunities', { id: communityId });
      if (!community) throw new Error('Community not found');

      const members = await this.db.find<User>('users', { id: { $in: community.members } });
      return members;
    } catch (error) {
      this.logger.error(`Error getting community members: ${error}`);
      throw new Error('Failed to get community members');
    }
  }

  // Get ritual events for a community
  async getCommunityEvents(communityId: string): Promise<RitualEvent[]> {
    try {
      const events = await this.db.find<RitualEvent>('ritualEvents', { communityId });
      return events;
    } catch (error) {
      this.logger.error(`Error getting community events: ${error}`);
      throw new Error('Failed to get community events');
    }
  }

  // Helper method to add mutual connection
  private async addConnection(userId1: string, userId2: string): Promise<void> {
    const user1 = await this.db.findOne<User>('users', { id: userId1 });
    const user2 = await this.db.findOne<User>('users', { id: userId2 });

    if (user1 && user2) {
      user1.connections = user1.connections || [];
      user2.connections = user2.connections || [];

      if (!user1.connections.includes(userId2)) user1.connections.push(userId2);
      if (!user2.connections.includes(userId1)) user2.connections.push(userId1);

      await this.db.update('users', { id: userId1 }, user1);
      await this.db.update('users', { id: userId2 }, user2);
    }
  }

  // Helper method to generate unique ID
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}

export default new RitualSocialNetwork();
