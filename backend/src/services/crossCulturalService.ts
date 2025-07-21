import { injectable, inject } from 'tsyringe';
import { Translator } from '../interfaces/Translator';
import { CulturalContext } from '../interfaces/CulturalContext';
import { ConflictResolution } from '../interfaces/ConflictResolution';
import { User } from '../models/User';

@injectable()
export class CrossCulturalService {
  constructor(
    @inject('Translator') private translator: Translator,
    @inject('CulturalContext') private culturalContext: CulturalContext,
    @inject('ConflictResolution') private conflictResolution: ConflictResolution
  ) {}

  async translateWithContext(text: string, sourceLang: string, targetLang: string, culturalNotes?: string): Promise<string> {
    try {
      // Basic translation
      let translatedText = await this.translator.translate(text, sourceLang, targetLang);

      // Add cultural context if provided or detected
      if (culturalNotes || this.culturalContext.hasContext(text, sourceLang)) {
        const context = culturalNotes || await this.culturalContext.getContext(text, sourceLang);
        translatedText = `${translatedText} [Cultural Note: ${context}]`;
      }

      return translatedText;
    } catch (error) {
      throw new Error(`Translation failed: ${error.message}`);
    }
  }

  async facilitateDialogue(user1: User, user2: User, message: string): Promise<string> {
    try {
      // Detect languages and cultural backgrounds
      const user1Lang = user1.language || 'en';
      const user2Lang = user2.language || 'en';

      // Translate message with cultural sensitivity
      const translatedMessage = await this.translateWithContext(
        message,
        user1Lang,
        user2Lang,
        user1.culturalBackground
      );

      // Check for potential misunderstandings
      const sensitivityCheck = await this.culturalContext.checkSensitivity(message, user1Lang, user2Lang);
      if (sensitivityCheck.warning) {
        return `${translatedMessage}
[Note: ${sensitivityCheck.message}]`;
      }

      return translatedMessage;
    } catch (error) {
      throw new Error(`Dialogue facilitation failed: ${error.message}`);
    }
  }

  async provideCulturalTraining(user: User, targetCulture: string): Promise<string> {
    try {
      const trainingMaterial = await this.culturalContext.getTrainingMaterial(targetCulture, user.language);
      return trainingMaterial;
    } catch (error) {
      throw new Error(`Cultural training failed: ${error.message}`);
    }
  }

  async resolveConflict(user1: User, user2: User, issue: string): Promise<string> {
    try {
      // Analyze cultural backgrounds and issue context
      const resolutionStrategy = await this.conflictResolution.analyze(
        issue,
        user1.culturalBackground,
        user2.culturalBackground
      );

      // Suggest resolution based on cultural norms
      return await this.conflictResolution.suggestResolution(resolutionStrategy);
    } catch (error) {
      throw new Error(`Conflict resolution failed: ${error.message}`);
    }
  }

  async detectCulturalMisunderstanding(text: string, sourceCulture: string, targetCulture: string): Promise<boolean> {
    try {
      const check = await this.culturalContext.checkSensitivity(text, sourceCulture, targetCulture);
      return !!check.warning;
    } catch (error) {
      throw new Error(`Misunderstanding detection failed: ${error.message}`);
    }
  }
}