// Liquid Democracy Service for community governance and decision-making

import { injectable, inject } from 'tsyringe';
import { UserRepository } from '../repositories/userRepository';
import { ProposalRepository } from '../repositories/proposalRepository';
import { VoteRepository } from '../repositories/voteRepository';

interface VoteDelegation {
  delegatorId: string;
  delegateId: string;
  proposalId?: string; // Optional: specific to a proposal, null for general delegation
  weight: number; // Percentage of voting power delegated (0-100)
  createdAt: Date;
  expiresAt?: Date; // Optional expiration for delegation
}

interface Proposal {
  id: string;
  title: string;
  description: string;
  creatorId: string;
  createdAt: Date;
  votingDeadline: Date;
  status: 'active' | 'completed' | 'cancelled';
  options: string[]; // Voting options for the proposal
}

interface Vote {
  id: string;
  userId: string;
  proposalId: string;
  optionIndex: number; // Index of the chosen option
  weight: number; // Voting power at the time of voting
  createdAt: Date;
}

@injectable()
export class LiquidDemocracyService {
  private delegations: VoteDelegation[] = []; // In-memory store for delegations

  constructor(
    @inject('UserRepository') private userRepository: UserRepository,
    @inject('ProposalRepository') private proposalRepository: ProposalRepository,
    @inject('VoteRepository') private voteRepository: VoteRepository
  ) {}

  /**
   * Delegate voting power to another user
   * @param delegatorId ID of the user delegating their vote
   * @param delegateId ID of the user receiving the delegated vote
   * @param weight Percentage of voting power to delegate (0-100)
   * @param proposalId Optional: specific proposal for delegation
   * @param expiresAt Optional: expiration date for delegation
   */
  async delegateVote(
    delegatorId: string,
    delegateId: string,
    weight: number,
    proposalId?: string,
    expiresAt?: Date
  ): Promise<void> {
    if (weight < 0 || weight > 100) {
      throw new Error('Weight must be between 0 and 100');
    }

    const delegator = await this.userRepository.findById(delegatorId);
    const delegate = await this.userRepository.findById(delegateId);

    if (!delegator || !delegate) {
      throw new Error('Invalid delegator or delegate ID');
    }

    if (delegatorId === delegateId) {
      throw new Error('Cannot delegate to self');
    }

    // Check for delegation cycles (simplified check for direct cycles)
    const existingDelegation = this.delegations.find(
      d => d.delegatorId === delegateId && d.delegateId === delegatorId
    );
    if (existingDelegation) {
      throw new Error('Delegation cycle detected');
    }

    const delegation: VoteDelegation = {
      delegatorId,
      delegateId,
      weight,
      proposalId,
      createdAt: new Date(),
      expiresAt
    };

    this.delegations.push(delegation);
  }

  /**
   * Revoke a delegation
   * @param delegatorId ID of the user who delegated their vote
   * @param delegateId ID of the user whose delegation is being revoked
   * @param proposalId Optional: specific proposal for which delegation is revoked
   */
  async revokeDelegation(delegatorId: string, delegateId: string, proposalId?: string): Promise<void> {
    this.delegations = this.delegations.filter(
      d =>
        !(d.delegatorId === delegatorId && d.delegateId === delegateId && d.proposalId === proposalId)
    );
  }

  /**
   * Create a new proposal for voting
   * @param creatorId ID of the user creating the proposal
   * @param title Title of the proposal
   * @param description Description of the proposal
   * @param votingDeadline Deadline for voting
   * @param options Voting options for the proposal
   */
  async createProposal(
    creatorId: string,
    title: string,
    description: string,
    votingDeadline: Date,
    options: string[]
  ): Promise<Proposal> {
    if (options.length < 2) {
      throw new Error('Proposal must have at least 2 options');
    }

    const proposal: Proposal = {
      id: this.generateId(),
      title,
      description,
      creatorId,
      createdAt: new Date(),
      votingDeadline,
      status: 'active',
      options
    };

    await this.proposalRepository.save(proposal);
    return proposal;
  }

  /**
   * Cast a vote on a proposal
   * @param userId ID of the user voting
   * @param proposalId ID of the proposal being voted on
   * @param optionIndex Index of the chosen option
   */
  async castVote(userId: string, proposalId: string, optionIndex: number): Promise<void> {
    const proposal = await this.proposalRepository.findById(proposalId);
    if (!proposal) {
      throw new Error('Proposal not found');
    }

    if (proposal.status !== 'active' || new Date() > proposal.votingDeadline) {
      throw new Error('Voting is not active for this proposal');
    }

    if (optionIndex < 0 || optionIndex >= proposal.options.length) {
      throw new Error('Invalid option index');
    }

    const votingPower = await this.calculateVotingPower(userId, proposalId);
    const vote: Vote = {
      id: this.generateId(),
      userId,
      proposalId,
      optionIndex,
      weight: votingPower,
      createdAt: new Date()
    };

    await this.voteRepository.save(vote);
  }

  /**
   * Calculate the total voting power of a user, including delegated votes
   * @param userId ID of the user
   * @param proposalId Optional: specific proposal for voting power calculation
   */
  async calculateVotingPower(userId: string, proposalId?: string): Promise<number> {
    let totalPower = 1; // Base voting power for the user

    // Add delegated voting power
    const relevantDelegations = this.delegations.filter(
      d =>
        d.delegateId === userId &&
        (d.proposalId === proposalId || !d.proposalId) &&
        (!d.expiresAt || d.expiresAt > new Date())
    );

    for (const delegation of relevantDelegations) {
      totalPower += (delegation.weight / 100);
    }

    return totalPower;
  }

  /**
   * Get the results of a proposal
   * @param proposalId ID of the proposal
   */
  async getProposalResults(proposalId: string): Promise<{ option: string; votes: number }[]> {
    const proposal = await this.proposalRepository.findById(proposalId);
    if (!proposal) {
      throw new Error('Proposal not found');
    }

    const votes = await this.voteRepository.findByProposalId(proposalId);
    const results = proposal.options.map((option, index) => ({
      option,
      votes: votes
        .filter(vote => vote.optionIndex === index)
        .reduce((sum, vote) => sum + vote.weight, 0)
    }));

    return results;
  }

  /**
   * Generate a unique ID for entities
   */
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}
