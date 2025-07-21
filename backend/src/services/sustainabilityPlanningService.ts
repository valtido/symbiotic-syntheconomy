// sustainabilityPlanningService.ts - Service for managing project sustainability and community governance

import { injectable, inject } from 'tsyringe';
import { SustainabilityPlan } from '../models/SustainabilityPlan';
import { CommunityGovernance } from '../models/CommunityGovernance';
import { ResourceAllocation } from '../models/ResourceAllocation';
import { SustainabilityMetrics } from '../models/SustainabilityMetrics';
import { DatabaseService } from './databaseService';

@injectable()
export class SustainabilityPlanningService {
  constructor(@inject(DatabaseService) private dbService: DatabaseService) {}

  /**
   * Create a new sustainability plan for a project
   * @param planData Data for the sustainability plan
   * @returns Created sustainability plan
   */
  async createSustainabilityPlan(planData: Partial<SustainabilityPlan>): Promise<SustainabilityPlan> {
    try {
      const plan = new SustainabilityPlan();
      Object.assign(plan, planData);
      plan.createdAt = new Date();
      plan.updatedAt = new Date();
      return await this.dbService.saveSustainabilityPlan(plan);
    } catch (error) {
      throw new Error(`Failed to create sustainability plan: ${error.message}`);
    }
  }

  /**
   * Update an existing sustainability plan
   * @param planId ID of the plan to update
   * @param updateData Data to update
   * @returns Updated sustainability plan
   */
  async updateSustainabilityPlan(planId: string, updateData: Partial<SustainabilityPlan>): Promise<SustainabilityPlan> {
    try {
      const plan = await this.dbService.getSustainabilityPlan(planId);
      if (!plan) {
        throw new Error('Sustainability plan not found');
      }
      Object.assign(plan, updateData);
      plan.updatedAt = new Date();
      return await this.dbService.saveSustainabilityPlan(plan);
    } catch (error) {
      throw new Error(`Failed to update sustainability plan: ${error.message}`);
    }
  }

  /**
   * Get sustainability plan by ID
   * @param planId ID of the plan
   * @returns Sustainability plan
   */
  async getSustainabilityPlan(planId: string): Promise<SustainabilityPlan> {
    try {
      const plan = await this.dbService.getSustainabilityPlan(planId);
      if (!plan) {
        throw new Error('Sustainability plan not found');
      }
      return plan;
    } catch (error) {
      throw new Error(`Failed to get sustainability plan: ${error.message}`);
    }
  }

  /**
   * Setup community governance model
   * @param governanceData Governance model data
   * @returns Created governance model
   */
  async setupCommunityGovernance(governanceData: Partial<CommunityGovernance>): Promise<CommunityGovernance> {
    try {
      const governance = new CommunityGovernance();
      Object.assign(governance, governanceData);
      return await this.dbService.saveCommunityGovernance(governance);
    } catch (error) {
      throw new Error(`Failed to setup community governance: ${error.message}`);
    }
  }

  /**
   * Allocate resources for project sustainability
   * @param allocationData Resource allocation data
   * @returns Created resource allocation
   */
  async allocateResources(allocationData: Partial<ResourceAllocation>): Promise<ResourceAllocation> {
    try {
      const allocation = new ResourceAllocation();
      Object.assign(allocation, allocationData);
      allocation.allocatedAt = new Date();
      return await this.dbService.saveResourceAllocation(allocation);
    } catch (error) {
      throw new Error(`Failed to allocate resources: ${error.message}`);
    }
  }

  /**
   * Track sustainability metrics
   * @param metricsData Sustainability metrics data
   * @returns Created metrics record
   */
  async trackSustainabilityMetrics(metricsData: Partial<SustainabilityMetrics>): Promise<SustainabilityMetrics> {
    try {
      const metrics = new SustainabilityMetrics();
      Object.assign(metrics, metricsData);
      metrics.recordedAt = new Date();
      return await this.dbService.saveSustainabilityMetrics(metrics);
    } catch (error) {
      throw new Error(`Failed to track sustainability metrics: ${error.message}`);
    }
  }

  /**
   * Generate sustainability report for a project
   * @param projectId ID of the project
   * @returns Sustainability report
   */
  async generateSustainabilityReport(projectId: string): Promise<any> {
    try {
      const plan = await this.dbService.getSustainabilityPlanByProject(projectId);
      const metrics = await this.dbService.getSustainabilityMetricsByProject(projectId);
      const resources = await this.dbService.getResourceAllocationsByProject(projectId);
      const governance = await this.dbService.getCommunityGovernanceByProject(projectId);

      return {
        projectId,
        sustainabilityPlan: plan || null,
        sustainabilityMetrics: metrics || [],
        resourceAllocations: resources || [],
        communityGovernance: governance || null,
        generatedAt: new Date(),
      };
    } catch (error) {
      throw new Error(`Failed to generate sustainability report: ${error.message}`);
    }
  }
}
