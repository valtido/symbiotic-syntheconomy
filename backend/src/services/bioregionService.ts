// Bioregion Service for managing bioregion data

// Types for bioregion data structure
export interface Bioregion {
  id: string;
  name: string;
  description: string;
  rituals: string[];
}

// In-memory storage for bioregions (replace with database in production)
const bioregions: Map<string, Bioregion> = new Map();

// Initialize with 3 default bioregions for simulation
bioregions.set('bio1', {
  id: 'bio1',
  name: 'Northern Forest',
  description: 'A vast temperate forest with rich biodiversity and seasonal cycles.',
  rituals: ['Spring Renewal', 'Harvest Moon Ceremony']
});

bioregions.set('bio2', {
  id: 'bio2',
  name: 'Coastal Wetlands',
  description: 'A dynamic ecosystem of marshes and estuaries supporting migratory birds.',
  rituals: ['Tide Cleansing', 'Bird Migration Welcome']
});

bioregions.set('bio3', {
  id: 'bio3',
  name: 'Mountain Highlands',
  description: 'Rugged peaks with unique alpine flora and ancient cultural significance.',
  rituals: ['Summit Offering', 'Winter Solstice Fire']
});

// Service class for bioregion operations
export class BioregionService {
  /**
   * Registers a new bioregion
   * @param id Unique identifier for the bioregion
   * @param name Name of the bioregion
   * @param description Description of the bioregion
   * @returns The registered bioregion
   */
  static registerBioregion(id: string, name: string, description: string): Bioregion {
    if (bioregions.has(id)) {
      throw new Error(`Bioregion with ID ${id} already exists`);
    }
    const bioregion: Bioregion = {
      id,
      name,
      description,
      rituals: []
    };
    bioregions.set(id, bioregion);
    return bioregion;
  }

  /**
   * Retrieves a bioregion by ID
   * @param id Unique identifier for the bioregion
   * @returns The bioregion if found, otherwise throws an error
   */
  static getBioregion(id: string): Bioregion {
    const bioregion = bioregions.get(id);
    if (!bioregion) {
      throw new Error(`Bioregion with ID ${id} not found`);
    }
    return bioregion;
  }

  /**
   * Lists all registered bioregions
   * @returns Array of all bioregions
   */
  static listBioregions(): Bioregion[] {
    return Array.from(bioregions.values());
  }

  /**
   * Retrieves rituals associated with a bioregion
   * @param id Unique identifier for the bioregion
   * @returns Array of ritual names
   */
  static getBioregionRituals(id: string): string[] {
    const bioregion = bioregions.get(id);
    if (!bioregion) {
      throw new Error(`Bioregion with ID ${id} not found`);
    }
    return bioregion.rituals;
  }
}

export default BioregionService;
