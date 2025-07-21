// collaborationService.ts
import { injectable, inject } from 'tsyringe';
import { Ritual, RitualVersion } from '../models/ritualModel';
import { CommunityPost, CommunityComment } from '../models/communityModel';
import { SocketService } from './socketService';
import { DatabaseService } from './databaseService';

@injectable()
export class CollaborationService {
  constructor(
    @inject(SocketService) private socketService: SocketService,
    @inject(DatabaseService) private dbService: DatabaseService
  ) {}

  // Real-time collaboration for ritual co-creation
  async joinRitualSession(ritualId: string, userId: string): Promise<void> {
    await this.socketService.joinRoom(ritualId, userId);
    this.socketService.broadcast(ritualId, 'userJoined', { userId });
  }

  async leaveRitualSession(ritualId: string, userId: string): Promise<void> {
    await this.socketService.leaveRoom(ritualId, userId);
    this.socketService.broadcast(ritualId, 'userLeft', { userId });
  }

  async updateRitualDraft(ritualId: string, userId: string, content: any): Promise<void> {
    // Save draft to database with versioning
    const version: RitualVersion = {
      ritualId,
      version: await this.getNextVersion(ritualId),
      content,
      authorId: userId,
      createdAt: new Date(),
    };
    await this.dbService.saveRitualVersion(version);
    this.socketService.broadcast(ritualId, 'draftUpdated', { content, userId });
  }

  private async getNextVersion(ritualId: string): Promise<number> {
    const latestVersion = await this.dbService.getLatestRitualVersion(ritualId);
    return latestVersion ? latestVersion.version + 1 : 1;
  }

  // Version control for rituals
  async getRitualVersions(ritualId: string): Promise<RitualVersion[]> {
    return this.dbService.getRitualVersions(ritualId);
  }

  async rollbackRitualVersion(ritualId: string, version: number): Promise<RitualVersion | null> {
    const targetVersion = await this.dbService.getRitualVersion(ritualId, version);
    if (targetVersion) {
      await this.dbService.updateRitual(ritualId, targetVersion.content);
      this.socketService.broadcast(ritualId, 'versionRolledBack', { version });
    }
    return targetVersion;
  }

  // Community discussion features
  async createCommunityPost(post: CommunityPost): Promise<CommunityPost> {
    const savedPost = await this.dbService.saveCommunityPost(post);
    this.socketService.broadcast('community', 'newPost', savedPost);
    return savedPost;
  }

  async addComment(postId: string, comment: CommunityComment): Promise<CommunityComment> {
    const savedComment = await this.dbService.saveComment(postId, comment);
    this.socketService.broadcast(`post:${postId}`, 'newComment', savedComment);
    return savedComment;
  }

  async getCommunityPosts(topic?: string): Promise<CommunityPost[]> {
    return this.dbService.getCommunityPosts(topic);
  }

  // Community moderation
  async flagContent(contentId: string, contentType: 'post' | 'comment', userId: string, reason: string): Promise<void> {
    await this.dbService.flagContent(contentId, contentType, userId, reason);
    // Notify moderators (implement notification logic as needed)
    this.socketService.broadcast('moderators', 'contentFlagged', { contentId, contentType, reason });
  }

  async moderateContent(contentId: string, contentType: 'post' | 'comment', action: 'remove' | 'warn' | 'dismiss'): Promise<void> {
    if (action === 'remove') {
      await this.dbService.removeContent(contentId, contentType);
    } else if (action === 'warn') {
      await this.dbService.warnUser(contentId, contentType);
    }
    // Log moderation action or notify user as needed
    this.socketService.broadcast('moderators', 'moderationAction', { contentId, contentType, action });
  }

  // Cultural exchange features
  async shareRitualCulture(ritualId: string, communityId: string): Promise<void> {
    const ritual = await this.dbService.getRitual(ritualId);
    if (ritual) {
      await this.dbService.shareRitualToCommunity(ritual, communityId);
      this.socketService.broadcast(`community:${communityId}`, 'newSharedRitual', ritual);
    }
  }
}
