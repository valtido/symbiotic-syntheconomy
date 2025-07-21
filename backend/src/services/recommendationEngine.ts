// Advanced Ritual Recommendation Engine
// Implements collaborative filtering and content-based recommendations for rituals

import { UserProfile, Ritual, BioregionContext } from '../types';
import { calculateSimilarity } from '../utils/mathUtils';

/**
 * Ritual Recommendation Engine
 * Provides personalized ritual recommendations based on user preferences,
 * cultural background, and bioregion context
 */
export class RitualRecommendationEngine {
  private userProfiles: UserProfile[];
  private rituals: Ritual[];

  constructor(userProfiles: UserProfile[], rituals: Ritual[]) {
    this.userProfiles = userProfiles;
    this.rituals = rituals;
  }

  /**
   * Get personalized ritual recommendations for a user
   * @param userId - Target user ID
   * @param bioregionContext - User's bioregion context
   * @param limit - Maximum number of recommendations to return
   * @returns Array of recommended rituals
   */
  public getRecommendations(
    userId: string,
    bioregionContext: BioregionContext,
    limit: number = 5
  ): Ritual[] {
    const userProfile = this.userProfiles.find(u => u.id === userId);
    if (!userProfile) {
      throw new Error(`User profile not found for ID: ${userId}`);
    }

    // Combine collaborative filtering and content-based scores
    const collaborativeScores = this.getCollaborativeScores(userId);
    const contentScores = this.getContentBasedScores(userProfile, bioregionContext);

    // Merge scores with weighted average (60% content-based, 40% collaborative)
    const combinedScores = this.rituals.map(ritual => {
      const collabScore = collaborativeScores[ritual.id] || 0;
      const contentScore = contentScores[ritual.id] || 0;
      const combinedScore = (0.6 * contentScore) + (0.4 * collabScore);
      return { ritual, score: combinedScore };
    });

    // Sort by score and return top recommendations
    return combinedScores
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.ritual);
  }

  /**
   * Collaborative filtering based on user similarities
   * @param userId - Target user ID
   * @returns Object mapping ritual IDs to recommendation scores
   */
  private getCollaborativeScores(userId: string): { [ritualId: string]: number } {
    const targetUser = this.userProfiles.find(u => u.id === userId);
    if (!targetUser) return {};

    const scores: { [ritualId: string]: number } = {};

    // Find similar users based on preferences and history
    const similarUsers = this.userProfiles
      .filter(u => u.id !== userId)
      .map(u => ({
        user: u,
        similarity: calculateSimilarity(targetUser.preferences, u.preferences),
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 10); // Top 10 similar users

    // Aggregate scores from similar users
    similarUsers.forEach(({ user, similarity }) => {
      user.ritualHistory?.forEach(ritualId => {
        if (!targetUser.ritualHistory?.includes(ritualId)) {
          scores[ritualId] = (scores[ritualId] || 0) + similarity;
        }
      });
    });

    return scores;
  }

  /**
   * Content-based filtering based on user profile and bioregion
   * @param userProfile - Target user's profile
   * @param bioregionContext - User's bioregion context
   * @returns Object mapping ritual IDs to recommendation scores
   */
  private getContentBasedScores(
    userProfile: UserProfile,
    bioregionContext: BioregionContext
  ): { [ritualId: string]: number } {
    const scores: { [ritualId: string]: number } = {};

    this.rituals.forEach(ritual => {
      let score = 0;

      // Score based on cultural background match
      if (ritual.culturalBackground === userProfile.culturalBackground) {
        score += 2;
      }

      // Score based on bioregion compatibility
      if (ritual.bioregionCompatibility.includes(bioregionContext.regionId)) {
        score += 3;
      }

      // Score based on user preferences
      const preferenceMatch = calculateSimilarity(
        userProfile.preferences,
        ritual.attributes
      );
      score += preferenceMatch * 5;

      // Score based on seasonal relevance
      if (ritual.seasonalContext === bioregionContext.currentSeason) {
        score += 1.5;
      }

      scores[ritual.id] = score;
    });

    return scores;
  }

  /**
   * Update user profiles with new data
   * @param profiles - Updated user profiles
   */
  public updateUserProfiles(profiles: UserProfile[]): void {
    this.userProfiles = profiles;
  }

  /**
   * Update rituals database
   * @param rituals - Updated rituals
   */
  public updateRituals(rituals: Ritual[]): void {
    this.rituals = rituals;
  }
}

export default RitualRecommendationEngine;
