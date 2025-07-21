// scripts/ritualValidationUtils.ts

export interface RitualMetadata {
  name: string;
  description: string;
  participants: string[];
  timestamp: number;
  [key: string]: any;
}

export function validateRitualMetadata(metadata: any): boolean {
  if (!metadata.name || metadata.name.length < 3 || metadata.name.length > 50) {
    return false;
  }
  if (!metadata.description || metadata.description.length < 10 || metadata.description.length > 500) {
    return false;
  }
  if (!Array.isArray(metadata.participants) || metadata.participants.length === 0) {
    return false;
  }
  if (!metadata.timestamp || isNaN(metadata.timestamp)) {
    return false;
  }
  return true;
}

export function getValidationErrors(metadata: any): string[] {
  const errors = [];
  if (!metadata.name || metadata.name.length < 3 || metadata.name.length > 50) {
    errors.push('Name must be 3-50 characters');
  }
  if (!metadata.description || metadata.description.length < 10 || metadata.description.length > 500) {
    errors.push('Description must be 10-500 characters');
  }
  if (!Array.isArray(metadata.participants) || metadata.participants.length === 0) {
    errors.push('Participants must be a non-empty array');
  }
  if (!metadata.timestamp || isNaN(metadata.timestamp)) {
    errors.push('Timestamp must be a valid number');
  }
  return errors;
}