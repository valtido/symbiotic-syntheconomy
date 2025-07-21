import { Injectable, Logger } from '@nestjs/common';
import * as tf from '@tensorflow/tfjs-node';
import * as fs from 'fs';
import * as path from 'path';
import { RitualData, CommunityBehavior, CulturalImpact } from '../models/ritual.model';

@Injectable()
export class PredictiveAnalyticsService {
  private readonly logger = new Logger(PredictiveAnalyticsService.name);
  private model: tf.LayersModel | null = null;
  private readonly modelPath = path.join(__dirname, '../../models/ritual_predictor');

  constructor() {
    this.initializeModel();
  }

  /**
   * Initialize or load the predictive model
   */
  private async initializeModel(): Promise<void> {
    try {
      if (fs.existsSync(this.modelPath)) {
        this.model = await tf.loadLayersModel(`file://${this.modelPath}/model.json`);
        this.logger.log('Loaded existing predictive model');
      } else {
        this.model = this.createModel();
        this.logger.log('Created new predictive model');
        await this.saveModel();
      }
    } catch (error) {
      this.logger.error(`Model initialization failed: ${error.message}`);
      this.model = this.createModel();
    }
  }

  /**
   * Create a new neural network model for ritual prediction
   */
  private createModel(): tf.LayersModel {
    const model = tf.sequential();
    model.add(tf.layers.dense({ units: 64, activation: 'relu', inputShape: [10] }));
    model.add(tf.layers.dropout({ rate: 0.2 }));
    model.add(tf.layers.dense({ units: 32, activation: 'relu' }));
    model.add(tf.layers.dropout({ rate: 0.2 }));
    model.add(tf.layers.dense({ units: 16, activation: 'relu' }));
    model.add(tf.layers.dense({ units: 3, activation: 'softmax' }));

    model.compile({
      optimizer: tf.train.adam(),
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy'],
    });

    return model;
  }

  /**
   * Save the current model to disk
   */
  private async saveModel(): Promise<void> {
    if (this.model) {
      await this.model.save(`file://${this.modelPath}`);
      this.logger.log('Model saved successfully');
    }
  }

  /**
   * Preprocess ritual data for model input
   */
  private preprocessData(data: RitualData[]): number[][] {
    return data.map(item => [
      item.participationRate,
      item.duration,
      item.frequency,
      item.sentimentScore,
      item.communityEngagement,
      item.resourceConsumption,
      item.culturalRelevance,
      item.historicalImpact,
      item.geographicSpread,
      item.digitalPresence,
    ]);
  }

  /**
   * Train the model with new ritual data
   */
  async trainModel(data: RitualData[], labels: number[][]): Promise<void> {
    if (!this.model) throw new Error('Model not initialized');

    const xs = tf.tensor2d(this.preprocessData(data));
    const ys = tf.tensor2d(labels);

    this.logger.log('Starting model training...');
    await this.model.fit(xs, ys, {
      epochs: 50,
      batchSize: 32,
      validationSplit: 0.2,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          this.logger.log(`Epoch ${epoch}: loss = ${logs.loss.toFixed(4)}, accuracy = ${logs.acc.toFixed(4)}`);
        },
      },
    });

    await this.saveModel();
    xs.dispose();
    ys.dispose();
    this.logger.log('Model training completed');
  }

  /**
   * Predict ritual trends based on input data
   */
  async predictRitualTrends(data: RitualData): Promise<{ trend: string; probability: number }> {
    if (!this.model) throw new Error('Model not initialized');

    const input = tf.tensor2d(this.preprocessData([data]));
    const prediction = this.model.predict(input) as tf.Tensor;
    const probabilities = await prediction.data();
    input.dispose();
    prediction.dispose();

    const trendLabels = ['Declining', 'Stable', 'Growing'];
    const maxProbIndex = probabilities.indexOf(Math.max(...probabilities));

    return {
      trend: trendLabels[maxProbIndex],
      probability: probabilities[maxProbIndex],
    };
  }

  /**
   * Analyze community behavior patterns using time series
   */
  async analyzeCommunityBehavior(data: CommunityBehavior[]): Promise<{ patterns: string[]; insights: string[] }> {
    // Simple moving average for smoothing time series data
    const engagementValues = data.map(d => d.engagementLevel);
    const smoothed = this.calculateMovingAverage(engagementValues, 3);

    const patterns = this.detectPatterns(smoothed);
    const insights = this.generateInsights(patterns, data);

    return { patterns, insights };
  }

  /**
   * Calculate moving average for time series smoothing
   */
  private calculateMovingAverage(data: number[], windowSize: number): number[] {
    const result: number[] = [];
    for (let i = 0; i < data.length; i++) {
      const start = Math.max(0, i - windowSize + 1);
      const end = i + 1;
      const window = data.slice(start, end);
      result.push(window.reduce((sum, val) => sum + val, 0) / window.length);
    }
    return result;
  }

  /**
   * Detect patterns in smoothed data
   */
  private detectPatterns(data: number[]): string[] {
    const patterns: string[] = [];
    if (data.length < 3) return patterns;

    for (let i = 1; i < data.length - 1; i++) {
      if (data[i] > data[i - 1] && data[i] > data[i + 1]) {
        patterns.push(`Peak at index ${i}`);
      } else if (data[i] < data[i - 1] && data[i] < data[i + 1]) {
        patterns.push(`Trough at index ${i}`);
      }
    }
    return patterns;
  }

  /**
   * Generate actionable insights from patterns
   */
  private generateInsights(patterns: string[], data: CommunityBehavior[]): string[] {
    const insights: string[] = [];
    if (patterns.length === 0) {
      insights.push('No significant patterns detected in community behavior.');
      return insights;
    }

    patterns.forEach(pattern => {
      if (pattern.includes('Peak')) {
        insights.push('Community engagement peaked - consider capitalizing with events or rituals.');
      } else if (pattern.includes('Trough')) {
        insights.push('Community engagement dropped - investigate causes and consider interventions.');
      }
    });

    return insights;
  }

  /**
   * Predict cultural impact of rituals
   */
  async predictCulturalImpact(data: RitualData): Promise<CulturalImpact> {
    if (!this.model) throw new Error('Model not initialized');

    const trendPrediction = await this.predictRitualTrends(data);
    return {
      impactScore: trendPrediction.probability * 100,
      predictedInfluence: trendPrediction.trend,
      confidence: trendPrediction.probability,
    };
  }

  /**
   * Real-time prediction endpoint for streaming data
   */
  async realTimePrediction(dataStream: RitualData[]): Promise<{ predictions: any[] }> {
    const predictions = await Promise.all(
      dataStream.map(async data => ({
        ritualId: data.id,
        trend: await this.predictRitualTrends(data),
        impact: await this.predictCulturalImpact(data),
      }))
    );
    return { predictions };
  }
}
