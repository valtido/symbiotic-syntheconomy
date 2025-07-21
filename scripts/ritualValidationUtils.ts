// Utility functions for validating ritual metadata

/**
 * Validates ritual metadata against defined rules
 * @param metadata - The metadata object to validate
 * @returns true if metadata is valid, false otherwise
 */
export function validateRitualMetadata(metadata: any): boolean {
  const errors = getValidationErrors(metadata);
  return errors.length === 0;
}

/**
 * Gets validation errors for ritual metadata
 * @param metadata - The metadata object to validate
 * @returns Array of error messages, empty if valid
 */
export function getValidationErrors(metadata: any): string[] {
  const errors: string[] = [];

  // Check if metadata is an object
  if (!metadata || typeof metadata !== 'object') {
    errors.push('Metadata must be a non-null object');
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
  if (!Array.isArray(metadata.participants)) {
    errors.push('Participants must be an array');
  } else if (metadata.participants.length === 0) {
    errors.push('Participants array must not be empty');
  }

  // Validate timestamp (valid number)
  if (typeof metadata.timestamp !== 'number' || isNaN(metadata.timestamp)) {
    errors.push('Timestamp must be a valid number');
  }

  return errors;
}
