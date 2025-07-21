// Cultural Intelligence Service for Ritual Validation
// This service provides cultural context understanding and validation for rituals

import { Injectable, Logger } from '@nestjs/common';
import { RitualContext, CulturalProfile, ValidationResult } from '../types';
import { CulturalDatabase } from '../data/culturalDatabase';

@Injectable()
export class CulturalIntelligenceService {
  private readonly logger = new Logger(CulturalIntelligenceService.name);
  private culturalDb: CulturalDatabase;

  constructor() {
    this.culturalDb = new CulturalDatabase();
    this.logger.log('Cultural Intelligence Service initialized');
  }

  /**
   * Validates a ritual based on cultural context and regional norms
   * @param ritualContext The context of the ritual being performed
   * @returns ValidationResult indicating if the ritual is culturally appropriate
   */
  async validateRitual(ritualContext: RitualContext): Promise<ValidationResult> {
    try {
      this.logger.debug(`Validating ritual: ${ritualContext.ritualId} for region: ${ritualContext.region}`);
      
      // Get cultural profile for the region
      const culturalProfile = await this.getCulturalProfile(ritualContext.region);
      if (!culturalProfile) {
        return {
          isValid: false,
          reason: `No cultural profile found for region: ${ritualContext.region}`,
          sensitivityScore: 0,
          adaptationSuggestions: []
        };
      }

      // Perform validation based on cultural norms and ritual context
      const validation = this.performCulturalValidation(ritualContext, culturalProfile);
      
      // Log validation result
      this.logger.log(`Ritual validation completed for ${ritualContext.ritualId}: ${validation.isValid ? 'Valid' : 'Invalid'}`);
      return validation;
    } catch (error) {
      this.logger.error(`Validation error for ritual ${ritualContext.ritualId}: ${error.message}`);
      return {
        isValid: false,
        reason: `Validation error: ${error.message}`,
        sensitivityScore: 0,
        adaptationSuggestions: []
      };
    }
  }

  /**
   * Retrieves cultural profile for a specific region
   * @param region The region identifier
   * @returns CulturalProfile for the region
   */
  async getCulturalProfile(region: string): Promise<CulturalProfile | null> {
    return this.culturalDb.getProfile(region);
  }

  /**
   * Performs detailed cultural validation using intelligent algorithms
   * @param ritualContext The context of the ritual
   * @param profile The cultural profile for the region
   * @returns ValidationResult with detailed analysis
   */
  private performCulturalValidation(
    ritualContext: RitualContext,
    profile: CulturalProfile
  ): ValidationResult {
    let isValid = true;
    const reasons: string[] = [];
    let sensitivityScore = 100;
    const adaptationSuggestions: string[] = [];

    // Check temporal context (time-based cultural norms)
    if (profile.temporalRestrictions.includes(ritualContext.timeOfDay)) {
      isValid = false;
      reasons.push(`Ritual timing violates cultural norm for ${ritualContext.timeOfDay}`);
      sensitivityScore -= 30;
      adaptationSuggestions.push(`Consider performing ritual at ${profile.preferredTimes[0]}`);
    }

    // Check symbolic elements
    const invalidSymbols = ritualContext.symbols.filter(
      symbol => !profile.acceptedSymbols.includes(symbol)
    );
    if (invalidSymbols.length > 0) {
      isValid = false;
      reasons.push(`Invalid symbols used: ${invalidSymbols.join(', ')}`);
      sensitivityScore -= 20 * invalidSymbols.length;
      adaptationSuggestions.push(`Replace symbols with culturally appropriate ones: ${profile.acceptedSymbols.join(', ')}`);
    }

    // Check participant roles for cultural appropriateness
    ritualContext.participants.forEach(participant => {
      if (!profile.allowedRoles.includes(participant.role)) {
        isValid = false;
        reasons.push(`Invalid role for participant: ${participant.role}`);
        sensitivityScore -= 10;
        adaptationSuggestions.push(`Assign culturally appropriate role from: ${profile.allowedRoles.join(', ')}`);
      }
    });

    // Adjust sensitivity score to ensure it stays within bounds
    sensitivityScore = Math.max(0, sensitivityScore);

    return {
      isValid,
      reason: isValid ? 'Ritual meets cultural norms' : reasons.join('; '),
      sensitivityScore,
      adaptationSuggestions
    };
  }

  /**
   * Updates cultural database with new information
   * @param region Region to update
   * @param profile Updated cultural profile
   */
  async updateCulturalProfile(region: string, profile: CulturalProfile): Promise<void> {
    await this.culturalDb.updateProfile(region, profile);
    this.logger.log(`Updated cultural profile for region: ${region}`);
  }

  /**
   * Provides cultural adaptation suggestions for failed validations
   * @param ritualContext The ritual context
   * @param validationResult The failed validation result
   * @returns Array of detailed adaptation suggestions
   */
  async getDetailedAdaptationSuggestions(
    ritualContext: RitualContext,
    validationResult: ValidationResult
  ): Promise<string[]> {
    const suggestions = [...validationResult.adaptationSuggestions];
    const profile = await this.getCulturalProfile(ritualContext.region);
    
    if (profile) {
      suggestions.push(`Consider local customs: ${profile.localCustoms.join(', ')}`);
      suggestions.push(`Incorporate traditional elements: ${profile.traditionalElements.join(', ')}`);
    }
    
    return suggestions;
  }
}