// Ritual Scheduler System for Symbiotic Syntheconomy

// Types for ritual data and metadata
export interface RitualMetadata {
  description: string;
  participants: string[];
  location?: string;
  priority: 'low' | 'medium' | 'high';
}

export interface Ritual {
  id: string;
  name: string;
  startTime: Date;
  durationMinutes: number;
  metadata: RitualMetadata;
}

// Scheduler class to manage rituals
class RitualScheduler {
  private rituals: Ritual[] = [];

  // Schedule a new ritual with conflict checking
  scheduleRitual(ritual: Ritual): { success: boolean; message: string } {
    if (this.hasConflict(ritual)) {
      return {
        success: false,
        message: `Conflict detected for ritual '${ritual.name}' at ${ritual.startTime.toISOString()}`
      };
    }

    this.rituals.push(ritual);
    return {
      success: true,
      message: `Ritual '${ritual.name}' scheduled successfully for ${ritual.startTime.toISOString()}`
    };
  }

  // Reschedule an existing ritual
  rescheduleRitual(ritualId: string, newStartTime: Date): { success: boolean; message: string } {
    const ritualIndex = this.rituals.findIndex(r => r.id === ritualId);
    if (ritualIndex === -1) {
      return {
        success: false,
        message: `Ritual with ID '${ritualId}' not found`
      };
    }

    const updatedRitual = { ...this.rituals[ritualIndex], startTime: newStartTime };
    if (this.hasConflict(updatedRitual, ritualId)) {
      return {
        success: false,
        message: `Conflict detected for new time ${newStartTime.toISOString()}`
      };
    }

    this.rituals[ritualIndex] = updatedRitual;
    return {
      success: true,
      message: `Ritual '${updatedRitual.name}' rescheduled to ${newStartTime.toISOString()}`
    };
  }

  // Cancel a ritual
  cancelRitual(ritualId: string): { success: boolean; message: string } {
    const ritualIndex = this.rituals.findIndex(r => r.id === ritualId);
    if (ritualIndex === -1) {
      return {
        success: false,
        message: `Ritual with ID '${ritualId}' not found`
      };
    }

    const ritualName = this.rituals[ritualIndex].name;
    this.rituals.splice(ritualIndex, 1);
    return {
      success: true,
      message: `Ritual '${ritualName}' with ID '${ritualId}' canceled successfully`
    };
  }

  // Check for scheduling conflicts
  private hasConflict(newRitual: Ritual, excludeId?: string): boolean {
    const newStart = newRitual.startTime.getTime();
    const newEnd = newStart + newRitual.durationMinutes * 60 * 1000;

    return this.rituals.some(ritual => {
      if (excludeId && ritual.id === excludeId) return false;

      const existingStart = ritual.startTime.getTime();
      const existingEnd = existingStart + ritual.durationMinutes * 60 * 1000;

      return newStart < existingEnd && newEnd > existingStart;
    });
  }

  // Get all scheduled rituals
  getScheduledRituals(): Ritual[] {
    return [...this.rituals].sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  }

  // Get rituals by participant
  getRitualsByParticipant(participant: string): Ritual[] {
    return this.rituals
      .filter(ritual => ritual.metadata.participants.includes(participant))
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  }
}

// Example usage and testing
async function testRitualScheduler() {
  const scheduler = new RitualScheduler();

  // Test ritual 1
  const ritual1: Ritual = {
    id: 'r1',
    name: 'Morning Invocation',
    startTime: new Date('2023-12-01T08:00:00Z'),
    durationMinutes: 60,
    metadata: {
      description: 'Daily morning ritual',
      participants: ['Alice', 'Bob'],
      priority: 'high'
    }
  };

  // Test ritual 2 (conflict)
  const ritual2: Ritual = {
    id: 'r2',
    name: 'Midday Ceremony',
    startTime: new Date('2023-12-01T08:30:00Z'),
    durationMinutes: 60,
    metadata: {
      description: 'Midday gathering',
      participants: ['Alice'],
      priority: 'medium'
    }
  };

  // Test ritual 3 (no conflict)
  const ritual3: Ritual = {
    id: 'r3',
    name: 'Evening Ritual',
    startTime: new Date('2023-12-01T18:00:00Z'),
    durationMinutes: 90,
    metadata: {
      description: 'Evening closure',
      participants: ['Bob'],
      priority: 'low'
    }
  };

  console.log(scheduler.scheduleRitual(ritual1));
  console.log(scheduler.scheduleRitual(ritual2)); // Should show conflict
  console.log(scheduler.scheduleRitual(ritual3));
  console.log('Scheduled Rituals:', scheduler.getScheduledRituals());
  console.log('Alice\'s Rituals:', scheduler.getRitualsByParticipant('Alice'));
  console.log(scheduler.rescheduleRitual('r1', new Date('2023-12-01T09:00:00Z')));
  console.log(scheduler.cancelRitual('r3'));
  console.log('Final Scheduled Rituals:', scheduler.getScheduledRituals());
}

// Run test if script is executed directly
if (require.main === module) {
  testRitualScheduler().catch(console.error);
}

export { RitualScheduler, Ritual, RitualMetadata };
