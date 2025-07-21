// Advanced Collaboration Service for Ritual Co-Creation

import { injectable, inject } from 'tsyringe';
import { v4 as uuidv4 } from 'uuid';
import { RedisClient } from '../utils/redisClient';
import { DatabaseService } from './databaseService';
import { TranslationService } from './translationService';
import { CulturalSensitivityService } from './culturalSensitivityService';
import { ModeratorService } from './moderatorService';

interface CollaborationSession {
  id: string;
  ritualId: string;
  participants: string[];
  content: string;
  version: number;
  history: { version: number; content: string; author: string; timestamp: Date }[];
  conflicts: { version: number; content: string; author: string }[];
  language: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Discussion {
  id: string;
  ritualId: string;
  messages: { content: string; author: string; timestamp: Date; language: string }[];
  moderated: boolean;
}

@injectable()
export class AdvancedCollaborationService {
  private readonly redisPrefix = 'collaboration:';

  constructor(
    @inject(RedisClient) private redisClient: RedisClient,
    @inject(DatabaseService) private dbService: DatabaseService,
    @inject(TranslationService) private translationService: TranslationService,
    @inject(CulturalSensitivityService) private culturalSensitivityService: CulturalSensitivityService,
    @inject(ModeratorService) private moderatorService: ModeratorService
  ) {}

  // Create a new collaboration session for a ritual
  async createSession(ritualId: string, creatorId: string, language: string): Promise<string> {
    const sessionId = uuidv4();
    const session: CollaborationSession = {
      id: sessionId,
      ritualId,
      participants: [creatorId],
      content: '',
      version: 0,
      history: [],
      conflicts: [],
      language,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.redisClient.set(`${this.redisPrefix}session:${sessionId}`, JSON.stringify(session));
    await this.dbService.saveCollaborationSession(session);
    return sessionId;
  }

  // Join an existing collaboration session
  async joinSession(sessionId: string, userId: string): Promise<void> {
    const sessionData = await this.redisClient.get(`${this.redisPrefix}session:${sessionId}`);
    if (!sessionData) throw new Error('Session not found');

    const session: CollaborationSession = JSON.parse(sessionData);
    if (!session.participants.includes(userId)) {
      session.participants.push(userId);
      session.updatedAt = new Date();
      await this.redisClient.set(`${this.redisPrefix}session:${sessionId}`, JSON.stringify(session));
      await this.dbService.updateCollaborationSession(session);
    }
  }

  // Real-time content update with version control and conflict detection
  async updateContent(sessionId: string, userId: string, content: string, version: number): Promise<void> {
    const sessionData = await this.redisClient.get(`${this.redisPrefix}session:${sessionId}`);
    if (!sessionData) throw new Error('Session not found');

    const session: CollaborationSession = JSON.parse(sessionData);
    if (session.version !== version) {
      session.conflicts.push({ version, content, author: userId });
      await this.redisClient.set(`${this.redisPrefix}session:${sessionId}`, JSON.stringify(session));
      throw new Error('Conflict detected. Please resolve conflicts before updating.');
    }

    session.content = content;
    session.version += 1;
    session.history.push({ version: session.version, content, author: userId, timestamp: new Date() });
    session.updatedAt = new Date();

    await this.redisClient.set(`${this.redisPrefix}session:${sessionId}`, JSON.stringify(session));
    await this.dbService.updateCollaborationSession(session);
  }

  // Resolve conflicts in content updates
  async resolveConflict(sessionId: string, userId: string, resolvedContent: string): Promise<void> {
    const sessionData = await this.redisClient.get(`${this.redisPrefix}session:${sessionId}`);
    if (!sessionData) throw new Error('Session not found');

    const session: CollaborationSession = JSON.parse(sessionData);
    session.content = resolvedContent;
    session.version += 1;
    session.history.push({ version: session.version, content: resolvedContent, author: userId, timestamp: new Date() });
    session.conflicts = [];
    session.updatedAt = new Date();

    await this.redisClient.set(`${this.redisPrefix}session:${sessionId}`, JSON.stringify(session));
    await this.dbService.updateCollaborationSession(session);
  }

  // Translate content for multi-language collaboration
  async translateContent(sessionId: string, targetLanguage: string): Promise<string> {
    const sessionData = await this.redisClient.get(`${this.redisPrefix}session:${sessionId}`);
    if (!sessionData) throw new Error('Session not found');

    const session: CollaborationSession = JSON.parse(sessionData);
    return await this.translationService.translate(session.content, session.language, targetLanguage);
  }

  // Start a discussion for community input
  async startDiscussion(ritualId: string, userId: string, initialMessage: string, language: string): Promise<string> {
    const discussionId = uuidv4();
    const discussion: Discussion = {
      id: discussionId,
      ritualId,
      messages: [{ content: initialMessage, author: userId, timestamp: new Date(), language }],
      moderated: false,
    };

    await this.redisClient.set(`${this.redisPrefix}discussion:${discussionId}`, JSON.stringify(discussion));
    await this.dbService.saveDiscussion(discussion);
    return discussionId;
  }

  // Add a message to a discussion with cultural sensitivity check
  async addMessage(discussionId: string, userId: string, content: string, language: string): Promise<void> {
    const discussionData = await this.redisClient.get(`${this.redisPrefix}discussion:${discussionId}`);
    if (!discussionData) throw new Error('Discussion not found');

    const discussion: Discussion = JSON.parse(discussionData);
    const sensitivityCheck = await this.culturalSensitivityService.analyze(content, language);
    if (sensitivityCheck.isSensitive) {
      await this.moderatorService.flagContent(discussionId, content, userId, sensitivityCheck.reason);
      throw new Error('Content flagged for cultural sensitivity. Awaiting moderation.');
    }

    discussion.messages.push({ content, author: userId, timestamp: new Date(), language });
    await this.redisClient.set(`${this.redisPrefix}discussion:${discussionId}`, JSON.stringify(discussion));
    await this.dbService.updateDiscussion(discussion);
  }

  // Moderate discussion content
  async moderateDiscussion(discussionId: string, moderatorId: string, approved: boolean): Promise<void> {
    const discussionData = await this.redisClient.get(`${this.redisPrefix}discussion:${discussionId}`);
    if (!discussionData) throw new Error('Discussion not found');

    const discussion: Discussion = JSON.parse(discussionData);
    discussion.moderated = true;
    await this.moderatorService.logModerationAction(discussionId, moderatorId, approved ? 'approved' : 'rejected');
    await this.redisClient.set(`${this.redisPrefix}discussion:${discussionId}`, JSON.stringify(discussion));
    await this.dbService.updateDiscussion(discussion);
  }

  // Provide cultural sensitivity training material
  async getCulturalTraining(language: string): Promise<string> {
    return await this.culturalSensitivityService.getTrainingMaterial(language);
  }

  // Get session details
  async getSession(sessionId: string): Promise<CollaborationSession> {
    const sessionData = await this.redisClient.get(`${this.redisPrefix}session:${sessionId}`);
    if (!sessionData) throw new Error('Session not found');
    return JSON.parse(sessionData);
  }

  // Get discussion details
  async getDiscussion(discussionId: string): Promise<Discussion> {
    const discussionData = await this.redisClient.get(`${this.redisPrefix}discussion:${discussionId}`);
    if (!discussionData) throw new Error('Discussion not found');
    return JSON.parse(discussionData);
  }
}
