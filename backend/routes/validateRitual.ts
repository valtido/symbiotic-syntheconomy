// backend/routes/validateRitual.ts

import { FastifyInstance } from 'fastify';
import { RitualData, validateRitual } from '../../scripts/ritualValidator';

export async function validateRitualRoute(fastify: FastifyInstance) {
  fastify.post('/api/validate-ritual', async (req, res) => {
    const data = req.body as RitualData;

    const result = validateRitual(data);

    return res.send(result);
  });
}
