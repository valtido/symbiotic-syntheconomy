import { writeFileSync, readFileSync } from 'fs';
import { parse as csvParse, stringify as csvStringify } from 'csv-parse/sync';
import { parseString, Builder } from 'xml2js';
import { promisify } from 'util';

// Ritual data interface
interface RitualData {
  id: string;
  name: string;
  description: string;
  participants: string[];
  date: string;
  metadata?: Record<string, any>;
}

// Validation result interface
interface ValidationResult {
  isValid: boolean;
  errors?: string[];
}

// Utility class for managing ritual data export/import
class RitualDataManager {
  private data: RitualData[] = [];

  constructor(initialData: RitualData[] = []) {
    this.data = initialData;
  }

  // Validate ritual data structure
  validateData(data: RitualData[]): ValidationResult {
    const errors: string[] = [];

    data.forEach((ritual, index) => {
      if (!ritual.id) errors.push(`Ritual at index ${index} missing id`);
      if (!ritual.name) errors.push(`Ritual at index ${index} missing name`);
      if (!ritual.date) errors.push(`Ritual at index ${index} missing date`);
      if (!Array.isArray(ritual.participants)) 
        errors.push(`Ritual at index ${index} has invalid participants`);
    });

    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  // Transform data before export (e.g., format dates)
  private transformForExport(data: RitualData[]): RitualData[] {
    return data.map(ritual => ({
      ...ritual,
      date: new Date(ritual.date).toISOString()
    }));
  }

  // Transform data after import (e.g., parse dates)
  private transformAfterImport(data: RitualData[]): RitualData[] {
    return data.map(ritual => ({
      ...ritual,
      date: ritual.date
    }));
  }

  // Export to JSON
  exportToJson(filePath: string): void {
    const transformedData = this.transformForExport(this.data);
    writeFileSync(filePath, JSON.stringify(transformedData, null, 2), 'utf-8');
    console.log(`Data exported to JSON at ${filePath}`);
  }

  // Import from JSON
  importFromJson(filePath: string): void {
    const rawData = readFileSync(filePath, 'utf-8');
    const importedData = JSON.parse(rawData) as RitualData[];
    const validation = this.validateData(importedData);
    if (!validation.isValid) {
      throw new Error(`Invalid data format: ${validation.errors?.join(', ')}`);
    }
    this.data = this.transformAfterImport(importedData);
    console.log(`Data imported from JSON at ${filePath}`);
  }

  // Export to CSV
  exportToCsv(filePath: string): void {
    const transformedData = this.transformForExport(this.data);
    const csv = csvStringify(transformedData, { header: true });
    writeFileSync(filePath, csv, 'utf-8');
    console.log(`Data exported to CSV at ${filePath}`);
  }

  // Import from CSV
  importFromCsv(filePath: string): void {
    const rawData = readFileSync(filePath, 'utf-8');
    const importedData = csvParse(rawData, { columns: true, skip_empty_lines: true }) as RitualData[];
    const processedData = importedData.map(item => ({
      ...item,
      participants: item.participants.split(',').map(p => p.trim())
    }));
    const validation = this.validateData(processedData);
    if (!validation.isValid) {
      throw new Error(`Invalid data format: ${validation.errors?.join(', ')}`);
    }
    this.data = this.transformAfterImport(processedData);
    console.log(`Data imported from CSV at ${filePath}`);
  }

  // Export to XML
  exportToXml(filePath: string): void {
    const transformedData = this.transformForExport(this.data);
    const xmlBuilder = new Builder();
    const xml = xmlBuilder.buildObject({ rituals: { ritual: transformedData } });
    writeFileSync(filePath, xml, 'utf-8');
    console.log(`Data exported to XML at ${filePath}`);
  }

  // Import from XML
  async importFromXml(filePath: string): Promise<void> {
    const rawData = readFileSync(filePath, 'utf-8');
    const parseStringAsync = promisify(parseString);
    const result = await parseStringAsync(rawData);
    const importedData = result.rituals.ritual as RitualData[];
    const validation = this.validateData(importedData);
    if (!validation.isValid) {
      throw new Error(`Invalid data format: ${validation.errors?.join(', ')}`);
    }
    this.data = this.transformAfterImport(importedData);
    console.log(`Data imported from XML at ${filePath}`);
  }

  // Get current data
  getData(): RitualData[] {
    return this.data;
  }
}

// Example usage
export async function runExample() {
  const sampleData: RitualData[] = [
    {
      id: 'ritual1',
      name: 'Moon Ceremony',
      description: 'A ceremony under the full moon',
      participants: ['Alice', 'Bob'],
      date: new Date().toISOString(),
      metadata: { location: 'Forest' }
    }
  ];

  const manager = new RitualDataManager(sampleData);

  // Export to different formats
  manager.exportToJson('rituals.json');
  manager.exportToCsv('rituals.csv');
  manager.exportToXml('rituals.xml');

  // Import from different formats
  const jsonManager = new RitualDataManager();
  jsonManager.importFromJson('rituals.json');
  console.log('JSON Data:', jsonManager.getData());

  const csvManager = new RitualDataManager();
  csvManager.importFromCsv('rituals.csv');
  console.log('CSV Data:', csvManager.getData());

  const xmlManager = new RitualDataManager();
  await xmlManager.importFromXml('rituals.xml');
  console.log('XML Data:', xmlManager.getData());
}

// Run example if script is executed directly
if (require.main === module) {
  runExample().catch(console.error);
}
