// Bioregion Service for Symbiotic Syntheconomy

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
function initializeBioregions() {
  bioregions.set('bio1', {
    id: 'bio1',
    name: 'Emerald Canopy',
    description: 'A lush forest bioregion with ancient trees and diverse wildlife.',
    rituals: ['Tree Whispering', 'Rain Dance']
  });

  bioregions.set('bio2', {
    id: 'bio2',
    name: 'Crimson Desert',
    description: 'A vast desert with extreme temperatures and unique desert flora.',
    rituals: ['Sand Meditation', 'Mirage Walking']
  });

  bioregions.set('bio3', {
    id: 'bio3',
    name: 'Azure Coast',
    description: 'A coastal region with vibrant marine life and tidal ecosystems.',
    rituals: ['Wave Chanting', 'Coral Bonding']
  });
}

// Initialize bioregions on module load
initializeBioregions();

// Service functions
export class BioregionService {
  /**
   * Register a new bioregion
   * @param id Unique identifier for the bioregion
   * @param name Name of the bioregion
   * @param description Description of the bioregion
   * @returns The registered bioregion
   */
  static registerBioregion(id: string, name: string, description: string): Bioregion {
    if (bioregions.has(id)) {
      throw new Error(`Bioregion with ID ${id} already exists`);
    }

    const newBioregion: Bioregion = {
      id,
      name,
      description,
      rituals: []
    };

    bioregions.set(id, newBioregion);
    return newBioregion;
  }

  /**
   * Get a bioregion by ID
   * @param id Unique identifier for the bioregion
   * @returns The bioregion if found, otherwise null
   */
  static getBioregion(id: string): Bioregion | null {
    return bioregions.get(id) || null;
  }

  /**
   * List all bioregions
   * @returns Array of all registered bioregions
   */
  static listBioregions(): Bioregion[] {
    return Array.from(bioregions.values());
  }

  /**
   * Get rituals associated with a bioregion
   * @param id Unique identifier for the bioregion
   * @returns Array of rituals if bioregion exists, otherwise empty array
   */
  static getBioregionRituals(id: string): string[] {
    const bioregion = bioregions.get(id);
    return bioregion ? bioregion.rituals : [];
  }
}

export default BioregionService;
