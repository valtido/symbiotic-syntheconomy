// Ritual Scheduler System for Symbiotic Syntheconomy

interface Ritual {
  id: string;
  name: string;
  startTime: Date;
  durationMinutes: number;
  metadata: Record<string, any>;
  status: 'scheduled' | 'ongoing' | 'completed' | 'canceled';
}

class RitualScheduler {
  private rituals: Ritual[] = [];
  private readonly conflictThresholdMinutes: number = 15; // Buffer time between rituals

  /**
   * Schedules a new ritual with the provided details.
   * @returns true if scheduled successfully, false if there's a conflict
   */
  scheduleRitual(
    name: string,
    startTime: Date,
    durationMinutes: number,
    metadata: Record<string, any> = {}
  ): boolean {
    const endTime = new Date(startTime.getTime() + durationMinutes * 60000);

    // Check for conflicts with existing rituals
    const hasConflict = this.rituals.some(ritual => {
      if (ritual.status === 'canceled' || ritual.status === 'completed') return false;

      const ritualStart = ritual.startTime;
      const ritualEnd = new Date(ritual.startTime.getTime() + ritual.durationMinutes * 60000);
      const bufferMs = this.conflictThresholdMinutes * 60000;

      return (
        (startTime.getTime() >= ritualStart.getTime() - bufferMs && 
         startTime.getTime() <= ritualEnd.getTime() + bufferMs) ||
        (endTime.getTime() >= ritualStart.getTime() - bufferMs && 
         endTime.getTime() <= ritualEnd.getTime() + bufferMs) ||
        (startTime.getTime() <= ritualStart.getTime() && 
         endTime.getTime() >= ritualEnd.getTime())
      );
    });

    if (hasConflict) {
      console.warn(`Conflict detected for ritual: ${name} at ${startTime.toISOString()}`);
      return false;
    }

    const newRitual: Ritual = {
      id: this.generateId(),
      name,
      startTime,
      durationMinutes,
      metadata,
      status: 'scheduled',
    };

    this.rituals.push(newRitual);
    console.log(`Ritual scheduled: ${name} at ${startTime.toISOString()}`);
    return true;
  }

  /**
   * Reschedules an existing ritual to a new time.
   * @returns true if rescheduled successfully, false if there's a conflict or ritual not found
   */
  rescheduleRitual(ritualId: string, newStartTime: Date): boolean {
    const ritualIndex = this.rituals.findIndex(r => r.id === ritualId);
    if (ritualIndex === -1) {
      console.warn(`Ritual not found: ${ritualId}`);
      return false;
    }

    const ritual = this.rituals[ritualIndex];
    if (ritual.status === 'canceled' || ritual.status === 'completed') {
      console.warn(`Cannot reschedule ritual in status: ${ritual.status}`);
      return false;
    }

    // Temporarily remove the ritual for conflict check
    const tempRituals = [...this.rituals];
    tempRituals.splice(ritualIndex, 1);

    const endTime = new Date(newStartTime.getTime() + ritual.durationMinutes * 60000);
    const hasConflict = tempRituals.some(other => {
      if (other.status === 'canceled' || other.status === 'completed') return false;

      const otherStart = other.startTime;
      const otherEnd = new Date(other.startTime.getTime() + other.durationMinutes * 60000);
      const bufferMs = this.conflictThresholdMinutes * 60000;

      return (
        (newStartTime.getTime() >= otherStart.getTime() - bufferMs && 
         newStartTime.getTime() <= otherEnd.getTime() + bufferMs) ||
        (endTime.getTime() >= otherStart.getTime() - bufferMs && 
         endTime.getTime() <= otherEnd.getTime() + bufferMs) ||
        (newStartTime.getTime() <= otherStart.getTime() && 
         endTime.getTime() >= otherEnd.getTime())
      );
    });

    if (hasConflict) {
      console.warn(`Conflict detected for rescheduling ritual: ${ritual.name} at ${newStartTime.toISOString()}`);
      return false;
    }

    ritual.startTime = newStartTime;
    ritual.status = 'scheduled';
    console.log(`Ritual rescheduled: ${ritual.name} to ${newStartTime.toISOString()}`);
    return true;
  }

  /**
   * Cancels a ritual by ID.
   * @returns true if canceled successfully, false if not found or already completed/canceled
   */
  cancelRitual(ritualId: string): boolean {
    const ritual = this.rituals.find(r => r.id === ritualId);
    if (!ritual) {
      console.warn(`Ritual not found: ${ritualId}`);
      return false;
    }

    if (ritual.status === 'canceled' || ritual.status === 'completed') {
      console.warn(`Ritual already in status: ${ritual.status}`);
      return false;
    }

    ritual.status = 'canceled';
    console.log(`Ritual canceled: ${ritual.name}`);
    return true;
  }

  /**
   * Updates ritual status based on current time.
   */
  updateStatuses(): void {
    const now = new Date();
    this.rituals.forEach(ritual => {
      const endTime = new Date(ritual.startTime.getTime() + ritual.durationMinutes * 60000);
      if (ritual.status === 'scheduled' && now >= ritual.startTime) {
        ritual.status = 'ongoing';
        console.log(`Ritual started: ${ritual.name}`);
      }
      if (ritual.status === 'ongoing' && now >= endTime) {
        ritual.status = 'completed';
        console.log(`Ritual completed: ${ritual.name}`);
      }
    });
  }

  /**
   * Gets all rituals, optionally filtered by status.
   */
  getRituals(status?: Ritual['status']): Ritual[] {
    return status ? this.rituals.filter(r => r.status === status) : [...this.rituals];
  }

  /**
   * Generates a unique ID for a ritual.
   */
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }
}

// Example usage
export const scheduler = new RitualScheduler();

// Schedule some example rituals for testing
if (require.main === module) {
  const now = new Date();
  const inOneHour = new Date(now.getTime() + 60 * 60000);
  const inTwoHours = new Date(now.getTime() + 120 * 60000);

  console.log('Scheduling test rituals...');
  scheduler.scheduleRitual('Morning Meditation', now, 30, { location: 'Garden' });
  scheduler.scheduleRitual('Conflict Test', now, 30); // Should fail due to conflict
  scheduler.scheduleRitual('Evening Ceremony', inOneHour, 45, { participants: 10 });
  scheduler.scheduleRitual('Night Ritual', inTwoHours, 60);

  // Print scheduled rituals
  console.log('\nScheduled Rituals:', scheduler.getRituals('scheduled'));

  // Update statuses (simulating time passage)
  scheduler.updateStatuses();
}
