// Utility functions for validating ritual metadata

/**
 * Validates ritual metadata against defined rules
 * @param metadata - The metadata object to validate
 * @returns boolean - True if metadata is valid, false otherwise
 */
export function validateRitualMetadata(metadata: any): boolean {
  const errors = getValidationErrors(metadata);
  return errors.length === 0;
}

/**
 * Gets validation errors for ritual metadata
 * @param metadata - The metadata object to validate
 * @returns string[] - Array of error messages
 */
export function getValidationErrors(metadata: any): string[] {
  const errors: string[] = [];

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
    errors.push('Participants array cannot be empty');
  }

  // Validate timestamp (valid number)
  if (typeof metadata.timestamp !== 'number' || isNaN(metadata.timestamp)) {
    errors.push('Timestamp must be a valid number');
  }

  return errors;
}

// Example usage for testing
if (require.main === module) {
  const testMetadata = {
    name: 'Test Ritual',
    description: 'This is a test ritual description that is long enough to pass validation.',
    participants: ['user1', 'user2'],
    timestamp: Date.now()
  };

  console.log('Validation result:', validateRitualMetadata(testMetadata));
  console.log('Errors:', getValidationErrors(testMetadata));

  const invalidMetadata = {
    name: 'ab', // too short
    description: 'short', // too short
    participants: [], // empty
    timestamp: 'invalid' // not a number
  };

  console.log('Validation result (invalid):', validateRitualMetadata(invalidMetadata));
  console.log('Errors (invalid):', getValidationErrors(invalidMetadata));
}
