import { createReadStream, createWriteStream } from 'fs';
import { join } from 'path';
import * as i18n from 'i18n';
import { promisify } from 'util';
import { readFile, writeFile } from 'fs/promises';

// Define supported languages and cultural configurations
interface LanguageConfig {
  code: string;
  name: string;
  rtl: boolean;
  calendar: string; // e.g., 'gregorian', 'hijri', 'jalali'
  dateFormat: string;
  timeFormat: string;
  currency: string;
  region: string;
}

interface TranslationResponse {
  translatedText: string;
  culturalNotes?: string[];
  warnings?: string[];
}

class LocalizationService {
  private supportedLanguages: LanguageConfig[] = [];
  private communityTranslations: Map<string, Record<string, string>> = new Map();
  private readonly translationsDir = join(__dirname, '../../translations');
  private readonly fallbackLanguage = 'en';

  constructor() {
    this.initialize();
    this.loadCommunityTranslations();
  }

  private initialize(): void {
    // Initialize i18n configuration
    i18n.configure({
      locales: this.getSupportedLanguageCodes(),
      directory: this.translationsDir,
      defaultLocale: this.fallbackLanguage,
      objectNotation: true,
      updateFiles: false,
    });

    // Define supported languages (partial list for demo - expandable to 50+)
    this.supportedLanguages = [
      { code: 'en', name: 'English', rtl: false, calendar: 'gregorian', dateFormat: 'MM/DD/YYYY', timeFormat: 'hh:mm A', currency: 'USD', region: 'US' },
      { code: 'ar', name: 'Arabic', rtl: true, calendar: 'hijri', dateFormat: 'DD/MM/YYYY', timeFormat: 'HH:mm', currency: 'SAR', region: 'SA' },
      { code: 'fa', name: 'Persian', rtl: true, calendar: 'jalali', dateFormat: 'YYYY/MM/DD', timeFormat: 'HH:mm', currency: 'IRR', region: 'IR' },
      { code: 'fr', name: 'French', rtl: false, calendar: 'gregorian', dateFormat: 'DD/MM/YYYY', timeFormat: 'HH:mm', currency: 'EUR', region: 'FR' },
      // Add more languages as needed (up to 50+)
    ];
  }

  private getSupportedLanguageCodes(): string[] {
    return this.supportedLanguages.map(lang => lang.code);
  }

  private async loadCommunityTranslations(): Promise<void> {
    try {
      const communityData = await readFile(join(this.translationsDir, 'community.json'), 'utf-8');
      const parsedData = JSON.parse(communityData);
      for (const [lang, translations] of Object.entries(parsedData)) {
        this.communityTranslations.set(lang, translations as Record<string, string>);
      }
    } catch (error) {
      console.warn('No community translations found or error loading them:', error);
    }
  }

  public async saveCommunityTranslation(language: string, key: string, translation: string): Promise<void> {
    if (!this.communityTranslations.has(language)) {
      this.communityTranslations.set(language, {});
    }
    const translations = this.communityTranslations.get(language) as Record<string, string>;
    translations[key] = translation;
    await writeFile(
      join(this.translationsDir, 'community.json'),
      JSON.stringify(Object.fromEntries(this.communityTranslations), null, 2),
      'utf-8'
    );
  }

  public async translate(
    text: string,
    targetLanguage: string,
    context?: { culturalContext?: string; region?: string }
  ): Promise<TranslationResponse> {
    let translatedText = text;
    const warnings: string[] = [];
    const culturalNotes: string[] = [];

    // Check if target language is supported
    if (!this.getSupportedLanguageCodes().includes(targetLanguage)) {
      warnings.push(`Unsupported language: ${targetLanguage}. Falling back to ${this.fallbackLanguage}.`);
      targetLanguage = this.fallbackLanguage;
    }

    // Use i18n for translation if available
    try {
      i18n.setLocale(targetLanguage);
      translatedText = i18n.__(text);
    } catch (error) {
      warnings.push(`Translation error for '${text}': ${error.message}`);
    }

    // Check community translations as fallback
    if (translatedText === text && this.communityTranslations.has(targetLanguage)) {
      const communityData = this.communityTranslations.get(targetLanguage);
      if (communityData && communityData[text]) {
        translatedText = communityData[text];
        culturalNotes.push('Translation sourced from community contributions.');
      }
    }

    // Apply cultural context if provided
    if (context?.culturalContext) {
      culturalNotes.push(`Applied cultural context: ${context.culturalContext}`);
    }

    return { translatedText, culturalNotes, warnings };
  }

  public getCulturalConfig(language: string): LanguageConfig | null {
    return this.supportedLanguages.find(lang => lang.code === language) || null;
  }

  public formatDate(date: Date, language: string): string {
    const config = this.getCulturalConfig(language);
    if (!config) return date.toISOString();
    // Simplified date formatting based on config (expand with actual calendar systems)
    return date.toLocaleDateString(config.region, {
      dateStyle: 'medium',
    });
  }

  public formatCurrency(amount: number, language: string): string {
    const config = this.getCulturalConfig(language);
    if (!config) return `${amount} USD`;
    return new Intl.NumberFormat(config.region, {
      style: 'currency',
      currency: config.currency,
    }).format(amount);
  }

  public isRTL(language: string): boolean {
    const config = this.getCulturalConfig(language);
    return config ? config.rtl : false;
  }

  public getSupportedLanguages(): LanguageConfig[] {
    return [...this.supportedLanguages];
  }
}

export default new LocalizationService();
