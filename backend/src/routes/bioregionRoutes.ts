import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

const bioregionSchema = {
  schema: {
    description: 'Get bioregion information',
    tags: ['bioregions'],
    response: {
      200: {
        type: 'object',
        properties: {
          bioregions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                description: { type: 'string' },
                characteristics: { type: 'array', items: { type: 'string' } },
                culturalTraditions: {
                  type: 'array',
                  items: { type: 'string' },
                },
                focusAreas: { type: 'array', items: { type: 'string' } },
              },
            },
          },
        },
      },
    },
  },
};

export async function bioregionRoutes(fastify: FastifyInstance) {
  // Get all bioregions
  fastify.get(
    '/',
    bioregionSchema,
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const bioregions = [
          {
            id: 'tech-haven',
            name: 'Tech Haven',
            description: 'Digital innovation and sustainable technology hub',
            characteristics: [
              'Digital innovation',
              'Sustainable technology',
              'Urban regeneration',
            ],
            culturalTraditions: [
              'Modern tech culture',
              'Digital nomadism',
              'Hacktivism',
            ],
            focusAreas: [
              'Renewable energy',
              'Smart cities',
              'Digital democracy',
            ],
          },
          {
            id: 'mythic-forest',
            name: 'Mythic Forest',
            description: 'Ancient wisdom and biodiversity sanctuary',
            characteristics: [
              'Ancient wisdom',
              'Biodiversity',
              'Spiritual connection',
            ],
            culturalTraditions: [
              'Indigenous knowledge',
              'Animism',
              'Earth-based spirituality',
            ],
            focusAreas: [
              'Forest conservation',
              'Traditional medicine',
              'Sacred ecology',
            ],
          },
          {
            id: 'isolated-bastion',
            name: 'Isolated Bastion',
            description: 'Self-sufficiency and community resilience stronghold',
            characteristics: [
              'Self-sufficiency',
              'Resilience',
              'Community autonomy',
            ],
            culturalTraditions: [
              'Survival skills',
              'Homesteading',
              'Mutual aid',
            ],
            focusAreas: [
              'Food sovereignty',
              'Local economies',
              'Disaster preparedness',
            ],
          },
        ];

        return reply.send({ bioregions });
      } catch (error) {
        return reply.status(500).send({
          error: 'Failed to fetch bioregions',
          details: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    },
  );

  // Get bioregion by ID
  fastify.get(
    '/:id',
    {
      schema: {
        description: 'Get specific bioregion information',
        tags: ['bioregions'],
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

        const bioregions = {
          'tech-haven': {
            id: 'tech-haven',
            name: 'Tech Haven',
            description: 'Digital innovation and sustainable technology hub',
            characteristics: [
              'Digital innovation',
              'Sustainable technology',
              'Urban regeneration',
            ],
            culturalTraditions: [
              'Modern tech culture',
              'Digital nomadism',
              'Hacktivism',
            ],
            focusAreas: [
              'Renewable energy',
              'Smart cities',
              'Digital democracy',
            ],
          },
          'mythic-forest': {
            id: 'mythic-forest',
            name: 'Mythic Forest',
            description: 'Ancient wisdom and biodiversity sanctuary',
            characteristics: [
              'Ancient wisdom',
              'Biodiversity',
              'Spiritual connection',
            ],
            culturalTraditions: [
              'Indigenous knowledge',
              'Animism',
              'Earth-based spirituality',
            ],
            focusAreas: [
              'Forest conservation',
              'Traditional medicine',
              'Sacred ecology',
            ],
          },
          'isolated-bastion': {
            id: 'isolated-bastion',
            name: 'Isolated Bastion',
            description: 'Self-sufficiency and community resilience stronghold',
            characteristics: [
              'Self-sufficiency',
              'Resilience',
              'Community autonomy',
            ],
            culturalTraditions: [
              'Survival skills',
              'Homesteading',
              'Mutual aid',
            ],
            focusAreas: [
              'Food sovereignty',
              'Local economies',
              'Disaster preparedness',
            ],
          },
        };

        const bioregion = bioregions[id as keyof typeof bioregions];

        if (!bioregion) {
          return reply.status(404).send({
            error: 'Bioregion not found',
            details: `Bioregion with ID '${id}' does not exist`,
          });
        }

        return reply.send(bioregion);
      } catch (error) {
        return reply.status(500).send({
          error: 'Failed to fetch bioregion',
          details: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    },
  );
}
