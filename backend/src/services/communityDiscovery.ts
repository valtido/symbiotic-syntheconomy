// Advanced Community Discovery and Matching Service
import { injectable, inject } from 'tsyringe';
import { UserRepository } from '../repositories/userRepository';
import { CommunityRepository } from '../repositories/communityRepository';
import { User } from '../models/user';
import { Community } from '../models/community';

interface CulturalProfile {
  interests: string[];
  heritage: string;
  language: string;
  location: string;
}

interface MatchingScore {
  communityId: string;
  score: number;
  reasons: string[];
}

@injectable()
export class CommunityDiscoveryService {
  constructor(
    @inject(UserRepository) private userRepository: UserRepository,
    @inject(CommunityRepository) private communityRepository: CommunityRepository
  ) {}

  /**
   * Discover communities for a user based on cultural profile
   * @param userId The ID of the user
   * @param maxResults Maximum number of communities to return
   * @returns List of matching communities with scores
   */
  async discoverCommunities(userId: string, maxResults: number = 5): Promise<MatchingScore[]> {
    try {
      // Fetch user data
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new Error(`User ${userId} not found`);
      }

      // Build cultural profile
      const userProfile = this.buildCulturalProfile(user);

      // Fetch all communities
      const communities = await this.communityRepository.findAll();

      // Calculate matching scores
      const scores = this.calculateMatchingScores(userProfile, communities);

      // Sort by score and limit results
      return scores
        .sort((a, b) => b.score - a.score)
        .slice(0, maxResults);
    } catch (error) {
      console.error('Error in discoverCommunities:', error);
      throw error;
    }
  }

  /**
   * Build a cultural profile from user data
   * @param user User data
   * @returns Cultural profile
   */
  private buildCulturalProfile(user: User): CulturalProfile {
    return {
      interests: user.interests || [],
      heritage: user.heritage || '',
      language: user.language || '',
      location: user.location || ''
    };
  }

  /**
   * Calculate matching scores between user profile and communities
   * @param userProfile User's cultural profile
   * @param communities List of communities
   * @returns Array of matching scores
   */
  private calculateMatchingScores(userProfile: CulturalProfile, communities: Community[]): MatchingScore[] {
    const scores: MatchingScore[] = [];

    for (const community of communities) {
      let score = 0;
      const reasons: string[] = [];

      // Interest matching (weight: 30%)
      const commonInterests = userProfile.interests.filter(interest => 
        community.tags.includes(interest)
      );
      const interestScore = commonInterests.length * 30;
      if (interestScore > 0) {
        score += interestScore;
        reasons.push(`Shared interests: ${commonInterests.join(', ')}`);
      }

      // Heritage matching (weight: 25%)
      if (userProfile.heritage && community.heritage === userProfile.heritage) {
        score += 25;
        reasons.push(`Shared heritage: ${userProfile.heritage}`);
      }

      // Language matching (weight: 20%)
      if (userProfile.language && community.language === userProfile.language) {
        score += 20;
        reasons.push(`Shared language: ${userProfile.language}`);
      }

      // Location proximity (weight: 25%)
      if (userProfile.location && community.location === userProfile.location) {
        score += 25;
        reasons.push(`Shared location: ${userProfile.location}`);
      }

      if (score > 0) {
        scores.push({
          communityId: community.id,
          score,
          reasons
        });
      }
    }

    return scores;
  }

  /**
   * Recommend users to connect with based on community overlap
   * @param userId The ID of the user
   * @param maxResults Maximum number of users to return
   * @returns List of recommended user IDs
   */
  async recommendConnections(userId: string, maxResults: number = 5): Promise<string[]> {
    try {
      // Get user's communities
      const userCommunities = await this.communityRepository.findByUserId(userId);
      if (!userCommunities.length) {
        return [];
      }

      // Get other users in same communities
      const communityIds = userCommunities.map(c => c.id);
      const potentialConnections = await this.userRepository.findByCommunityIds(communityIds);

      // Filter out current user and limit results
      return potentialConnections
        .filter(user => user.id !== userId)
        .map(user => user.id)
        .slice(0, maxResults);
    } catch (error) {
      console.error('Error in recommendConnections:', error);
      throw error;
    }
  }
}
