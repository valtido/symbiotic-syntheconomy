import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

interface CollaborationInput {
  userId: string;
  ritualId: string;
  content: string;
  type: 'suggestion' | 'comment' | 'edit';
}

interface VotingInput {
  userId: string;
  collaborationId: string;
  vote: 'upvote' | 'downvote';
}

/**
 * Community Collaboration Service
 * Handles co-creation tools for ritual development including suggestions, comments, edits, and voting
 */
export class CommunityCollaborationService {
  /**
   * Add a new collaboration entry (suggestion, comment, or edit) for a ritual
   * @param input Collaboration data
   * @returns Created collaboration entry
   */
  static async addCollaboration(input: CollaborationInput) {
    try {
      const collaboration = await prisma.collaboration.create({
        data: {
          id: uuidv4(),
          userId: input.userId,
          ritualId: input.ritualId,
          content: input.content,
          type: input.type,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        include: {
          user: {
            select: {
              username: true,
              id: true,
            },
          },
        },
      });
      return collaboration;
    } catch (error) {
      throw new Error(`Failed to add collaboration: ${error.message}`);
    }
  }

  /**
   * Get all collaborations for a specific ritual
   * @param ritualId ID of the ritual
   * @returns List of collaboration entries
   */
  static async getCollaborationsByRitual(ritualId: string) {
    try {
      const collaborations = await prisma.collaboration.findMany({
        where: { ritualId },
        include: {
          user: {
            select: {
              username: true,
              id: true,
            },
          },
          votes: true,
        },
        orderBy: { createdAt: 'desc' },
      });
      return collaborations;
    } catch (error) {
      throw new Error(`Failed to fetch collaborations: ${error.message}`);
    }
  }

  /**
   * Cast a vote on a collaboration entry
   * @param input Voting data
   * @returns Updated collaboration with vote
   */
  static async castVote(input: VotingInput) {
    try {
      // Check if user has already voted
      const existingVote = await prisma.vote.findFirst({
        where: {
          userId: input.userId,
          collaborationId: input.collaborationId,
        },
      });

      if (existingVote) {
        // Update existing vote if different
        if (existingVote.vote !== input.vote) {
          return await prisma.vote.update({
            where: { id: existingVote.id },
            data: { vote: input.vote },
          });
        }
        return existingVote;
      }

      // Create new vote if none exists
      return await prisma.vote.create({
        data: {
          id: uuidv4(),
          userId: input.userId,
          collaborationId: input.collaborationId,
          vote: input.vote,
          createdAt: new Date(),
        },
      });
    } catch (error) {
      throw new Error(`Failed to cast vote: ${error.message}`);
    }
  }

  /**
   * Get vote statistics for a collaboration entry
   * @param collaborationId ID of the collaboration entry
   * @returns Vote statistics
   */
  static async getVoteStats(collaborationId: string) {
    try {
      const votes = await prisma.vote.groupBy({
        by: ['vote'],
        where: { collaborationId },
        _count: {
          vote: true,
        },
      });

      const stats = {
        upvotes: votes.find(v => v.vote === 'upvote')?._count?.vote || 0,
        downvotes: votes.find(v => v.vote === 'downvote')?._count?.vote || 0,
      };

      return stats;
    } catch (error) {
      throw new Error(`Failed to get vote stats: ${error.message}`);
    }
  }

  /**
   * Update collaboration content (for edits)
   * @param collaborationId ID of the collaboration entry
   * @param userId ID of the user making the update
   * @param content Updated content
   * @returns Updated collaboration entry
   */
  static async updateCollaboration(collaborationId: string, userId: string, content: string) {
    try {
      const collaboration = await prisma.collaboration.findUnique({
        where: { id: collaborationId },
      });

      if (!collaboration) {
        throw new Error('Collaboration not found');
      }

      if (collaboration.userId !== userId) {
        throw new Error('Unauthorized to update this collaboration');
      }

      return await prisma.collaboration.update({
        where: { id: collaborationId },
        data: {
          content,
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      throw new Error(`Failed to update collaboration: ${error.message}`);
    }
  }

  /**
   * Delete a collaboration entry
   * @param collaborationId ID of the collaboration entry
   * @param userId ID of the user requesting deletion
   * @returns Deleted collaboration entry
   */
  static async deleteCollaboration(collaborationId: string, userId: string) {
    try {
      const collaboration = await prisma.collaboration.findUnique({
        where: { id: collaborationId },
      });

      if (!collaboration) {
        throw new Error('Collaboration not found');
      }

      if (collaboration.userId !== userId) {
        throw new Error('Unauthorized to delete this collaboration');
      }

      // Delete related votes first
      await prisma.vote.deleteMany({
        where: { collaborationId },
      });

      return await prisma.collaboration.delete({
        where: { id: collaborationId },
      });
    } catch (error) {
      throw new Error(`Failed to delete collaboration: ${error.message}`);
    }
  }
}
