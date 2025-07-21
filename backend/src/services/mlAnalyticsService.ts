import { injectable, inject } from 'tsyringe';
import * as tf from '@tensorflow/tfjs-node';
import { KMeans } from 'kmeans-js';
import natural from 'natural';

import { IRitualRepository } from '../repositories/IRitualRepository';
import { ICommunityRepository } from '../repositories/ICommunityRepository';
import { Ritual } from '../models/Ritual';
import { logger } from '../utils/logger';

interface RitualCluster {
  id: number;
  rituals: Ritual[];
  centroid: number[];
}

interface SentimentResult {
  score: number;
  classification: string;
}

@injectable()
export class MLAnalyticsService {
  private tokenizer = new natural.WordTokenizer();
  private sentimentAnalyzer = new natural.SentimentAnalyzer('English', natural.PorterStemmer, 'afinn');

  constructor(
    @inject('RitualRepository') private ritualRepository: IRitualRepository,
    @inject('CommunityRepository') private communityRepository: ICommunityRepository
  ) {}

  /**
   * Analyzes ritual patterns using K-means clustering
   * @param rituals Rituals to analyze
   * @param k Number of clusters
   * @returns Array of ritual clusters
   */
  async analyzeRitualPatterns(rituals: Ritual[], k: number = 3): Promise<RitualCluster[]> {
    try {
      logger.info('Starting ritual pattern analysis with K-means clustering');

      // Prepare data for clustering (using engagement metrics and duration as features)
      const data = rituals.map(ritual => [
        ritual.participantCount || 0,
        ritual.duration || 0,
        ritual.feedback?.length || 0
      ]);

      // Initialize KMeans
      const kmeans = new KMeans();
      const clusters = kmeans.cluster(data, k);

      // Map clusters to ritual objects
      const ritualClusters: RitualCluster[] = clusters.map((cluster, index) => ({
        id: index,
        rituals: cluster.indices.map(idx => rituals[idx]),
        centroid: cluster.centroid
      }));

      logger.info(`Completed clustering with ${k} clusters`);
      return ritualClusters;
    } catch (error) {
      logger.error('Error in ritual pattern analysis:', error);
      throw new Error('Failed to analyze ritual patterns');
    }
  }

  /**
   * Performs sentiment analysis on ritual feedback
   * @param feedback Array of feedback texts
   * @returns Sentiment analysis results
   */
  analyzeRitualSentiment(feedback: string[]): SentimentResult {
    try {
      logger.info('Starting sentiment analysis on ritual feedback');

      const tokens = feedback.flatMap(text => this.tokenizer.tokenize(text));
      const sentimentScore = this.sentimentAnalyzer.getSentiment(tokens);

      const result: SentimentResult = {
        score: sentimentScore,
        classification: sentimentScore > 0 ? 'positive' : sentimentScore < 0 ? 'negative' : 'neutral'
      };

      logger.info('Completed sentiment analysis', result);
      return result;
    } catch (error) {
      logger.error('Error in sentiment analysis:', error);
      throw new Error('Failed to analyze ritual sentiment');
    }
  }

  /**
   * Predicts cultural trends using historical ritual data
   * @param startDate Start date for historical data
   * @param endDate End date for historical data
   * @returns Trend analysis results
   */
  async predictCulturalTrends(startDate: Date, endDate: Date): Promise<any> {
    try {
      logger.info('Starting cultural trend prediction');

      // Fetch historical ritual data
      const rituals = await this.ritualRepository.getRitualsByDateRange(startDate, endDate);

      // Prepare time series data
      const timeSeriesData = rituals.map(ritual => ({
        date: ritual.createdAt,
        engagement: ritual.participantCount || 0
      })).sort((a, b) => a.date.getTime() - b.date.getTime());

      // Simple moving average for trend prediction
      const windowSize = 7;
      const trendData = [];
      for (let i = windowSize; i < timeSeriesData.length; i++) {
        const window = timeSeriesData.slice(i - windowSize, i);
        const avgEngagement = window.reduce((sum, item) => sum + item.engagement, 0) / windowSize;
        trendData.push({ date: timeSeriesData[i].date, predictedEngagement: avgEngagement });
      }

      logger.info('Completed cultural trend prediction');
      return trendData;
    } catch (error) {
      logger.error('Error in cultural trend prediction:', error);
      throw new Error('Failed to predict cultural trends');
    }
  }

  /**
   * Analyzes community engagement using ML models
   * @param communityId Community ID to analyze
   * @returns Engagement analysis results
   */
  async analyzeCommunityEngagement(communityId: string): Promise<any> {
    try {
      logger.info(`Starting engagement analysis for community ${communityId}`);

      const community = await this.communityRepository.getById(communityId);
      if (!community) {
        throw new Error('Community not found');
      }

      const rituals = await this.ritualRepository.getRitualsByCommunity(communityId);
      const engagementData = rituals.map(ritual => ({
        participants: ritual.participantCount || 0,
        feedbackCount: ritual.feedback?.length || 0,
        duration: ritual.duration || 0
      }));

      // Simple statistical analysis (could be enhanced with ML models)
      const totalEngagement = engagementData.reduce((sum, item) => sum + item.participants, 0);
      const avgFeedback = engagementData.length > 0 
        ? engagementData.reduce((sum, item) => sum + item.feedbackCount, 0) / engagementData.length 
        : 0;

      const result = {
        communityId,
        totalEngagement,
        averageFeedbackPerRitual: avgFeedback,
        ritualCount: rituals.length
      };

      logger.info(`Completed engagement analysis for community ${communityId}`, result);
      return result;
    } catch (error) {
      logger.error('Error in community engagement analysis:', error);
      throw new Error('Failed to analyze community engagement');
    }
  }
}