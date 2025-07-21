// Community Sustainability and Impact Tracking Service

import { injectable, inject } from 'tsyringe';
import { DatabaseService } from './databaseService';
import { LoggerService } from './loggerService';
import { CommunityMetrics, ImpactReport, SustainabilityGoal } from '../models/communityMetrics';

@injectable()
export class CommunitySustainabilityService {
  private readonly collectionName = 'community_metrics';

  constructor(
    @inject(DatabaseService) private dbService: DatabaseService,
    @inject(LoggerService) private logger: LoggerService
  ) {}

  /**
   * Record a new community metric for sustainability tracking
   * @param metric Community metric data to record
   * @returns Promise with the recorded metric ID
   */
  async recordMetric(metric: CommunityMetrics): Promise<string> {
    try {
      const result = await this.dbService.insertOne(this.collectionName, {
        ...metric,
        timestamp: new Date(),
        type: 'sustainability_metric'
      });
      this.logger.info(`Recorded community metric: ${metric.category}`, { metricId: result.insertedId });
      return result.insertedId.toString();
    } catch (error) {
      this.logger.error('Error recording community metric', error as Error);
      throw new Error('Failed to record community metric');
    }
  }

  /**
   * Set a sustainability goal for a community
   * @param goal Sustainability goal to set
   * @returns Promise with the goal ID
   */
  async setSustainabilityGoal(goal: SustainabilityGoal): Promise<string> {
    try {
      const result = await this.dbService.insertOne(this.collectionName, {
        ...goal,
        createdAt: new Date(),
        type: 'sustainability_goal',
        progress: 0
      });
      this.logger.info(`Set sustainability goal: ${goal.title}`, { goalId: result.insertedId });
      return result.insertedId.toString();
    } catch (error) {
      this.logger.error('Error setting sustainability goal', error as Error);
      throw new Error('Failed to set sustainability goal');
    }
  }

  /**
   * Update progress on a sustainability goal
   * @param goalId ID of the goal to update
   * @param progress New progress value (0-100)
   * @returns Promise with update status
   */
  async updateGoalProgress(goalId: string, progress: number): Promise<boolean> {
    try {
      if (progress < 0 || progress > 100) {
        throw new Error('Progress must be between 0 and 100');
      }
      const result = await this.dbService.updateOne(
        this.collectionName,
        { _id: goalId, type: 'sustainability_goal' },
        { $set: { progress, lastUpdated: new Date() } }
      );
      this.logger.info(`Updated goal progress: ${progress}%`, { goalId });
      return result.modifiedCount > 0;
    } catch (error) {
      this.logger.error('Error updating goal progress', error as Error);
      throw new Error('Failed to update goal progress');
    }
  }

  /**
   * Generate an impact report for a community over a time period
   * @param communityId ID of the community
   * @param startDate Start date for the report
   * @param endDate End date for the report
   * @returns Promise with the impact report
   */
  async generateImpactReport(
    communityId: string,
    startDate: Date,
    endDate: Date
  ): Promise<ImpactReport> {
    try {
      const metrics = await this.dbService.findMany(
        this.collectionName,
        {
          communityId,
          type: 'sustainability_metric',
          timestamp: { $gte: startDate, $lte: endDate }
        }
      );

      const goals = await this.dbService.findMany(
        this.collectionName,
        { communityId, type: 'sustainability_goal' }
      );

      const report: ImpactReport = {
        communityId,
        period: { start: startDate, end: endDate },
        metricsSummary: this.summarizeMetrics(metrics),
        goalsStatus: goals.map(goal => ({
          title: goal.title,
          progress: goal.progress,
          target: goal.target,
          category: goal.category
        })),
        generatedAt: new Date()
      };

      this.logger.info(`Generated impact report for community: ${communityId}`, { period: report.period });
      return report;
    } catch (error) {
      this.logger.error('Error generating impact report', error as Error);
      throw new Error('Failed to generate impact report');
    }
  }

  /**
   * Summarize metrics for reporting
   * @param metrics Array of community metrics
   * @returns Summarized metrics by category
   */
  private summarizeMetrics(metrics: any[]): Record<string, number> {
    const summary: Record<string, number> = {};

    metrics.forEach(metric => {
      const { category, value } = metric;
      summary[category] = (summary[category] || 0) + value;
    });

    return summary;
  }

  /**
   * Get all sustainability goals for a community
   * @param communityId ID of the community
   * @returns Promise with array of sustainability goals
   */
  async getCommunityGoals(communityId: string): Promise<SustainabilityGoal[]> {
    try {
      const goals = await this.dbService.findMany(
        this.collectionName,
        { communityId, type: 'sustainability_goal' }
      );
      return goals as SustainabilityGoal[];
    } catch (error) {
      this.logger.error('Error fetching community goals', error as Error);
      throw new Error('Failed to fetch community goals');
    }
  }
}
