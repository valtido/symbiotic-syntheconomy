// CrossCulturalService - Handles cross-cultural exchange, translation, and dialogue tools
import { injectable, inject } from 'tsyringe';
import { Translator } from '../utils/translator';
import { CulturalContext } from '../models/culturalContext';
import { Dialogue } from '../models/dialogue';
import { ConflictResolution } from '../utils/conflictResolution';
import { SensitivityTraining } from '../utils/sensitivityTraining';

@injectable()
export class CrossCulturalService {
  private translator: Translator;
  private conflictResolver: ConflictResolution;
  private sensitivityTrainer: SensitivityTraining;
  private culturalContexts: CulturalContext[] = [];
  private dialogues: Dialogue[] = [];

  constructor(
    @inject('Translator') translator: Translator,
    @inject('ConflictResolution') conflictResolver: ConflictResolution,
    @inject('SensitivityTraining') sensitivityTrainer: SensitivityTraining
  ) {
    this.translator = translator;
    this.conflictResolver = conflictResolver;
    this.sensitivityTrainer = sensitivityTrainer;
    this.loadCulturalContexts();
  }

  private loadCulturalContexts(): void {
    // Mock loading cultural contexts from a database or configuration
    this.culturalContexts = [
      new CulturalContext('en-US', 'American', ['individualism', 'direct communication']),
      new CulturalContext('ja-JP', 'Japanese', ['collectivism', 'indirect communication'])
    ];
  }

  public async translateWithContext(text: string, sourceLang: string, targetLang: string): Promise<string> {
    const sourceContext = this.culturalContexts.find(ctx => ctx.languageCode === sourceLang);
    const targetContext = this.culturalContexts.find(ctx => ctx.languageCode === targetLang);

    if (!sourceContext || !targetContext) {
      throw new Error('Cultural context not found for source or target language');
    }

    // Translate with cultural nuances
    let translatedText = await this.translator.translate(text, sourceLang, targetLang);
    translatedText = this.adjustForCulturalNuance(translatedText, sourceContext, targetContext);
    return translatedText;
  }

  private adjustForCulturalNuance(
    text: string,
    sourceContext: CulturalContext,
    targetContext: CulturalContext
  ): string {
    // Simple example of adjusting text based on cultural traits
    if (sourceContext.traits.includes('direct communication') && 
        targetContext.traits.includes('indirect communication')) {
      return this.softenExpression(text);
    } else if (sourceContext.traits.includes('indirect communication') && 
               targetContext.traits.includes('direct communication')) {
      return this.sharpenExpression(text);
    }
    return text;
  }

  private softenExpression(text: string): string {
    return `I would like to suggest that ${text.toLowerCase()}.`;
  }

  private sharpenExpression(text: string): string {
    return `I need you to ${text.toLowerCase()}.`;
  }

  public async facilitateDialogue(dialogue: Dialogue): Promise<void> {
    this.dialogues.push(dialogue);
    const participants = dialogue.participants;
    for (const message of dialogue.messages) {
      for (const participant of participants) {
        if (participant.language !== message.language) {
          message.translatedContent[participant.language] = await this.translateWithContext(
            message.content,
            message.language,
            participant.language
          );
        }
      }
    }
  }

  public async resolveConflict(dialogueId: string): Promise<string> {
    const dialogue = this.dialogues.find(d => d.id === dialogueId);
    if (!dialogue) {
      throw new Error('Dialogue not found');
    }
    return await this.conflictResolver.resolve(dialogue);
  }

  public async provideSensitivityTraining(userId: string, cultureCode: string): Promise<string> {
    const context = this.culturalContexts.find(ctx => ctx.languageCode === cultureCode);
    if (!context) {
      throw new Error('Cultural context not found');
    }
    return await this.sensitivityTrainer.train(userId, context);
  }

  public getCulturalContext(languageCode: string): CulturalContext | undefined {
    return this.culturalContexts.find(ctx => ctx.languageCode === languageCode);
  }
}
