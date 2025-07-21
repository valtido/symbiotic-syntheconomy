// TypeScript code for Ritual Scheduler System

interface Ritual {
  id: string;
  name: string;
  startTime: Date;
  durationMinutes: number;
  metadata: Record<string, any>;
  endTime?: Date;
}

class RitualScheduler {
  private rituals: Ritual[] = [];

  constructor() {
    console.log('Ritual Scheduler initialized');
  }

  /**
   * Schedule a new ritual
   * @param name Name of the ritual
   * @param startTime Start time of the ritual
   * @param durationMinutes Duration of the ritual in minutes
   * @param metadata Additional metadata for the ritual
   * @returns The scheduled ritual or error if there's a conflict
   */
  scheduleRitual(
    name: string,
    startTime: Date,
    durationMinutes: number,
    metadata: Record<string, any> = {}
  ): Ritual | Error {
    const endTime = new Date(startTime.getTime() + durationMinutes * 60000);
    const id = this.generateId();

    // Check for conflicts
    if (this.hasConflict(startTime, endTime)) {
      return new Error(`Scheduling conflict for ritual '${name}' at ${startTime}`);
    }

    const ritual: Ritual = {
      id,
      name,
      startTime,
      durationMinutes,
      endTime,
      metadata,
    };

    this.rituals.push(ritual);
    this.sortRituals();
    console.log(`Scheduled ritual: ${name} at ${startTime}`);
    return ritual;
  }

  /**
   * Reschedule an existing ritual
   * @param id ID of the ritual to reschedule
   * @param newStartTime New start time for the ritual
   * @returns Updated ritual or error if not found or conflict exists
   */
  rescheduleRitual(id: string, newStartTime: Date): Ritual | Error {
    const ritualIndex = this.rituals.findIndex((r) => r.id === id);
    if (ritualIndex === -1) {
      return new Error(`Ritual with ID ${id} not found`);
    }

    const ritual = this.rituals[ritualIndex];
    const newEndTime = new Date(newStartTime.getTime() + ritual.durationMinutes * 60000);

    // Temporarily remove the ritual for conflict check
    const tempRituals = [...this.rituals];
    tempRituals.splice(ritualIndex, 1);

    if (this.hasConflict(newStartTime, newEndTime, tempRituals)) {
      return new Error(`Rescheduling conflict for ritual '${ritual.name}' at ${newStartTime}`);
    }

    ritual.startTime = newStartTime;
    ritual.endTime = newEndTime;
    this.sortRituals();
    console.log(`Rescheduled ritual: ${ritual.name} to ${newStartTime}`);
    return ritual;
  }

  /**
   * Cancel a ritual
   * @param id ID of the ritual to cancel
   * @returns True if canceled, Error if not found
   */
  cancelRitual(id: string): boolean | Error {
    const ritualIndex = this.rituals.findIndex((r) => r.id === id);
    if (ritualIndex === -1) {
      return new Error(`Ritual with ID ${id} not found`);
    }

    const ritual = this.rituals[ritualIndex];
    this.rituals.splice(ritualIndex, 1);
    console.log(`Canceled ritual: ${ritual.name}`);
    return true;
  }

  /**
   * Get all scheduled rituals
   * @returns Array of scheduled rituals
   */
  getRituals(): Ritual[] {
    return [...this.rituals];
  }

  /**
   * Check for scheduling conflicts
   * @param startTime Start time to check
   * @param endTime End time to check
   * @param rituals Optional array of rituals to check against
   * @returns True if there is a conflict
   */
  private hasConflict(startTime: Date, endTime: Date, rituals: Ritual[] = this.rituals): boolean {
    return rituals.some((ritual) => {
      const rStart = ritual.startTime;
      const rEnd = ritual.endTime as Date;
      return startTime < rEnd && endTime > rStart;
    });
  }

  /**
   * Sort rituals by start time
   */
  private sortRituals(): void {
    this.rituals.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  }

  /**
   * Generate a unique ID for a ritual
   * @returns Unique ID string
   */
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}

// Example usage
if (require.main === module) {
  const scheduler = new RitualScheduler();

  // Schedule some rituals
  const ritual1 = scheduler.scheduleRitual(
    'Morning Meditation',
    new Date('2023-10-01T08:00:00'),
    30,
    { location: 'Garden' }
  );

  const ritual2 = scheduler.scheduleRitual(
    'Evening Yoga',
    new Date('2023-10-01T18:00:00'),
    60,
    { instructor: 'Maya' }
  );

  // Test conflict
  const conflictRitual = scheduler.scheduleRitual(
    'Conflict Test',
    new Date('2023-10-01T08:15:00'),
    30
  );

  console.log('All rituals:', scheduler.getRituals());

  // Test rescheduling
  if (ritual1 instanceof Object && 'id' in ritual1) {
    scheduler.rescheduleRitual(ritual1.id, new Date('2023-10-01T09:00:00'));
    console.log('After reschedule:', scheduler.getRituals());
  }

  // Test cancellation
  if (ritual2 instanceof Object && 'id' in ritual2) {
    scheduler.cancelRitual(ritual2.id);
    console.log('After cancellation:', scheduler.getRituals());
  }
}

export default RitualScheduler;
