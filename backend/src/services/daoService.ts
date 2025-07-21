import { ethers } from 'ethers';
import { BaseProvider } from '@ethersproject/providers';

// Define interfaces for election and vote data
interface Election {
  id: string;
  title: string;
  candidates: string[];
  startTime: number;
  endTime: number;
  votes: { [candidateId: string]: string[] }; // Mapping of candidate to voter addresses
  totalVotes: number;
}

// In-memory storage for elections (replace with database in production)
const elections: { [id: string]: Election } = {};

// DAO Service class for managing Cultural Heritage Council elections
export class DaoService {
  private provider: BaseProvider;

  constructor() {
    // Connect to Base testnet (Sepolia testnet for Base)
    this.provider = new ethers.providers.JsonRpcProvider('https://sepolia.base.org');
  }

  /**
   * Creates a new election for the Cultural Heritage Council
   * @param title Election title
   * @param candidates List of candidate names or IDs
   * @param duration Duration of election in seconds
   * @returns Election ID
   */
  public createElection(title: string, candidates: string[], duration: number): string {
    const electionId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(title + Date.now().toString()));
    const startTime = Math.floor(Date.now() / 1000);
    const endTime = startTime + duration;

    elections[electionId] = {
      id: electionId,
      title,
      candidates,
      startTime,
      endTime,
      votes: candidates.reduce((acc, candidate) => ({ ...acc, [candidate]: [] }), {}),
      totalVotes: 0,
    };

    return electionId;
  }

  /**
   * Casts a vote in an election for a specific candidate
   * @param electionId ID of the election
   * @param candidateId ID or name of the candidate
   * @param voterAddress Base testnet address of the voter
   * @returns True if vote is successfully cast
   */
  public async castVote(electionId: string, candidateId: string, voterAddress: string): Promise<boolean> {
    const election = elections[electionId];
    if (!election) {
      throw new Error('Election not found');
    }

    const currentTime = Math.floor(Date.now() / 1000);
    if (currentTime < election.startTime || currentTime > election.endTime) {
      throw new Error('Election is not active');
    }

    if (!election.candidates.includes(candidateId)) {
      throw new Error('Invalid candidate');
    }

    // Verify voter address is a valid Base testnet address
    if (!ethers.utils.isAddress(voterAddress)) {
      throw new Error('Invalid voter address');
    }

    // Check if voter has already voted
    const hasVoted = Object.values(election.votes).some(voters => voters.includes(voterAddress));
    if (hasVoted) {
      throw new Error('Voter has already cast a vote');
    }

    // Record the vote
    election.votes[candidateId].push(voterAddress);
    election.totalVotes += 1;
    return true;
  }

  /**
   * Retrieves the results of an election
   * @param electionId ID of the election
   * @returns Election results with vote counts per candidate
   */
  public getElectionResults(electionId: string): { [candidateId: string]: number } {
    const election = elections[electionId];
    if (!election) {
      throw new Error('Election not found');
    }

    const results: { [candidateId: string]: number } = {};
    for (const candidate of election.candidates) {
      results[candidate] = election.votes[candidate].length;
    }

    return results;
  }

  /**
   * Helper method to check if an election exists
   * @param electionId ID of the election
   * @returns True if election exists
   */
  public electionExists(electionId: string): boolean {
    return !!elections[electionId];
  }

  /**
   * Gets the status of an election (active or ended)
   * @param electionId ID of the election
   * @returns Election status
   */
  public getElectionStatus(electionId: string): { active: boolean; startTime: number; endTime: number } {
    const election = elections[electionId];
    if (!election) {
      throw new Error('Election not found');
    }

    const currentTime = Math.floor(Date.now() / 1000);
    return {
      active: currentTime >= election.startTime && currentTime <= election.endTime,
      startTime: election.startTime,
      endTime: election.endTime,
    };
  }
}

export default new DaoService();
