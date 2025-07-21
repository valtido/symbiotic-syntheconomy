// scripts/ritualValidator.ts

export interface RitualData {
  ritualId: string;
  participant: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface ValidationResult {
  isValid: boolean;
  errors?: string[];
}

export function validateRitual(data: RitualData): ValidationResult {
  const errors: string[] = [];

  if (!data.ritualId || data.ritualId.trim() === '') {
    errors.push('Missing ritualId.');
  }

  if (!/^0x[a-fA-F0-9]{40}$/.test(data.participant)) {
    errors.push('Invalid participant address.');
  }

  if (!data.timestamp || data.timestamp < 1_600_000_000) {
    errors.push('Invalid or outdated timestamp.');
  }

  return {
    isValid: errors.length === 0,
    errors: errors.length ? errors : undefined,
  };
}
