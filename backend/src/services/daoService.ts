// DAO Service for Cultural Heritage Council Elections
import { ethers } from 'ethers';
import { v4 as uuidv4 } from 'uuid';

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

export class DaoService {
  /**
   * Creates a new election for the Cultural Heritage Council
   * @param title Title of the election
   * @param candidates List of candidate names or IDs
   * @param duration Duration of the election in seconds
   * @returns Election ID
   */
  createElection(title: string, candidates: string[], duration: number): string {
    const electionId = uuidv4();
    const now = Math.floor(Date.now() / 1000);

    elections[electionId] = {
      id: electionId,
      title,
      candidates,
      startTime: now,
      endTime: now + duration,
      votes: {},
      totalVotes: 0,
    };

    // Initialize votes object for each candidate
    candidates.forEach((candidate) => {
      elections[electionId].votes[candidate] = [];
    });

    console.log(`Election created: ${title} (ID: ${electionId})`);
    return electionId;
  }

  /**
   * Casts a vote in the specified election
   * @param electionId ID of the election
   * @param candidateId ID or name of the candidate
   * @param voterAddress Base testnet wallet address of the voter
   * @returns Success message or error
   */
  castVote(electionId: string, candidateId: string, voterAddress: string): string {
    const election = elections[electionId];
    if (!election) {
      throw new Error('Election not found');
    }

    // Validate voter address format (Base testnet compatible)
    if (!ethers.isAddress(voterAddress)) {
      throw new Error('Invalid voter address');
    }

    // Check if election is active
    const now = Math.floor(Date.now() / 1000);
    if (now < election.startTime || now > election.endTime) {
      throw new Error('Election is not active');
    }

    // Check if candidate exists
    if (!election.candidates.includes(candidateId)) {
      throw new Error('Candidate not found');
    }

    // Check if voter has already voted
    for (const candidateVotes of Object.values(election.votes)) {
      if (candidateVotes.includes(voterAddress)) {
        throw new Error('Voter has already cast a vote');
      }
    }

    // Record the vote
    election.votes[candidateId].push(voterAddress);
    election.totalVotes++;

    console.log(`Vote cast in election ${electionId} for ${candidateId} by ${voterAddress}`);
    return 'Vote successfully cast';
  }

  /**
   * Retrieves the results of a specified election
   * @param electionId ID of the election
   * @returns Election results with vote counts per candidate
   */
  getElectionResults(electionId: string): any {
    const election = elections[electionId];
    if (!election) {
      throw new Error('Election not found');
    }

    const results = {
      title: election.title,
      totalVotes: election.totalVotes,
      candidates: election.candidates.map((candidate) => ({
        id: candidate,
        voteCount: election.votes[candidate].length,
      })),
      status: Math.floor(Date.now() / 1000) > election.endTime ? 'Ended' : 'Active',
    };

    console.log(`Results retrieved for election ${electionId}`);
    return results;
  }

  /**
   * Utility to check if an address is valid for Base testnet
   * @param address Wallet address to validate
   * @returns Boolean indicating if the address is valid
   */
  isValidAddress(address: string): boolean {
    return ethers.isAddress(address);
  }
}

export default new DaoService();
