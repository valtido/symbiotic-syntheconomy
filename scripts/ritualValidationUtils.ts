// Ritual Metadata Validation Utilities

interface RitualMetadata {
  name: string;
  description: string;
  participants: string[];
  timestamp: number;
}

/**
 * Validates ritual metadata against defined rules
 * @param metadata - The metadata object to validate
 * @returns true if metadata is valid, false otherwise
 */
export function validateRitualMetadata(metadata: any): boolean {
  return getValidationErrors(metadata).length === 0;
}

/**
 * Returns an array of validation error messages for the ritual metadata
 * @param metadata - The metadata object to validate
 * @returns Array of error messages, empty if valid
 */
export function getValidationErrors(metadata: any): string[] {
  const errors: string[] = [];

  // Check if metadata is an object
  if (!metadata || typeof metadata !== 'object') {
    errors.push('Metadata must be a valid object');
    return errors;
  }

  // Validate name (3-50 characters)
  if (!metadata.name || typeof metadata.name !== 'string') {
    errors.push('Name must be a string');
  } else if (metadata.name.length < 3 || metadata.name.length > 50) {
    errors.push('Name must be between 3 and 50 characters');
  }

  // Validate description (10-500 characters)
  if (!metadata.description || typeof metadata.description !== 'string') {
    errors.push('Description must be a string');
  } else if (metadata.description.length < 10 || metadata.description.length > 500) {
    errors.push('Description must be between 10 and 500 characters');
  }

  // Validate participants (non-empty array)
  if (!metadata.participants || !Array.isArray(metadata.participants)) {
    errors.push('Participants must be an array');
  } else if (metadata.participants.length === 0) {
    errors.push('Participants array cannot be empty');
  }

  // Validate timestamp (valid number)
  if (typeof metadata.timestamp !== 'number' || isNaN(metadata.timestamp)) {
    errors.push('Timestamp must be a valid number');
  }

  return errors;
}
