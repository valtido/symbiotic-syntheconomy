// grcParser.ts - Utility to parse and validate .grc files for Symbiotic Syntheconomy

import * as fs from 'fs';
import * as path from 'path';

// Define the expected structure of a parsed GRC file
interface GrcData {
  ritualName: string;
  bioregionId: string;
  description: string;
  culturalContext: string;
  [key: string]: any; // Allow additional fields
}

// Define the structure for validation results
interface ValidationResult {
  isValid: boolean;
  data?: GrcData;
  errors: string[];
}

// Constants for validation rules
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
const REQUIRED_FIELDS = ['ritualName', 'bioregionId', 'description', 'culturalContext'] as const;

/**
 * Parses and validates a .grc file
 * @param filePath - Path to the .grc file
 * @returns ValidationResult with parsed data or errors
 */
export function parseAndValidateGrcFile(filePath: string): ValidationResult {
  const result: ValidationResult = {
    isValid: false,
    errors: [],
  };

  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      result.errors.push(`File not found: ${filePath}`);
      return result;
    }

    // Check file extension
    if (path.extname(filePath).toLowerCase() !== '.grc') {
      result.errors.push('Invalid file extension. Expected .grc');
      return result;
    }

    // Check file size
    const stats = fs.statSync(filePath);
    if (stats.size > MAX_FILE_SIZE) {
      result.errors.push(`File size exceeds maximum limit of 10MB`);
      return result;
    }

    // Read file content (assuming UTF-8 encoding)
    const content = fs.readFileSync(filePath, 'utf-8');

    // Basic parsing logic (assuming .grc is a key-value format or JSON-like)
    // This can be customized based on the actual .grc file format
    let parsedData: GrcData;
    try {
      // For demonstration, assuming .grc content is JSON
      parsedData = JSON.parse(content);
    } catch (parseError) {
      result.errors.push(`Failed to parse file content: ${parseError.message}`);
      return result;
    }

    // Validate required fields
    const missingFields = REQUIRED_FIELDS.filter(field => !parsedData[field] || typeof parsedData[field] !== 'string');
    if (missingFields.length > 0) {
      result.errors.push(`Missing or invalid required fields: ${missingFields.join(', ')}`);
      return result;
    }

    // If all validations pass
    result.isValid = true;
    result.data = parsedData;
    return result;

  } catch (error) {
    result.errors.push(`Unexpected error: ${error.message}`);
    return result;
  }
}

/**
 * Utility to validate GRC data object directly
 * @param data - Object to validate
 * @returns ValidationResult with errors if any
 */
export function validateGrcData(data: any): ValidationResult {
  const result: ValidationResult = {
    isValid: false,
    errors: [],
  };

  if (!data || typeof data !== 'object') {
    result.errors.push('Invalid data format. Expected an object.');
    return result;
  }

  const missingFields = REQUIRED_FIELDS.filter(field => !data[field] || typeof data[field] !== 'string');
  if (missingFields.length > 0) {
    result.errors.push(`Missing or invalid required fields: ${missingFields.join(', ')}`);
    return result;
  }

  result.isValid = true;
  result.data = data as GrcData;
  return result;
}
