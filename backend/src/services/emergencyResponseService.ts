// Emergency Response Service for ritual-related crises and community emergencies
import { injectable, inject } from 'tsyringe';
import { NotificationService } from './notificationService';
import { Logger } from '../utils/logger';
import { CrisisType, EmergencyResponse, AlertLevel } from '../models/emergencyModels';

@injectable()
export class EmergencyResponseService {
  private activeCrises: Map<string, EmergencyResponse> = new Map();

  constructor(
    @inject(NotificationService) private notificationService: NotificationService,
    @inject(Logger) private logger: Logger
  ) {}

  /**
   * Initiate a crisis response for a ritual or community emergency
   * @param crisisId Unique identifier for the crisis
   * @param type Type of crisis (Ritual, CulturalHeritage, Community)
   * @param description Detailed description of the emergency
   * @param location Location of the crisis
   * @param alertLevel Severity of the crisis (Low, Medium, High, Critical)
   */
  public async initiateCrisisResponse(
    crisisId: string,
    type: CrisisType,
    description: string,
    location: string,
    alertLevel: AlertLevel
  ): Promise<EmergencyResponse> {
    try {
      const response: EmergencyResponse = {
        crisisId,
        type,
        description,
        location,
        alertLevel,
        status: 'Active',
        initiatedAt: new Date(),
        updates: []
      };

      this.activeCrises.set(crisisId, response);
      await this.broadcastAlert(crisisId, response);
      this.logger.info(`Crisis response initiated for ${crisisId} at ${location}`);
      return response;
    } catch (error) {
      this.logger.error(`Failed to initiate crisis response for ${crisisId}:`, error);
      throw new Error(`Crisis initiation failed: ${error.message}`);
    }
  }

  /**
   * Update the status or details of an active crisis
   * @param crisisId Unique identifier for the crisis
   * @param update Details or status update for the crisis
   */
  public async updateCrisis(
    crisisId: string,
    update: { status?: string; description?: string; alertLevel?: AlertLevel }
  ): Promise<EmergencyResponse | null> {
    try {
      const crisis = this.activeCrises.get(crisisId);
      if (!crisis) {
        throw new Error(`Crisis ${crisisId} not found`);
      }

      const updatedCrisis = {
        ...crisis,
        ...update,
        updates: [...crisis.updates, { timestamp: new Date(), details: update }]
      };

      this.activeCrises.set(crisisId, updatedCrisis);
      await this.broadcastAlert(crisisId, updatedCrisis);
      this.logger.info(`Crisis ${crisisId} updated with status: ${updatedCrisis.status}`);
      return updatedCrisis;
    } catch (error) {
      this.logger.error(`Failed to update crisis ${crisisId}:`, error);
      throw new Error(`Crisis update failed: ${error.message}`);
    }
  }

  /**
   * Resolve a crisis and notify the community
   * @param crisisId Unique identifier for the crisis
   */
  public async resolveCrisis(crisisId: string): Promise<boolean> {
    try {
      const crisis = this.activeCrises.get(crisisId);
      if (!crisis) {
        throw new Error(`Crisis ${crisisId} not found`);
      }

      crisis.status = 'Resolved';
      crisis.updates.push({
        timestamp: new Date(),
        details: { status: 'Resolved' }
      });

      await this.broadcastAlert(crisisId, crisis);
      this.activeCrises.delete(crisisId);
      this.logger.info(`Crisis ${crisisId} resolved`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to resolve crisis ${crisisId}:`, error);
      throw new Error(`Crisis resolution failed: ${error.message}`);
    }
  }

  /**
   * Broadcast an alert to the community or relevant stakeholders
   * @param crisisId Unique identifier for the crisis
   * @param response Emergency response details
   */
  private async broadcastAlert(crisisId: string, response: EmergencyResponse): Promise<void> {
    try {
      const message = this.formatAlertMessage(response);
      await this.notificationService.sendCommunityAlert(
        message,
        response.alertLevel,
        response.location
      );
      this.logger.info(`Alert broadcast for crisis ${crisisId}`);
    } catch (error) {
      this.logger.error(`Failed to broadcast alert for crisis ${crisisId}:`, error);
      throw new Error(`Alert broadcast failed: ${error.message}`);
    }
  }

  /**
   * Format the alert message based on crisis details
   * @param response Emergency response details
   */
  private formatAlertMessage(response: EmergencyResponse): string {
    return `[${response.alertLevel.toUpperCase()}] ${response.type} Crisis at ${response.location}: ${response.description}. Status: ${response.status}.`;
  }

  /**
   * Get active crisis details
   * @param crisisId Unique identifier for the crisis
   */
  public getCrisisDetails(crisisId: string): EmergencyResponse | null {
    return this.activeCrises.get(crisisId) || null;
  }

  /**
   * Get all active crises
   */
  public getAllActiveCrises(): EmergencyResponse[] {
    return Array.from(this.activeCrises.values());
  }
}
