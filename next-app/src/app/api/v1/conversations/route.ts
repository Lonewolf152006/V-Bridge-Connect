// POST /api/v1/conversations — Create direct (FR-121, FR-122) or group (FR-120) conversation
// GET /api/v1/conversations — List current user's conversations

import { NextRequest } from 'next/server';
import { messagingService } from '@/lib/modules/messaging/messaging.service';
import { MessagingAuthorizationError } from '@/lib/modules/messaging/messaging.relationship';
import { requireAuth } from '@/lib/auth/rbac';
import { AuthError } from '@/lib/auth/jwt';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();

    if (body.type === 'direct') {
      if (!body.targetUserId) {
        return Response.json({ error: 'targetUserId is required for direct chat' }, { status: 400 });
      }
      const conv = await messagingService.getOrCreateDirectConversation(body.targetUserId, user);
      return Response.json({ data: conv }, { status: 201 });
    }

    if (body.type === 'group') {
      if (!body.name) {
        return Response.json({ error: 'name is required for group chat' }, { status: 400 });
      }
      const conv = await messagingService.createGroupConversation(body, user);
      return Response.json({ data: conv }, { status: 201 });
    }

    return Response.json({ error: 'type must be "direct" or "group"' }, { status: 400 });
  } catch (error: any) {
    if (error instanceof AuthError) {
      return Response.json({ error: error.message }, { status: error.statusCode });
    }
    if (error instanceof MessagingAuthorizationError) {
      return Response.json({ error: error.message }, { status: error.statusCode });
    }
    return Response.json({ error: error.message || 'Failed to create conversation' }, { status: 400 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const conversations = await messagingService.listMyConversations(user);
    return Response.json({ data: conversations });
  } catch (error: any) {
    if (error instanceof AuthError) {
      return Response.json({ error: error.message }, { status: error.statusCode });
    }
    return Response.json({ error: error.message || 'Failed to list conversations' }, { status: 500 });
  }
}
