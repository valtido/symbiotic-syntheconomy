// Advanced AI Orchestration Service for Symbiotic Syntheconomy

import { injectable, inject } from 'tsyringe';
import { Logger } from 'winston';
import { ModelPerformanceMetrics, RitualValidationResult, ModelConsensus } from '../types/aiTypes';
import { IAIModel } from '../interfaces/IAIModel';

@injectable()
export class AIOrchestrationService {
  private models: Map<string, IAIModel> = new Map();
  private performanceMetrics: Map<string, ModelPerformanceMetrics> = new Map();
  private activeModel: string | null = null;
  private readonly MIN_CONSENSUS_THRESHOLD = 0.7;
  private readonly PERFORMANCE_DEGRADATION_THRESHOLD = 0.2;

  constructor(@inject('Logger') private logger: Logger) {
    this.logger.info('AI Orchestration Service initialized');
  }

  /**
   * Register a new AI model to the orchestration service
   */
  registerModel(modelId: string, model: IAIModel, initialMetrics?: ModelPerformanceMetrics): void {
    this.models.set(modelId, model);
    if (initialMetrics) {
      this.performanceMetrics.set(modelId, initialMetrics);
    } else {
      this.performanceMetrics.set(modelId, {
        accuracy: 0,
        latency: 0,
        errorRate: 0,
        lastUpdated: new Date(),
      });
    }
    this.logger.info(`Model registered: ${modelId}`);

    // Set first registered model as active
    if (!this.activeModel) {
      this.activeModel = modelId;
      this.logger.info(`Active model set to: ${modelId}`);
    }
  }

  /**
   * Validate ritual data using multiple models and consensus mechanism
   */
  async validateRitual(data: unknown): Promise<RitualValidationResult> {
    if (!this.activeModel || this.models.size === 0) {
      throw new Error('No AI models registered for validation');
    }

    try {
      // Get predictions from all models for consensus
      const predictions = await this.getModelPredictions(data);
      const consensus = this.calculateConsensus(predictions);

      // Update performance metrics
      this.updatePerformanceMetrics(predictions);

      // Check if we need to switch models based on performance
      await this.optimizeModelSelection();

      return {
        isValid: consensus.agreement >= this.MIN_CONSENSUS_THRESHOLD,
        confidence: consensus.agreement,
        details: consensus.details,
        modelUsed: this.activeModel,
      };
    } catch (error) {
      this.logger.error(`Ritual validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  /**
   * Get predictions from all registered models
   */
  private async getModelPredictions(data: unknown): Promise<Map<string, any>> {
    const predictions = new Map<string, any>();
    const promises: Promise<void>[] = [];

    for (const [modelId, model] of this.models) {
      promises.push(
        model
          .predict(data)
          .then((result) => {
            predictions.set(modelId, result);
          })
          .catch((error) => {
            this.logger.error(`Prediction failed for model ${modelId}: ${error}`);
            predictions.set(modelId, { error: true, message: String(error) });
          })
      );
    }

    await Promise.all(promises);
    return predictions;
  }

  /**
   * Calculate consensus among model predictions
   */
  private calculateConsensus(predictions: Map<string, any>): ModelConsensus {
    let agreementCount = 0;
    let totalValidPredictions = 0;
    const details: Record<string, any> = {};
    let primaryResult: boolean | null = null;

    for (const [modelId, result] of predictions) {
      if (!result.error && typeof result.isValid === 'boolean') {
        totalValidPredictions++;
        if (primaryResult === null) {
          primaryResult = result.isValid;
        }
        if (result.isValid === primaryResult) {
          agreementCount++;
        }
        details[modelId] = result;
      } else {
        details[modelId] = { error: true, message: result.message || 'Prediction failed' };
      }
    }

    return {
      agreement: totalValidPredictions > 0 ? agreementCount / totalValidPredictions : 0,
      details,
    };
  }

  /**
   * Update performance metrics for models
   */
  private updatePerformanceMetrics(predictions: Map<string, any>): void {
    for (const [modelId, result] of predictions) {
      const metrics = this.performanceMetrics.get(modelId);
      if (!metrics) continue;

      // Update metrics based on prediction result
      if (!result.error) {
        metrics.accuracy = (metrics.accuracy * 0.9) + (result.confidence || 0.5) * 0.1;
        metrics.latency = (metrics.latency * 0.9) + (result.latency || 100) * 0.1;
        metrics.errorRate = metrics.errorRate * 0.9;
      } else {
        metrics.errorRate = (metrics.errorRate * 0.9) + 0.1;
      }
      metrics.lastUpdated = new Date();
      this.performanceMetrics.set(modelId, metrics);
    }
  }

  /**
   * Optimize model selection based on performance metrics
   */
  private async optimizeModelSelection(): Promise<void> {
    if (this.models.size <= 1 || !this.activeModel) return;

    const currentMetrics = this.performanceMetrics.get(this.activeModel);
    if (!currentMetrics) return;

    // Check if current model performance has degraded
    if (currentMetrics.errorRate > this.PERFORMANCE_DEGRADATION_THRESHOLD) {
      let bestModelId = this.activeModel;
      let bestScore = this.calculatePerformanceScore(currentMetrics);

      for (const [modelId, metrics] of this.performanceMetrics) {
        if (modelId === this.activeModel) continue;

        const score = this.calculatePerformanceScore(metrics);
        if (score > bestScore) {
          bestScore = score;
          bestModelId = modelId;
        }
      }

      if (bestModelId !== this.activeModel) {
        this.activeModel = bestModelId;
        this.logger.info(`Switched active model to ${bestModelId} due to better performance`);
      }
    }
  }

  /**
   * Calculate performance score for a model based on metrics
   */
  private calculatePerformanceScore(metrics: ModelPerformanceMetrics): number {
    return (
      metrics.accuracy * 0.6 -
      metrics.errorRate * 0.3 -
      metrics.latency * 0.0001 * 0.1
    );
  }

  /**
   * Trigger continuous learning for underperforming models
   */
  async triggerContinuousLearning(): Promise<void> {
    for (const [modelId, metrics] of this.performanceMetrics) {
      if (metrics.errorRate > this.PERFORMANCE_DEGRADATION_THRESHOLD) {
        try {
          const model = this.models.get(modelId);
          if (model && typeof model.retrain === 'function') {
            await model.retrain();
            this.logger.info(`Continuous learning triggered for model: ${modelId}`);
            metrics.errorRate = 0; // Reset error rate after retraining
            metrics.lastUpdated = new Date();
            this.performanceMetrics.set(modelId, metrics);
          }
        } catch (error) {
          this.logger.error(`Continuous learning failed for model ${modelId}: ${error}`);
        }
      }
    }
  }

  /**
   * Get current active model ID
   */
  getActiveModel(): string | null {
    return this.activeModel;
  }

  /**
   * Get performance metrics for all models
   */
  getPerformanceMetrics(): Map<string, ModelPerformanceMetrics> {
    return new Map(this.performanceMetrics);
  }
}
