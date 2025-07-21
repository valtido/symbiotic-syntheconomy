// Cultural Expression Detection Algorithm (CEDA) Filter
// Purpose: Detect cultural references and expressions in text content

interface CulturalReference {
  term: string;
  category: 'keyword' | 'practice' | 'indigenous' | 'context';
}

interface CEDAResult {
  approved: boolean;
  count: number;
  references: CulturalReference[];
}

// Predefined cultural data (expandable)
const culturalData = {
  keywords: ['festival', 'tradition', 'heritage', 'ritual', 'custom'],
  practices: ['dance', 'ceremony', 'wedding', 'funeral', 'harvest'],
  indigenousTerms: ['totem', 'dreamtime', 'powwow', 'haka', 'marae'],
  contextWords: ['ancestral', 'tribal', 'folk', 'native', 'cultural']
};

/**
 * Analyzes text for cultural expressions and references
 * @param text The input text to analyze
 * @returns CEDAResult containing approval status, count, and identified references
 */
export function analyzeCulturalContent(text: string): CEDAResult {
  const references: CulturalReference[] = [];
  const words = text.toLowerCase().split(/\s+/);

  // Helper function to check and add references
  const checkCategory = (category: keyof typeof culturalData, type: CulturalReference['category']) => {
    culturalData[category].forEach(term => {
      if (words.includes(term.toLowerCase())) {
        references.push({ term, category: type });
      }
    });
  };

  // Check all categories
  checkCategory('keywords', 'keyword');
  checkCategory('practices', 'practice');
  checkCategory('indigenousTerms', 'indigenous');
  checkCategory('contextWords', 'context');

  const count = references.length;
  const approved = count >= 2;

  return {
    approved,
    count,
    references
  };
}

// Example usage and testing
if (require.main === module) {
  const testText = "The festival included a traditional haka performance.";
  const result = analyzeCulturalContent(testText);
  console.log('CEDA Analysis Result:', result);
}
