// Ritual Scheduler System for Symbiotic Syntheconomy

interface Ritual {
  id: string;
  name: string;
  startTime: Date;
  duration: number; // in minutes
  metadata: Record<string, any>;
  participants?: string[];
}

class RitualScheduler {
  private rituals: Ritual[] = [];

  // Schedule a new ritual
  scheduleRitual(
    name: string,
    startTime: Date,
    duration: number,
    metadata: Record<string, any> = {},
    participants: string[] = []
  ): Ritual {
    const id = this.generateId();
    const endTime = new Date(startTime.getTime() + duration * 60000);

    // Check for conflicts
    if (this.hasConflict(startTime, endTime)) {
      throw new Error(`Scheduling conflict detected for ritual: ${name}`);
    }

    const ritual: Ritual = {
      id,
      name,
      startTime,
      duration,
      metadata,
      participants,
    };

    this.rituals.push(ritual);
    this.sortRituals();
    console.log(`Ritual scheduled: ${name} at ${startTime.toISOString()}`);
    return ritual;
  }

  // Reschedule an existing ritual
  rescheduleRitual(
    ritualId: string,
    newStartTime: Date,
    newDuration?: number
  ): Ritual | null {
    const ritual = this.rituals.find((r) => r.id === ritualId);
    if (!ritual) {
      throw new Error(`Ritual not found: ${ritualId}`);
    }

    const endTime = new Date(
      newStartTime.getTime() + (newDuration || ritual.duration) * 60000
    );

    // Check for conflicts excluding the current ritual
    if (this.hasConflict(startTime, endTime, ritualId)) {
      throw new Error(`Rescheduling conflict detected for ritual: ${ritual.name}`);
    }

    ritual.startTime = newStartTime;
    if (newDuration) {
      ritual.duration = newDuration;
    }

    this.sortRituals();
    console.log(`Ritual rescheduled: ${ritual.name} to ${newStartTime.toISOString()}`);
    return ritual;
  }

  // Cancel a ritual
  cancelRitual(ritualId: string): boolean {
    const index = this.rituals.findIndex((r) => r.id === ritualId);
    if (index === -1) {
      throw new Error(`Ritual not found: ${ritualId}`);
    }

    const ritual = this.rituals[index];
    this.rituals.splice(index, 1);
    console.log(`Ritual canceled: ${ritual.name}`);
    return true;
  }

  // Get all scheduled rituals
  getRituals(): Ritual[] {
    return [...this.rituals];
  }

  // Get rituals for a specific participant
  getRitualsByParticipant(participant: string): Ritual[] {
    return this.rituals.filter((r) =>
      r.participants && r.participants.includes(participant)
    );
  }

  // Check if a time slot has conflicts
  private hasConflict(startTime: Date, endTime: Date, excludeId?: string): boolean {
    return this.rituals.some((ritual) => {
      if (excludeId && ritual.id === excludeId) return false;

      const ritualEnd = new Date(ritual.startTime.getTime() + ritual.duration * 60000);
      return (
        (startTime >= ritual.startTime && startTime < ritualEnd) ||
        (endTime > ritual.startTime && endTime <= ritualEnd) ||
        (startTime <= ritual.startTime && endTime >= ritualEnd)
      );
    });
  }

  // Sort rituals by start time
  private sortRituals(): void {
    this.rituals.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  }

  // Generate unique ID for rituals
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}

// Example usage
const scheduler = new RitualScheduler();

try {
  // Schedule some rituals
  const ritual1 = scheduler.scheduleRitual(
    'Morning Meditation',
    new Date('2023-12-01T08:00:00Z'),
    30,
    { location: 'Garden' },
    ['Alice', 'Bob']
  );

  const ritual2 = scheduler.scheduleRitual(
    'Evening Ceremony',
    new Date('2023-12-01T18:00:00Z'),
    60,
    { theme: 'Harvest' },
    ['Alice', 'Charlie']
  );

  // Log scheduled rituals
  console.log('Scheduled Rituals:', scheduler.getRituals());

  // Get rituals for Alice
  console.log('Alice\'s Rituals:', scheduler.getRitualsByParticipant('Alice'));

  // Reschedule ritual1
  scheduler.rescheduleRitual(ritual1.id, new Date('2023-12-01T09:00:00Z'));

  // Cancel ritual2
  scheduler.cancelRitual(ritual2.id);

  // Log updated rituals
  console.log('Updated Rituals:', scheduler.getRituals());
} catch (error) {
  console.error('Error:', error.message);
}

export default RitualScheduler;
