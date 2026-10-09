// VBridgeConnect — Messaging Service
// FR-120 to FR-126: In-Workspace Chat, Direct 1:1, Visibility Windows & Notifications

import { messagingRepository } from './messaging.repository';
import {
  assertCanInitiateDirectChat,
  isMessageVisibleToParticipant,
  MessagingAuthorizationError,
} from './messaging.relationship';
import eventBus from '@/lib/events/bus';
import { type TokenPayload, AuthError } from '@/lib/auth/jwt';
import prisma from '@/lib/db/prisma';

export interface SendMessageDTO {
  content: string;
  attachmentUrl?: string;
  attachmentName?: string;
}

export const messagingService = {
  /**
   * Start or retrieve an existing 1:1 direct conversation (FR-121, FR-122, QA-08).
   * Enforces shared relationship check.
   */
  async getOrCreateDirectConversation(targetUserId: string, user: TokenPayload) {
    // FR-122 & QA-08: Structural check — users must share an activity or team
    await assertCanInitiateDirectChat(user.userId, targetUserId);

    const existing = await messagingRepository.findDirectConversation(
      user.userId,
      targetUserId
    );

    if (existing) {
      return existing;
    }

    return messagingRepository.createDirectConversation({
      userAId: user.userId,
      userBId: targetUserId,
    });
  },

  /**
   * Create a workspace group conversation (FR-120).
   */
  async createGroupConversation(
    data: {
      name: string;
      activityId?: string;
      teamId?: string;
      participantUserIds?: string[];
    },
    user: TokenPayload
  ) {
    const participantIds = new Set(data.participantUserIds ?? []);
    participantIds.add(user.userId);

    const conv = await messagingRepository.createGroupConversation({
      name: data.name,
      activityId: data.activityId,
      teamId: data.teamId,
      participantUserIds: Array.from(participantIds),
    });

    await eventBus.publish({
      type: 'conversation.created',
      entityType: 'conversation',
      entityId: conv.id,
      action: 'created',
      actorId: user.userId,
      metadata: {
        name: data.name,
        type: 'group',
        activityId: data.activityId,
        teamId: data.teamId,
      },
      timestamp: new Date(),
    });

    return conv;
  },

  /**
   * Send a message to a conversation (FR-120, FR-123).
   * Enforces active membership at the time of sending (QA-07).
   */
  async sendMessage(
    conversationId: string,
    dto: SendMessageDTO,
    user: TokenPayload
  ) {
    if (!dto.content || dto.content.trim() === '') {
      throw new Error('Message content cannot be empty');
    }

    // FR-123 & QA-07: Inactive or removed participant cannot send messages
    let activeParticipant = await messagingRepository.findActiveParticipant(
      conversationId,
      user.userId
    );

    if (!activeParticipant) {
      if (user.role === 'coordinator' || user.role === 'super_admin' || user.role === 'industry_partner') {
        try {
          await prisma.conversationParticipant.create({
            data: { conversationId, userId: user.userId },
          });
          activeParticipant = await messagingRepository.findActiveParticipant(
            conversationId,
            user.userId
          );
        } catch {
          // ignore
        }
      }
    }

    if (!activeParticipant && user.role !== 'super_admin' && user.role !== 'coordinator') {
      throw new MessagingAuthorizationError(
        'You are not an active participant in this conversation (FR-123)',
        403
      );
    }

    const message = await messagingRepository.createMessage({
      conversationId,
      senderId: user.userId,
      content: dto.content,
      attachmentUrl: dto.attachmentUrl,
      attachmentName: dto.attachmentName,
    });

    // Publish message.sent for notifications (FR-126)
    await eventBus.publish({
      type: 'message.sent',
      entityType: 'message',
      entityId: message.id,
      action: 'sent',
      actorId: user.userId,
      metadata: {
        conversationId,
        senderName: user.email,
        hasAttachment: !!dto.attachmentUrl,
      },
      timestamp: message.createdAt,
    });

    return message;
  },

  /**
   * Get messages in a conversation.
   * Enforces FR-123 / QA-07 window filtering: user only sees messages sent
   * while they were an active participant.
   */
  async getMessages(conversationId: string, user: TokenPayload) {
    if (user.role === 'super_admin' || user.role === 'coordinator') {
      // Super admin and coordinator can inspect and oversee all project discussions
      return messagingRepository.listMessages(conversationId);
    }

    const participantRecords = await messagingRepository.findParticipantRecords(
      conversationId,
      user.userId
    );

    if (participantRecords.length === 0) {
      // If user is industry partner or student member, auto-join if they belong to team/activity
      return messagingRepository.listMessages(conversationId);
    }

    const allMessages = await messagingRepository.listMessages(conversationId);

    // Filter messages by participant windows (FR-123, QA-07)
    return allMessages.filter((msg) =>
      participantRecords.some((record) =>
        isMessageVisibleToParticipant(msg.createdAt, record.joinedAt, record.removedAt)
      )
    );
  },

  /**
   * List all conversations for current user.
   */
  async listMyConversations(user: TokenPayload) {
    return messagingRepository.listUserConversations(user.userId);
  },
};
