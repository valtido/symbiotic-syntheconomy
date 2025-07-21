// Community Moderation and Safety Systems for Symbiotic Syntheconomy

import { injectable, inject } from 'tsyringe';
import { Logger } from 'winston';
import * as natural from 'natural';
import { BadWords } from 'bad-words';
import { DatabaseService } from './databaseService';

interface ModerationResult {
  isFlagged: boolean;
  reasons: string[];
  score: number;
}

interface ContentReport {
  contentId: string;
  userId: string;
  reason: string;
  timestamp: Date;
}

@injectable()
export class CommunityModerationService {
  private tokenizer: natural.WordTokenizer;
  private badWordsFilter: BadWords;
  private culturalSensitivityKeywords: Set<string>;
  private toxicityThreshold: number = 0.7;

  constructor(
    @inject('Logger') private logger: Logger,
    @inject(DatabaseService) private dbService: DatabaseService
  ) {
    this.tokenizer = new natural.WordTokenizer();
    this.badWordsFilter = new BadWords();
    this.culturalSensitivityKeywords = new Set([
      // Add culturally sensitive terms and phrases
      'race', 'religion', 'ethnicity', 'gender', 'discrimination',
      // Add more terms as needed
    ]);
    this.logger.info('Community Moderation Service initialized');
  }

  /**
   * Analyzes content for potential issues related to safety and cultural sensitivity
   * @param content The text content to analyze
   * @returns ModerationResult indicating if content is flagged and reasons
   */
  public async analyzeContent(content: string): Promise<ModerationResult> {
    try {
      const reasons: string[] = [];
      let score = 0;

      // Check for profanity
      if (this.badWordsFilter.isProfane(content)) {
        reasons.push('Contains profanity');
        score += 0.3;
      }

      // Tokenize content for deeper analysis
      const tokens = this.tokenizer.tokenize(content.toLowerCase());

      // Check for cultural sensitivity keywords
      const sensitiveTokens = tokens.filter(token => this.culturalSensitivityKeywords.has(token));
      if (sensitiveTokens.length > 0) {
        reasons.push(`Contains culturally sensitive terms: ${sensitiveTokens.join(', ')}`);
        score += 0.2 * sensitiveTokens.length;
      }

      // Sentiment analysis using natural
      const sentimentAnalyzer = new natural.SentimentAnalyzer('English', natural.PorterStemmer, 'afinn');
      const sentiment = sentimentAnalyzer.getSentiment(tokens);
      if (sentiment < -0.5) {
        reasons.push('Negative sentiment detected');
        score += 0.2;
      }

      const isFlagged = score >= this.toxicityThreshold;
      this.logger.info('Content analysis completed', { contentId: content.substring(0, 50), isFlagged, score, reasons });

      return {
        isFlagged,
        reasons,
        score
      };
    } catch (error) {
      this.logger.error('Error analyzing content', { error });
      throw new Error('Failed to analyze content');
    }
  }

  /**
   * Reports content for moderation review
   * @param contentId ID of the content being reported
   * @param userId ID of the user reporting the content
   * @param reason Reason for reporting
   */
  public async reportContent(contentId: string, userId: string, reason: string): Promise<void> {
    try {
      const report: ContentReport = {
        contentId,
        userId,
        reason,
        timestamp: new Date()
      };

      await this.dbService.saveReport(report);
      this.logger.info('Content reported', { contentId, userId, reason });

      // Trigger notification to moderators if necessary
      const reportCount = await this.dbService.getReportCount(contentId);
      if (reportCount >= 3) {
        this.notifyModerators(contentId, reportCount);
      }
    } catch (error) {
      this.logger.error('Error reporting content', { error, contentId, userId });
      throw new Error('Failed to report content');
    }
  }

  /**
   * Notifies moderators about content with multiple reports
   * @param contentId ID of the content
   * @param reportCount Number of reports
   */
  private async notifyModerators(contentId: string, reportCount: number): Promise<void> {
    try {
      // Implementation for notifying moderators (email, internal messaging, etc.)
      this.logger.info('Notifying moderators about flagged content', { contentId, reportCount });
      // Placeholder for actual notification logic
    } catch (error) {
      this.logger.error('Error notifying moderators', { error, contentId });
    }
  }

  /**
   * Bans a user for violating community guidelines
   * @param userId ID of the user to ban
   * @param reason Reason for the ban
   * @param duration Duration of the ban in days
   */
  public async banUser(userId: string, reason: string, duration: number): Promise<void> {
    try {
      await this.dbService.banUser(userId, reason, duration);
      this.logger.info('User banned', { userId, reason, duration });
    } catch (error) {
      this.logger.error('Error banning user', { error, userId });
      throw new Error('Failed to ban user');
    }
  }

  /**
   * Updates the list of culturally sensitive keywords
   * @param keywords Array of keywords to add to the sensitivity list
   */
  public updateCulturalKeywords(keywords: string[]): void {
    try {
      keywords.forEach(keyword => this.culturalSensitivityKeywords.add(keyword.toLowerCase()));
      this.logger.info('Cultural sensitivity keywords updated', { keywords });
    } catch (error) {
      this.logger.error('Error updating cultural keywords', { error });
      throw new Error('Failed to update cultural keywords');
    }
  }
}
