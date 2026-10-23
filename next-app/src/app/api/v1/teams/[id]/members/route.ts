// POST /api/v1/teams/[id]/members — Add member
// DELETE /api/v1/teams/[id]/members — Remove member (requires reason — FR-023)
// PATCH /api/v1/teams/[id]/members — Update member roles (FR-022)

import { z } from 'zod';
import { apiRoute, createSuccessResponse } from '@/lib/api/envelope';
import { teamService } from '@/lib/modules/team/team.service';

const addMemberSchema = z
  .object({
    userId: z.string().min(1, 'userId is required'),
    role: z.enum(['lead', 'contributor']).optional(),
    reason: z.string().max(500).optional(),
  })
  .strict();

const removeMemberSchema = z
  .object({
    userId: z.string().min(1, 'userId is required'),
    reason: z.string().min(1, 'reason is required for membership removal (FR-023)').max(500),
  })
  .strict();

const patchMemberSchema = z
  .object({
    newLeadUserId: z.string().optional(),
    memberRoles: z.record(z.string(), z.string()).optional(),
  })
  .strict();

export const POST = apiRoute(
  {
    requireAuth: true,
    roles: ['student', 'coordinator', 'super_admin'],
    idempotent: true,
    rateLimit: { limit: 30, windowMs: 60000 },
    bodySchema: addMemberSchema,
  },
  async ({ body, params, user, requestId }) => {
    const membership = await teamService.addMember(params.id, body, user);
    return createSuccessResponse(membership, { status: 201, requestId });
  }
);

export const DELETE = apiRoute(
  {
    requireAuth: true,
    roles: ['student', 'coordinator', 'super_admin'],
    rateLimit: { limit: 30, windowMs: 60000 },
    bodySchema: removeMemberSchema,
  },
  async ({ body, params, user, requestId }) => {
    const updated = await teamService.removeMember(params.id, body.userId, body.reason, user);
    return createSuccessResponse(updated, { requestId });
  }
);

export const PATCH = apiRoute(
  {
    requireAuth: true,
    roles: ['student', 'coordinator', 'super_admin', 'industry_partner'],
    rateLimit: { limit: 30, windowMs: 60000 },
    bodySchema: patchMemberSchema,
  },
  async ({ body, params, user, requestId }) => {
    if (body.newLeadUserId) {
      const result = await teamService.changeLead(params.id, body.newLeadUserId, user);
      return createSuccessResponse(result, { requestId });
    }

    if (body.memberRoles && typeof body.memberRoles === 'object') {
      const leadEntry = Object.entries(body.memberRoles).find(
        ([_, role]) => String(role).toUpperCase() === 'LEAD'
      );
      if (leadEntry) {
        const result = await teamService.changeLead(params.id, leadEntry[0], user);
        return createSuccessResponse(result, { requestId });
      }
    }

    return createSuccessResponse({ message: 'No role changes detected' }, { requestId });
  }
);
