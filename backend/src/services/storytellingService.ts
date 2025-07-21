// storytellingService.ts

import { injectable } from 'inversify';
import { Narrative, RitualStory } from '../models/storytellingModel';

@injectable()
export class StorytellingService {
  private readonly culturalTemplates: Record<string, string[]> = {
    ancient: [
      'In the age of {deity}, the people of {place} gathered under the {celestialBody} to honor the {element}.',
      'Legend speaks of {hero}, who ventured into the {forbiddenPlace} to retrieve the {sacredArtifact}.',
      'Every {timeCycle}, the {tribe} performs the {ritualName}, a dance of {emotion} and {element}.'
    ],
    futuristic: [
      'In the year {year}, the citizens of {place} connect their neural implants for the {ritualName}.',
      'The AI {deity} commands a pilgrimage to the {forbiddenPlace} to restore the {sacredArtifact}.',
      'Under the glow of {celestialBody}, the {tribe} reboots their systems in a ceremony of {emotion}.'
    ],
    mystical: [
      'Beneath the veil of {celestialBody}, the {tribe} summons the spirit of {deity} with {ritualName}.',
      'The {hero} must cross the {forbiddenPlace}, guided by the whispers of the {sacredArtifact}.',
      'During the {timeCycle}, a surge of {element} awakens the {emotion} within the people of {place}.'
    ]
  };

  private readonly placeholders: Record<string, string[]> = {
    deity: ['Aetherion', 'Zylara', 'Kronath', 'Neuromax', 'Etheris'],
    place: ['Eldergrove', 'Neonspire', 'Shadowvale', 'Cryonexus', 'Mistralis'],
    celestialBody: ['Crimson Moon', 'Binary Stars', 'Obsidian Sun', 'Aurora Veil', 'Eclipse Ring'],
    element: ['Fire', 'Water', 'Earth', 'Air', 'Code'],
    hero: ['Kaelen', 'Zypher', 'Aeloria', 'Technosage', 'Mystara'],
    forbiddenPlace: ['Abyssal Chasm', 'Quantum Rift', 'Haunted Grid', 'Void Nexus', 'Silent Forest'],
    sacredArtifact: ['Crystal of Aeons', 'Data Shard', 'Rune of Storms', 'Neural Core', 'Eldritch Tome'],
    timeCycle: ['Solstice', 'Equinox', 'Harvest Cycle', 'System Reset', 'Astral Alignment'],
    tribe: ['Skyborn', 'Datastreamers', 'Shadowkin', 'Ironclad', 'Mistwalkers'],
    ritualName: ['Rite of Embers', 'Sync Protocol', 'Dance of Veils', 'Circuit Binding', 'Echo Summoning'],
    emotion: ['Hope', 'Fear', 'Unity', 'Despair', 'Wonder'],
    year: ['3025', '4050', '2789', '5000', '3120']
  };

  /**
   * Generates a ritual narrative based on a cultural theme.
   * @param theme Cultural theme for the story (ancient, futuristic, mystical).
   * @returns A generated RitualStory object.
   */
  public generateRitualStory(theme: string): RitualStory {
    const selectedTheme = this.culturalTemplates[theme] || this.culturalTemplates['ancient'];
    const template = this.getRandomElement(selectedTheme);

    let narrative = template;
    for (const [key, values] of Object.entries(this.placeholders)) {
      const placeholder = `{${key}}`;
      const replacement = this.getRandomElement(values);
      narrative = narrative.replace(placeholder, replacement);
    }

    return {
      theme,
      title: this.generateTitle(narrative),
      content: narrative,
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Generates a longer narrative combining multiple ritual stories.
   * @param themes Array of cultural themes to combine.
   * @param length Approximate length of the narrative (short, medium, long).
   * @returns A generated Narrative object.
   */
  public generateNarrative(themes: string[], length: 'short' | 'medium' | 'long' = 'medium'): Narrative {
    const storyCount = this.getStoryCount(length);
    const stories: RitualStory[] = [];

    for (let i = 0; i < storyCount; i++) {
      const theme = themes[i % themes.length];
      stories.push(this.generateRitualStory(theme));
    }

    const combinedContent = stories.map(s => s.content).join(' ');
    return {
      title: `Epic of the ${this.getRandomElement(this.placeholders.tribe)}`,
      content: combinedContent,
      themes,
      createdAt: new Date().toISOString()
    };
  }

  private getRandomElement<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }

  private getStoryCount(length: string): number {
    switch (length) {
      case 'short': return 2;
      case 'medium': return 5;
      case 'long': return 8;
      default: return 5;
    }
  }

  private generateTitle(content: string): string {
    const words = content.split(' ');
    const keyPhrase = words.slice(3, 6).join(' ');
    return `The Tale of ${keyPhrase}`;
  }
}
