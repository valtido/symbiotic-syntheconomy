// Community Engagement and Gamification Service

import { User } from '../models/User';
import { Ritual } from '../models/Ritual';
import { Badge } from '../models/Badge';
import { Leaderboard } from '../models/Leaderboard';

interface EngagementMetrics {
  participationCount: number;
  ritualCompletionRate: number;
  communityScore: number;
}

interface GamificationReward {
  badgeId: string;
  points: number;
  levelUp: boolean;
}

export class CommunityEngagementService {
  private static instance: CommunityEngagementService;

  private constructor() {}

  static getInstance(): CommunityEngagementService {
    if (!CommunityEngagementService.instance) {
      CommunityEngagementService.instance = new CommunityEngagementService();
    }
    return CommunityEngagementService.instance;
  }

  async trackParticipation(userId: string, ritualId: string): Promise<EngagementMetrics> {
    try {
      const user = await User.findById(userId);
      const ritual = await Ritual.findById(ritualId);

      if (!user || !ritual) {
        throw new Error('User or Ritual not found');
      }

      user.engagement.participationCount += 1;
      user.engagement.communityScore += ritual.difficulty * 10;

      const completedRituals = user.engagement.completedRituals || [];
      if (!completedRituals.includes(ritualId)) {
        completedRituals.push(ritualId);
        user.engagement.completedRituals = completedRituals;
      }

      const totalRituals = await Ritual.countDocuments();
      user.engagement.ritualCompletionRate = completedRituals.length / totalRituals;

      await user.save();

      await this.updateLeaderboard(userId, user.engagement.communityScore);

      return {
        participationCount: user.engagement.participationCount,
        ritualCompletionRate: user.engagement.ritualCompletionRate,
        communityScore: user.engagement.communityScore,
      };
    } catch (error) {
      console.error('Error tracking participation:', error);
      throw error;
    }
  }

  async awardBadge(userId: string, badgeCriteria: string): Promise<GamificationReward> {
    try {
      const user = await User.findById(userId);
      const badge = await Badge.findOne({ criteria: badgeCriteria });

      if (!user || !badge) {
        throw new Error('User or Badge not found');
      }

      if (!user.badges.includes(badge._id)) {
        user.badges.push(badge._id);
        user.engagement.communityScore += badge.points;
        await user.save();

        const levelUp = await this.checkLevelUp(userId, user.engagement.communityScore);

        return {
          badgeId: badge._id.toString(),
          points: badge.points,
          levelUp,
        };
      }

      return { badgeId: badge._id.toString(), points: 0, levelUp: false };
    } catch (error) {
      console.error('Error awarding badge:', error);
      throw error;
    }
  }

  private async checkLevelUp(userId: string, communityScore: number): Promise<boolean> {
    try {
      const user = await User.findById(userId);
      if (!user) throw new Error('User not found');

      const currentLevel = user.engagement.level || 1;
      const newLevel = Math.floor(communityScore / 100) + 1;

      if (newLevel > currentLevel) {
        user.engagement.level = newLevel;
        await user.save();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error checking level up:', error);
      throw error;
    }
  }

  private async updateLeaderboard(userId: string, communityScore: number): Promise<void> {
    try {
      await Leaderboard.findOneAndUpdate(
        { userId },
        { $set: { score: communityScore, lastUpdated: new Date() } },
        { upsert: true }
      );
    } catch (error) {
      console.error('Error updating leaderboard:', error);
      throw error;
    }
  }

  async getLeaderboard(limit: number = 10): Promise<any[]> {
    try {
      return await Leaderboard.find()
        .sort({ score: -1 })
        .limit(limit)
        .populate('userId', 'username');
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      throw error;
    }
  }

  async getUserEngagementMetrics(userId: string): Promise<EngagementMetrics> {
    try {
      const user = await User.findById(userId);
      if (!user) throw new Error('User not found');

      return {
        participationCount: user.engagement.participationCount,
        ritualCompletionRate: user.engagement.ritualCompletionRate,
        communityScore: user.engagement.communityScore,
      };
    } catch (error) {
      console.error('Error fetching user engagement metrics:', error);
      throw error;
    }
  }
}

export default CommunityEngagementService.getInstance();
