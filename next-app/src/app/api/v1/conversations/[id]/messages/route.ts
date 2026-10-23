// GET /api/v1/conversations/[id]/messages — Get messages with window filtering (FR-123, QA-07)
// POST /api/v1/conversations/[id]/messages — Send message (FR-120, FR-126)
// Strictly idempotent with Phase B unified error envelope & RBAC

import { z } from 'zod';
import { apiRoute, createSuccessResponse } from '@/lib/api/envelope';
import { messagingService } from '@/lib/modules/messaging/messaging.service';

const sendMessageSchema = z
  .object({
    content: z.string().min(1, 'content is required').max(10000),
    attachmentUrl: z.string().url().optional(),
    attachmentName: z.string().max(255).optional(),
  })
  .strict();

const getMessagesQuerySchema = z
  .object({
    cursor: z.string().optional(),
    limit: z
      .union([z.string(), z.number()])
      .optional()
      .transform((v) => Math.min(Number(v) || 50, 50)),
  })
  .strict();

export const GET = apiRoute<any, any, { id: string }>(
  {
    requireAuth: true,
    rateLimit: { limit: 120, windowMs: 60000 },
    querySchema: getMessagesQuerySchema,
  },
  async ({ params, query, user, requestId }) => {
    const limit = query.limit || 50;
    const messages = await messagingService.getMessages(params.id, user);
    const paginated = messages.slice(0, limit);

    return createSuccessResponse(paginated, {
      requestId,
      pagination: {
        limit,
        hasMore: messages.length > limit,
        nextCursor: messages.length > limit ? paginated[paginated.length - 1]?.id : null,
        total: messages.length,
      },
    });
  }
);

export const POST = apiRoute<{ content: string; attachmentUrl?: string; attachmentName?: string }, any, { id: string }>(
  {
    requireAuth: true,
    idempotent: true,
    rateLimit: { limit: 60, windowMs: 60000 },
    bodySchema: sendMessageSchema,
  },
  async ({ params, body, user, requestId }) => {
    const message = await messagingService.sendMessage(params.id, body, user);
    return createSuccessResponse(message, { status: 201, requestId });
  }
);
