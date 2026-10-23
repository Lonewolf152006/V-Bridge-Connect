// POST /api/v1/teams/[id]/lead — Reassign single team lead (FR-022)
// Strictly idempotent with Phase B unified error envelope & RBAC

import { z } from 'zod';
import { apiRoute, createSuccessResponse } from '@/lib/api/envelope';
import { teamService } from '@/lib/modules/team/team.service';

const changeLeadSchema = z
  .object({
    newLeadUserId: z.string().min(1, 'newLeadUserId is required'),
  })
  .strict();

export const POST = apiRoute<{ newLeadUserId: string }, any, { id: string }>(
  {
    requireAuth: true,
    roles: ['student', 'coordinator', 'super_admin', 'industry_partner'],
    idempotent: true,
    rateLimit: { limit: 30, windowMs: 60000 },
    bodySchema: changeLeadSchema,
  },
  async ({ body, params, user, requestId }) => {
    const result = await teamService.changeLead(params.id, body.newLeadUserId, user);
    return createSuccessResponse(result, { requestId });
  }
);

export const PATCH = POST;
