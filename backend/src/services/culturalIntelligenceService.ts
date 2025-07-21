// Cultural Intelligence Service for Ritual Validation

import { Injectable, Logger } from '@nestjs/common';
import { RitualContext, CulturalProfile, ValidationResult } from '../types/ritual.types';
import { CulturalDatabase } from '../database/cultural.database';

@Injectable()
export class CulturalIntelligenceService {
  private readonly logger = new Logger(CulturalIntelligenceService.name);
  private readonly culturalThreshold = 0.75; // Minimum cultural alignment score

  constructor(private readonly culturalDatabase: CulturalDatabase) {}

  /**
   * Validates a ritual based on cultural context and regional norms
   * @param context The ritual context including region and cultural elements
   * @returns ValidationResult with status and feedback
   */
  async validateRitual(context: RitualContext): Promise<ValidationResult> {
    try {
      this.logger.log(`Validating ritual for region: ${context.region}`);
      const culturalProfile = await this.getCulturalProfile(context.region);
      const alignmentScore = this.calculateCulturalAlignment(context, culturalProfile);

      if (alignmentScore >= this.culturalThreshold) {
        return {
          isValid: true,
          score: alignmentScore,
          feedback: 'Ritual aligns well with cultural norms.',
          culturalInsights: this.generateCulturalInsights(context, culturalProfile),
        };
      } else {
        return {
          isValid: false,
          score: alignmentScore,
          feedback: 'Ritual does not meet cultural alignment threshold.',
          culturalInsights: this.generateCulturalInsights(context, culturalProfile),
        };
      }
    } catch (error) {
      this.logger.error(`Validation failed: ${error.message}`);
      return {
        isValid: false,
        score: 0,
        feedback: 'Error during cultural validation.',
        culturalInsights: [],
      };
    }
  }

  /**
   * Retrieves cultural profile for a specific region
   * @param region The target region for cultural data
   * @returns CulturalProfile with norms and sensitivities
   */
  async getCulturalProfile(region: string): Promise<CulturalProfile> {
    this.logger.debug(`Fetching cultural profile for ${region}`);
    return this.culturalDatabase.getProfile(region);
  }

  /**
   * Calculates alignment score between ritual context and cultural profile
   * @param context Ritual context with elements to validate
   * @param profile Cultural profile with norms and guidelines
   * @returns number representing alignment score (0-1)
   */
  private calculateCulturalAlignment(context: RitualContext, profile: CulturalProfile): number {
    let totalScore = 0;
    let totalElements = 0;

    // Evaluate symbolic elements
    if (context.symbols) {
      context.symbols.forEach((symbol) => {
        const symbolMatch = profile.symbolicNorms[symbol.name];
        if (symbolMatch) {
          totalScore += symbolMatch.acceptanceLevel;
          totalElements++;
        }
      });
    }

    // Evaluate temporal elements (timing of ritual)
    if (context.timing) {
      const timingMatch = profile.temporalNorms[context.timing.period];
      if (timingMatch) {
        totalScore += timingMatch.acceptanceLevel;
        totalElements++;
      }
    }

    // Evaluate participant roles for inclusivity
    if (context.participants) {
      const inclusivityScore = this.validateInclusivity(context.participants, profile);
      totalScore += inclusivityScore;
      totalElements++;
    }

    return totalElements > 0 ? totalScore / totalElements : 0;
  }

  /**
   * Validates inclusivity of participants based on cultural norms
   * @param participants List of participant roles and demographics
   * @param profile Cultural profile with inclusivity guidelines
   * @returns number representing inclusivity score (0-1)
   */
  private validateInclusivity(participants: any[], profile: CulturalProfile): number {
    let inclusivityScore = 0;
    const diversityFactors = profile.inclusivityGuidelines.diversityFactors;

    if (participants.length === 0) return 0;

    // Check for representation across diversity factors (gender, age, etc.)
    const representedFactors = new Set();
    participants.forEach((participant) => {
      if (participant.demographics) {
        Object.keys(participant.demographics).forEach((factor) => {
          if (diversityFactors.includes(factor)) {
            representedFactors.add(factor);
          }
        });
      }
    });

    inclusivityScore = representedFactors.size / diversityFactors.length;
    return inclusivityScore;
  }

  /**
   * Generates actionable cultural insights for ritual improvement
   * @param context Ritual context being validated
   * @param profile Cultural profile for reference
   * @returns Array of insight strings
   */
  private generateCulturalInsights(context: RitualContext, profile: CulturalProfile): string[] {
    const insights: string[] = [];

    // Check symbolic alignment
    if (context.symbols) {
      context.symbols.forEach((symbol) => {
        const norm = profile.symbolicNorms[symbol.name];
        if (!norm || norm.acceptanceLevel < 0.5) {
          insights.push(`Symbol '${symbol.name}' may not be culturally appropriate. Consider alternatives.`);
        }
      });
    }

    // Check timing alignment
    if (context.timing) {
      const timingNorm = profile.temporalNorms[context.timing.period];
      if (!timingNorm || timingNorm.acceptanceLevel < 0.5) {
        insights.push(`Timing '${context.timing.period}' may not align with cultural practices.`);
      }
    }

    // Inclusivity insights
    const inclusivityScore = this.validateInclusivity(context.participants || [], profile);
    if (inclusivityScore < 0.5) {
      insights.push('Consider increasing participant diversity to align with cultural inclusivity norms.');
    }

    return insights;
  }

  /**
   * Adapts a ritual to better fit regional cultural norms
   * @param context Ritual context to adapt
   * @returns Adapted RitualContext
   */
  async adaptRitualToRegion(context: RitualContext): Promise<RitualContext> {
    const culturalProfile = await this.getCulturalProfile(context.region);
    const adaptedContext = { ...context };

    // Adapt symbols based on cultural norms
    if (adaptedContext.symbols) {
      adaptedContext.symbols = adaptedContext.symbols.map((symbol) => {
        const norm = culturalProfile.symbolicNorms[symbol.name];
        if (!norm || norm.acceptanceLevel < 0.5) {
          return { ...symbol, name: this.suggestAlternativeSymbol(symbol.name, culturalProfile) };
        }
        return symbol;
      });
    }

    this.logger.log(`Adapted ritual for region: ${context.region}`);
    return adaptedContext;
  }

  /**
   * Suggests an alternative symbol based on cultural norms
   * @param currentSymbol Current symbol name
   * @param profile Cultural profile for reference
   * @returns Alternative symbol name
   */
  private suggestAlternativeSymbol(currentSymbol: string, profile: CulturalProfile): string {
    const norms = profile.symbolicNorms;
    const alternatives = Object.keys(norms).filter((key) => norms[key].acceptanceLevel >= 0.8);
    return alternatives.length > 0 ? alternatives[0] : currentSymbol;
  }
}
