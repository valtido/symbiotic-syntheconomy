// Impact Tracking Service for Ritual Sustainability Metrics
import { injectable, inject } from 'tsyringe';
import { ILogger } from '../interfaces/ILogger';
import { IRitual } from '../models/IRitual';

interface ImpactMetrics {
  carbonFootprint: number; // in kg CO2 equivalent
  ecosystemImpact: number; // scale 0-100, higher is worse
  resourceConsumption: number; // in arbitrary units
  sustainabilityScore: number; // scale 0-100, higher is better
}

interface SustainabilityReport {
  ritualId: string;
  timestamp: Date;
  metrics: ImpactMetrics;
  recommendations: string[];
}

@injectable()
export class ImpactTrackingService {
  private reports: SustainabilityReport[] = [];

  constructor(@inject('Logger') private logger: ILogger) {
    this.logger.info('ImpactTrackingService initialized');
  }

  /**
   * Calculate carbon footprint based on ritual parameters
   */
  private calculateCarbonFootprint(ritual: IRitual): number {
    // Base footprint calculation considering duration and participants
    let footprint = ritual.duration * ritual.participants * 0.1;

    // Add factors for materials used if available
    if (ritual.materials) {
      footprint += ritual.materials.length * 0.5;
    }

    return Number(footprint.toFixed(2));
  }

  /**
   * Assess ecosystem impact based on ritual location and activities
   */
  private calculateEcosystemImpact(ritual: IRitual): number {
    let impact = 0;

    // Higher impact for outdoor rituals
    if (ritual.location?.toLowerCase().includes('outdoor')) {
      impact += 30;
    }

    // Add impact for specific activities
    if (ritual.activities) {
      ritual.activities.forEach(activity => {
        if (activity.toLowerCase().includes('fire')) impact += 20;
        if (activity.toLowerCase().includes('digging')) impact += 15;
      });
    }

    return Math.min(100, impact);
  }

  /**
   * Calculate resource consumption
   */
  private calculateResourceConsumption(ritual: IRitual): number {
    return ritual.duration * ritual.participants * 0.2;
  }

  /**
   * Calculate overall sustainability score
   */
  private calculateSustainabilityScore(metrics: ImpactMetrics): number {
    // Weighted scoring: lower footprint and impact = higher score
    const carbonWeight = 0.4;
    const ecosystemWeight = 0.4;
    const resourceWeight = 0.2;

    const normalizedCarbon = Math.max(0, 100 - metrics.carbonFootprint * 2);
    const normalizedEcosystem = 100 - metrics.ecosystemImpact;
    const normalizedResource = Math.max(0, 100 - metrics.resourceConsumption * 5);

    return Number((
      normalizedCarbon * carbonWeight +
      normalizedEcosystem * ecosystemWeight +
      normalizedResource * resourceWeight
    ).toFixed(2));
  }

  /**
   * Generate recommendations based on metrics
   */
  private generateRecommendations(metrics: ImpactMetrics): string[] {
    const recommendations: string[] = [];

    if (metrics.carbonFootprint > 10) {
      recommendations.push('Consider reducing ritual duration or participants to lower carbon footprint');
    }
    if (metrics.ecosystemImpact > 50) {
      recommendations.push('Minimize environmental disruption by choosing less invasive activities');
    }
    if (metrics.resourceConsumption > 5) {
      recommendations.push('Optimize resource usage through sustainable materials');
    }

    return recommendations;
  }

  /**
   * Track impact metrics for a ritual
   */
  public trackRitualImpact(ritual: IRitual): SustainabilityReport {
    try {
      const metrics: ImpactMetrics = {
        carbonFootprint: this.calculateCarbonFootprint(ritual),
        ecosystemImpact: this.calculateEcosystemImpact(ritual),
        resourceConsumption: this.calculateResourceConsumption(ritual),
        sustainabilityScore: 0
      };

      metrics.sustainabilityScore = this.calculateSustainabilityScore(metrics);
      const recommendations = this.generateRecommendations(metrics);

      const report: SustainabilityReport = {
        ritualId: ritual.id,
        timestamp: new Date(),
        metrics,
        recommendations
      };

      this.reports.push(report);
      this.logger.info(`Impact tracked for ritual ${ritual.id}`, { metrics });
      return report;
    } catch (error) {
      this.logger.error(`Error tracking impact for ritual ${ritual.id}`, error);
      throw error;
    }
  }

  /**
   * Get sustainability report for a specific ritual
   */
  public getRitualReport(ritualId: string): SustainabilityReport | undefined {
    return this.reports.find(report => report.ritualId === ritualId);
  }

  /**
   * Get long-term sustainability trends
   */
  public getSustainabilityTrends(startDate: Date, endDate: Date): SustainabilityReport[] {
    return this.reports.filter(report => 
      report.timestamp >= startDate && report.timestamp <= endDate
    );
  }

  /**
   * Get average sustainability metrics across all rituals
   */
  public getAverageMetrics(): ImpactMetrics | undefined {
    if (this.reports.length === 0) return undefined;

    const total = this.reports.reduce((acc, report) => ({
      carbonFootprint: acc.carbonFootprint + report.metrics.carbonFootprint,
      ecosystemImpact: acc.ecosystemImpact + report.metrics.ecosystemImpact,
      resourceConsumption: acc.resourceConsumption + report.metrics.resourceConsumption,
      sustainabilityScore: acc.sustainabilityScore + report.metrics.sustainabilityScore
    }), {
      carbonFootprint: 0,
      ecosystemImpact: 0,
      resourceConsumption: 0,
      sustainabilityScore: 0
    });

    return {
      carbonFootprint: Number((total.carbonFootprint / this.reports.length).toFixed(2)),
      ecosystemImpact: Number((total.ecosystemImpact / this.reports.length).toFixed(2)),
      resourceConsumption: Number((total.resourceConsumption / this.reports.length).toFixed(2)),
      sustainabilityScore: Number((total.sustainabilityScore / this.reports.length).toFixed(2))
    };
  }
}
