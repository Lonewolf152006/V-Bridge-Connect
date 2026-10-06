// GET /api/v1/conversations/[id]/messages — Get messages with window filtering (FR-123, QA-07)
// POST /api/v1/conversations/[id]/messages — Send message (FR-120, FR-126)

import { NextRequest } from 'next/server';
import { messagingService } from '@/lib/modules/messaging/messaging.service';
import { MessagingAuthorizationError } from '@/lib/modules/messaging/messaging.relationship';
import { requireAuth } from '@/lib/auth/rbac';
import { AuthError } from '@/lib/auth/jwt';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;
    const messages = await messagingService.getMessages(id, user);
    return Response.json({ data: messages });
  } catch (error: any) {
    if (error instanceof AuthError) {
      return Response.json({ error: error.message }, { status: error.statusCode });
    }
    if (error instanceof MessagingAuthorizationError) {
      return Response.json({ error: error.message }, { status: error.statusCode });
    }
    return Response.json({ error: error.message || 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;
    const body = await request.json();

    if (!body.content) {
      return Response.json({ error: 'content is required' }, { status: 400 });
    }

    const message = await messagingService.sendMessage(id, body, user);
    return Response.json({ data: message }, { status: 201 });
  } catch (error: any) {
    if (error instanceof AuthError) {
      return Response.json({ error: error.message }, { status: error.statusCode });
    }
    if (error instanceof MessagingAuthorizationError) {
      return Response.json({ error: error.message }, { status: error.statusCode });
    }
    return Response.json({ error: error.message || 'Failed to send message' }, { status: 400 });
  }
}
