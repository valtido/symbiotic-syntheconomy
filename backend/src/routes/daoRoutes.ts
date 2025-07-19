import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

const proposalSchema = {
  schema: {
    description: 'Create a new DAO proposal',
    tags: ['dao'],
    body: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        type: {
          type: 'string',
          enum: ['ritual_approval', 'governance', 'funding'],
        },
        targetRitualId: { type: 'string' },
        fundingAmount: { type: 'number' },
        duration: { type: 'number' },
      },
      required: ['title', 'description', 'type'],
    },
    response: {
      200: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          proposalId: { type: 'string' },
          transactionHash: { type: 'string' },
        },
      },
    },
  },
};

const voteSchema = {
  schema: {
    description: 'Vote on a DAO proposal',
    tags: ['dao'],
    body: {
      type: 'object',
      properties: {
        proposalId: { type: 'string' },
        vote: { type: 'string', enum: ['yes', 'no', 'abstain'] },
        reason: { type: 'string' },
      },
      required: ['proposalId', 'vote'],
    },
  },
};

export async function daoRoutes(fastify: FastifyInstance) {
  // Get all proposals
  fastify.get(
    '/proposals',
    {
      schema: {
        description: 'Get all DAO proposals',
        tags: ['dao'],
        response: {
          200: {
            type: 'object',
            properties: {
              proposals: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    title: { type: 'string' },
                    description: { type: 'string' },
                    type: { type: 'string' },
                    status: { type: 'string' },
                    votesFor: { type: 'number' },
                    votesAgainst: { type: 'number' },
                    votesAbstain: { type: 'number' },
                    createdAt: { type: 'string' },
                    expiresAt: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        // Mock data for now
        const proposals = [
          {
            id: 'proposal_001',
            title: 'Approve Tech Haven Solar Ritual',
            description:
              'Proposal to approve the community solar installation ritual in Tech Haven',
            type: 'ritual_approval',
            status: 'active',
            votesFor: 15,
            votesAgainst: 3,
            votesAbstain: 2,
            createdAt: new Date().toISOString(),
            expiresAt: new Date(
              Date.now() + 7 * 24 * 60 * 60 * 1000,
            ).toISOString(),
          },
          {
            id: 'proposal_002',
            title: 'Fund Mythic Forest Conservation',
            description:
              'Proposal to allocate funds for forest conservation projects',
            type: 'funding',
            status: 'pending',
            votesFor: 0,
            votesAgainst: 0,
            votesAbstain: 0,
            createdAt: new Date().toISOString(),
            expiresAt: new Date(
              Date.now() + 14 * 24 * 60 * 60 * 1000,
            ).toISOString(),
          },
        ];

        return reply.send({ proposals });
      } catch (error) {
        return reply.status(500).send({
          error: 'Failed to fetch proposals',
          details: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    },
  );

  // Get proposal by ID
  fastify.get(
    '/proposals/:id',
    {
      schema: {
        description: 'Get specific DAO proposal',
        tags: ['dao'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
          required: ['id'],
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { id } = request.params as { id: string };

        // Mock data
        const proposal = {
          id: 'proposal_001',
          title: 'Approve Tech Haven Solar Ritual',
          description:
            'Proposal to approve the community solar installation ritual in Tech Haven',
          type: 'ritual_approval',
          status: 'active',
          targetRitualId: 'ritual_123',
          votesFor: 15,
          votesAgainst: 3,
          votesAbstain: 2,
          totalVotes: 20,
          quorum: 10,
          createdAt: new Date().toISOString(),
          expiresAt: new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          creator: '0x1234567890123456789012345678901234567890',
          votes: [
            {
              voter: '0x1111111111111111111111111111111111111111',
              vote: 'yes',
              reason: 'Supports renewable energy',
            },
            {
              voter: '0x2222222222222222222222222222222222222222',
              vote: 'no',
              reason: 'Concerns about implementation',
            },
          ],
        };

        return reply.send(proposal);
      } catch (error) {
        return reply.status(500).send({
          error: 'Failed to fetch proposal',
          details: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    },
  );

  // Create proposal
  fastify.post(
    '/proposals',
    proposalSchema,
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const data = request.body as any;

        // Mock proposal creation
        const proposalId = `proposal_${Date.now()}`;
        const transactionHash = `0x${Math.random().toString(16).substr(2, 64)}`;

        console.log('📋 New DAO proposal created:', {
          id: proposalId,
          title: data.title,
          type: data.type,
        });

        return reply.send({
          success: true,
          proposalId,
          transactionHash,
        });
      } catch (error) {
        return reply.status(500).send({
          error: 'Failed to create proposal',
          details: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    },
  );

  // Vote on proposal
  fastify.post(
    '/proposals/:id/vote',
    voteSchema,
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { id } = request.params as { id: string };
        const { vote, reason } = request.body as any;

        console.log('🗳️ Vote cast:', {
          proposalId: id,
          vote,
          reason,
        });

        return reply.send({
          success: true,
          message: 'Vote recorded successfully',
          proposalId: id,
          vote,
        });
      } catch (error) {
        return reply.status(500).send({
          error: 'Failed to record vote',
          details: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    },
  );

  // Get DAO statistics
  fastify.get(
    '/stats',
    {
      schema: {
        description: 'Get DAO statistics',
        tags: ['dao'],
        response: {
          200: {
            type: 'object',
            properties: {
              totalMembers: { type: 'number' },
              totalProposals: { type: 'number' },
              activeProposals: { type: 'number' },
              totalVotes: { type: 'number' },
              averageParticipation: { type: 'number' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const stats = {
          totalMembers: 42,
          totalProposals: 15,
          activeProposals: 3,
          totalVotes: 156,
          averageParticipation: 0.78,
        };

        return reply.send(stats);
      } catch (error) {
        return reply.status(500).send({
          error: 'Failed to fetch DAO statistics',
          details: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    },
  );

  // Get DAO members
  fastify.get(
    '/members',
    {
      schema: {
        description: 'Get DAO members',
        tags: ['dao'],
        response: {
          200: {
            type: 'object',
            properties: {
              members: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    address: { type: 'string' },
                    username: { type: 'string' },
                    votingPower: { type: 'number' },
                    joinedAt: { type: 'string' },
                    proposalsCreated: { type: 'number' },
                    votesCast: { type: 'number' },
                  },
                },
              },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const members = [
          {
            address: '0x1234567890123456789012345678901234567890',
            username: 'EcoWarrior',
            votingPower: 100,
            joinedAt: '2024-01-15T00:00:00Z',
            proposalsCreated: 3,
            votesCast: 12,
          },
          {
            address: '0x2345678901234567890123456789012345678901',
            username: 'TechShaman',
            votingPower: 75,
            joinedAt: '2024-02-01T00:00:00Z',
            proposalsCreated: 1,
            votesCast: 8,
          },
        ];

        return reply.send({ members });
      } catch (error) {
        return reply.status(500).send({
          error: 'Failed to fetch DAO members',
          details: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    },
  );
}
