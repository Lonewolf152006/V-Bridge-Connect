// GET /api/v1/conversations/[id] — Conversation details

import { NextRequest } from 'next/server';
import { messagingRepository } from '@/lib/modules/messaging/messaging.repository';
import { requireAuth } from '@/lib/auth/rbac';
import { AuthError } from '@/lib/auth/jwt';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;
    const conversation = await messagingRepository.findConversationById(id);

    if (!conversation) {
      return Response.json({ error: 'Conversation not found' }, { status: 404 });
    }

    const isParticipant = conversation.participants.some(
      (p) => p.userId === user.userId && p.removedAt === null
    );

    if (!isParticipant && user.role !== 'super_admin') {
      return Response.json(
        { error: 'You are not a member of this conversation' },
        { status: 403 }
      );
    }

    return Response.json({ data: conversation });
  } catch (error: any) {
    if (error instanceof AuthError) {
      return Response.json({ error: error.message }, { status: error.statusCode });
    }
    return Response.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
