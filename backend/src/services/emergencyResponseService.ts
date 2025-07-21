// Emergency Response Service for ritual-related crises, cultural heritage threats, and community emergencies
import { injectable, inject } from 'tsyringe';
import { Logger } from 'winston';
import { NotificationService } from './notificationService';
import { CommunityService } from './communityService';

interface EmergencyContact {
  name: string;
  phone: string;
  email: string;
  role: string;
}

interface CrisisReport {
  id: string;
  type: 'ritual' | 'cultural' | 'community';
  description: string;
  location: string;
  reportedBy: string;
  timestamp: Date;
  status: 'pending' | 'active' | 'resolved';
}

@injectable()
export class EmergencyResponseService {
  private activeCrises: CrisisReport[] = [];
  private emergencyContacts: EmergencyContact[] = [];

  constructor(
    @inject('Logger') private logger: Logger,
    @inject(NotificationService) private notificationService: NotificationService,
    @inject(CommunityService) private communityService: CommunityService
  ) {
    this.logger.info('Emergency Response Service initialized');
  }

  /**
   * Report a new crisis or emergency
   */
  async reportCrisis(
    type: 'ritual' | 'cultural' | 'community',
    description: string,
    location: string,
    reportedBy: string
  ): Promise<string> {
    const crisis: CrisisReport = {
      id: this.generateCrisisId(),
      type,
      description,
      location,
      reportedBy,
      timestamp: new Date(),
      status: 'pending'
    };

    this.activeCrises.push(crisis);
    this.logger.info(`New crisis reported: ${crisis.id} - ${crisis.type} at ${crisis.location}`);

    // Trigger rapid response protocol
    await this.triggerRapidResponse(crisis);
    return crisis.id;
  }

  /**
   * Trigger rapid response protocol for a crisis
   */
  async triggerRapidResponse(crisis: CrisisReport): Promise<void> {
    try {
      // Update crisis status
      crisis.status = 'active';
      this.logger.info(`Rapid response triggered for crisis: ${crisis.id}`);

      // Notify emergency contacts
      await this.notifyEmergencyTeam(crisis);

      // Send community alerts
      await this.communityService.broadcastAlert({
        message: `Emergency Alert: ${crisis.type} crisis at ${crisis.location}. ${crisis.description}`,
        severity: 'high',
        timestamp: new Date()
      });
    } catch (error) {
      this.logger.error(`Error in rapid response for crisis ${crisis.id}:`, error);
      throw error;
    }
  }

  /**
   * Notify emergency response team
   */
  async notifyEmergencyTeam(crisis: CrisisReport): Promise<void> {
    const message = `URGENT: ${crisis.type} crisis reported at ${crisis.location}. Details: ${crisis.description}. Respond immediately.`;
    
    for (const contact of this.emergencyContacts) {
      await this.notificationService.sendNotification({
        recipient: contact.email,
        message,
        channel: 'email'
      });
      await this.notificationService.sendNotification({
        recipient: contact.phone,
        message,
        channel: 'sms'
      });
      this.logger.info(`Notified ${contact.name} (${contact.role}) about crisis ${crisis.id}`);
    }
  }

  /**
   * Add emergency contact to the response team
   */
  addEmergencyContact(contact: EmergencyContact): void {
    this.emergencyContacts.push(contact);
    this.logger.info(`Added emergency contact: ${contact.name} (${contact.role})`);
  }

  /**
   * Resolve a crisis
   */
  async resolveCrisis(crisisId: string): Promise<boolean> {
    const crisis = this.activeCrises.find(c => c.id === crisisId);
    if (!crisis) {
      this.logger.warn(`Crisis not found: ${crisisId}`);
      return false;
    }

    crisis.status = 'resolved';
    this.logger.info(`Crisis resolved: ${crisisId}`);

    // Notify community of resolution
    await this.communityService.broadcastAlert({
      message: `Update: The ${crisis.type} crisis at ${crisis.location} has been resolved. Thank you for your cooperation.`,
      severity: 'low',
      timestamp: new Date()
    });

    return true;
  }

  /**
   * Get active crises
   */
  getActiveCrises(): CrisisReport[] {
    return this.activeCrises.filter(crisis => crisis.status === 'active');
  }

  /**
   * Generate unique crisis ID
   */
  private generateCrisisId(): string {
    return `CRISIS-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }
}
