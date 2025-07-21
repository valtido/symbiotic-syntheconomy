import { ethers } from 'ethers';
import { DatabaseService } from './databaseService';
import { NotificationService } from './notificationService';

// Interfaces for DAO governance data structures
interface Proposal {
  id: string;
  title: string;
  description: string;
  proposer: string;
  startTime: number;
  endTime: number;
  status: 'Pending' | 'Active' | 'Completed' | 'Rejected';
  votesFor: number;
  votesAgainst: number;
  executed: boolean;
  executionData?: string;
}

interface Member {
  address: string;
  reputation: number;
  delegatedTo?: string;
  votingPower: number;
  lastActive: number;
}

interface Vote {
  proposalId: string;
  voter: string;
  inFavor: boolean;
  weight: number;
  timestamp: number;
}

class AdvancedDaoService {
  private db: DatabaseService;
  private notifier: NotificationService;
  private provider: ethers.providers.JsonRpcProvider;
  private contract?: ethers.Contract;
  private readonly CONTRACT_ADDRESS = process.env.DAO_CONTRACT_ADDRESS || '';

  constructor() {
    this.db = new DatabaseService();
    this.notifier = new NotificationService();
    this.provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL || '');
    this.initializeContract();
  }

  private async initializeContract() {
    if (this.CONTRACT_ADDRESS) {
      // Assuming we have a DAO contract ABI
      const abi = [
        'function executeProposal(string memory proposalId) external',
        'function getProposal(string memory proposalId) view returns (string, string, address, uint256, uint256, uint8, uint256, uint256, bool)'
      ];
      this.contract = new ethers.Contract(this.CONTRACT_ADDRESS, abi, this.provider);
    }
  }

  // Proposal Management
  async createProposal(proposer: string, title: string, description: string, durationDays: number, executionData?: string): Promise<Proposal> {
    const startTime = Date.now();
    const endTime = startTime + (durationDays * 24 * 60 * 60 * 1000);
    const proposal: Proposal = {
      id: ethers.utils.id(`${title}-${startTime}-${proposer}`),
      title,
      description,
      proposer,
      startTime,
      endTime,
      status: 'Pending',
      votesFor: 0,
      votesAgainst: 0,
      executed: false,
      executionData
    };

    await this.db.save('proposals', proposal.id, proposal);
    await this.notifier.broadcast(`New proposal created: ${title}`, { proposalId: proposal.id });
    return proposal;
  }

  async getProposal(proposalId: string): Promise<Proposal | null> {
    return this.db.get('proposals', proposalId);
  }

  // Voting System
  async castVote(proposalId: string, voter: string, inFavor: boolean): Promise<Vote> {
    const proposal = await this.getProposal(proposalId);
    if (!proposal || proposal.status !== 'Active') {
      throw new Error('Invalid or inactive proposal');
    }

    const member = await this.getMember(voter);
    if (!member) throw new Error('Not a DAO member');

    const weight = await this.calculateVotingPower(voter);
    const vote: Vote = {
      proposalId,
      voter,
      inFavor,
      weight,
      timestamp: Date.now()
    };

    await this.db.save('votes', `${proposalId}-${voter}`, vote);
    if (inFavor) {
      proposal.votesFor += weight;
    } else {
      proposal.votesAgainst += weight;
    }

    await this.db.update('proposals', proposalId, proposal);
    await this.updateMemberActivity(voter);
    return vote;
  }

  // Delegation System
  async delegateVotingPower(from: string, to: string): Promise<void> {
    const fromMember = await this.getMember(from);
    const toMember = await this.getMember(to);
    if (!fromMember || !toMember) throw new Error('Invalid member');

    fromMember.delegatedTo = to;
    await this.db.update('members', from, fromMember);
    await this.notifier.send(to, `${from} has delegated their voting power to you`);
  }

  // Reputation System
  async updateReputation(memberAddress: string, change: number): Promise<void> {
    const member = await this.getMember(memberAddress);
    if (!member) throw new Error('Member not found');

    member.reputation = Math.max(0, member.reputation + change);
    await this.db.update('members', memberAddress, member);
  }

  async calculateVotingPower(memberAddress: string): Promise<number> {
    const member = await this.getMember(memberAddress);
    if (!member) return 0;

    // Base voting power + reputation bonus + delegated power
    let totalPower = member.votingPower + (member.reputation / 10);
    const delegatedMembers = await this.getDelegatedMembers(memberAddress);
    for (const delegated of delegatedMembers) {
      totalPower += delegated.votingPower;
    }
    return totalPower;
  }

  // Member Management
  async getMember(address: string): Promise<Member | null> {
    return this.db.get('members', address);
  }

  async getDelegatedMembers(delegate: string): Promise<Member[]> {
    const allMembers = await this.db.getAll('members');
    return Object.values(allMembers).filter((m: Member) => m.delegatedTo === delegate);
  }

  async updateMemberActivity(address: string): Promise<void> {
    const member = await this.getMember(address);
    if (member) {
      member.lastActive = Date.now();
      await this.db.update('members', address, member);
    }
  }

  // Automated Execution
  async executeProposal(proposalId: string): Promise<boolean> {
    const proposal = await this.getProposal(proposalId);
    if (!proposal || proposal.executed || proposal.status !== 'Completed') {
      throw new Error('Proposal not executable');
    }

    if (proposal.votesFor <= proposal.votesAgainst) {
      throw new Error('Proposal did not pass');
    }

    if (this.contract && proposal.executionData) {
      try {
        const tx = await this.contract.executeProposal(proposalId);
        await tx.wait();
        proposal.executed = true;
        proposal.status = 'Completed';
        await this.db.update('proposals', proposalId, proposal);
        await this.notifier.broadcast(`Proposal ${proposal.title} executed successfully`);
        return true;
      } catch (error) {
        console.error('Execution failed:', error);
        return false;
      }
    }
    return false;
  }

  // Cultural Heritage Council Elections
  async runCouncilElection(candidates: string[], votingDurationDays: number): Promise<string[]> {
    const electionId = ethers.utils.id(`election-${Date.now()}`);
    const election = {
      id: electionId,
      candidates,
      votes: {} as Record<string, number>,
      startTime: Date.now(),
      endTime: Date.now() + (votingDurationDays * 24 * 60 * 60 * 1000),
      status: 'Active'
    };

    await this.db.save('elections', electionId, election);
    await this.notifier.broadcast('Cultural Heritage Council Election started', { electionId });
    return candidates;
  }

  async voteForCouncil(electionId: string, voter: string, candidate: string): Promise<void> {
    const election = await this.db.get('elections', electionId);
    if (!election || election.status !== 'Active') throw new Error('Invalid election');

    const voterPower = await this.calculateVotingPower(voter);
    election.votes[candidate] = (election.votes[candidate] || 0) + voterPower;
    await this.db.update('elections', electionId, election);
    await this.updateMemberActivity(voter);
  }

  async finalizeCouncilElection(electionId: string, councilSize: number): Promise<string[]> {
    const election = await this.db.get('elections', electionId);
    if (!election || election.status !== 'Active') throw new Error('Invalid election');

    election.status = 'Completed';
    const results = Object.entries(election.votes)
      .sort((a, b) => b[1] - a[1])
      .slice(0, councilSize)
      .map(([candidate]) => candidate);

    await this.db.update('elections', electionId, election);
    await this.notifier.broadcast('Council Election Results', { winners: results });
    return results;
  }
}

export default AdvancedDaoService;
