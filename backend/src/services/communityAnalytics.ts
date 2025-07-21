// communityAnalytics.ts

import { injectable, inject } from 'tsyringe';
import { DatabaseService } from './databaseService';
import { LoggerService } from './loggerService';
import { CommunityMetrics, CulturalTrend, EngagementStats } from '../models/community';

@injectable()
export class CommunityAnalyticsService {
  constructor(
    @inject(DatabaseService) private dbService: DatabaseService,
    @inject(LoggerService) private logger: LoggerService
  ) {}

  /**
   * Calculate community engagement metrics based on user interactions
   * @param communityId The ID of the community to analyze
   * @returns Community engagement statistics
   */
  async calculateEngagementMetrics(communityId: string): Promise<EngagementStats> {
    try {
      this.logger.info(`Calculating engagement metrics for community: ${communityId}`);
      const interactions = await this.dbService.getCommunityInteractions(communityId);
      const activeUsers = new Set(interactions.map(i => i.userId)).size;
      const totalInteractions = interactions.length;
      const avgInteractionsPerUser = activeUsers > 0 ? totalInteractions / activeUsers : 0;

      return {
        communityId,
        activeUsers,
        totalInteractions,
        avgInteractionsPerUser,
        timestamp: new Date()
      };
    } catch (error) {
      this.logger.error(`Error calculating engagement metrics for community ${communityId}:`, error);
      throw error;
    }
  }

  /**
   * Identify cultural trends based on community content and interactions
   * @param communityId The ID of the community to analyze
   * @returns Array of identified cultural trends
   */
  async identifyCulturalTrends(communityId: string): Promise<CulturalTrend[]> {
    try {
      this.logger.info(`Identifying cultural trends for community: ${communityId}`);
      const contentData = await this.dbService.getCommunityContent(communityId);
      const keywords = this.extractKeywordsFromContent(contentData);
      const trends = this.analyzeTrends(keywords);

      return trends.map(trend => ({
        communityId,
        trendName: trend.name,
        frequency: trend.frequency,
        sentimentScore: trend.sentiment,
        firstObserved: new Date(),
        lastUpdated: new Date()
      }));
    } catch (error) {
      this.logger.error(`Error identifying cultural trends for community ${communityId}:`, error);
      throw error;
    }
  }

  /**
   * Extract keywords from community content for trend analysis
   * @param contentData Raw content data from the community
   * @returns Array of extracted keywords with metadata
   */
  private extractKeywordsFromContent(contentData: any[]): string[] {
    // Simple keyword extraction logic (can be enhanced with NLP)
    const textContent = contentData.map(c => c.text || '').join(' ');
    const words = textContent.toLowerCase().split(/\s+/);
    const keywordMap = new Map<string, number>();

    words.forEach(word => {
      if (word.length > 3) { // Ignore short words
        keywordMap.set(word, (keywordMap.get(word) || 0) + 1);
      }
    });

    return Array.from(keywordMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(entry => entry[0]);
  }

  /**
   * Analyze trends from extracted keywords
   * @param keywords Array of keywords to analyze
   * @returns Array of trend objects with frequency and sentiment
   */
  private analyzeTrends(keywords: string[]): { name: string; frequency: number; sentiment: number }[] {
    // Mock trend analysis (can be replaced with real NLP/sentiment analysis)
    return keywords.map(keyword => ({
      name: keyword,
      frequency: Math.floor(Math.random() * 100) + 10, // Mock frequency
      sentiment: Math.random() * 2 - 1 // Mock sentiment score between -1 and 1
    }));
  }

  /**
   * Get comprehensive community metrics including engagement and trends
   * @param communityId The ID of the community to analyze
   * @returns Comprehensive community metrics
   */
  async getCommunityMetrics(communityId: string): Promise<CommunityMetrics> {
    try {
      const engagement = await this.calculateEngagementMetrics(communityId);
      const trends = await this.identifyCulturalTrends(communityId);

      return {
        communityId,
        engagement,
        trends,
        lastUpdated: new Date()
      };
    } catch (error) {
      this.logger.error(`Error getting community metrics for ${communityId}:`, error);
      throw error;
    }
  }
}