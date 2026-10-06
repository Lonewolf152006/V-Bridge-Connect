// VBridgeConnect — Messaging Repository
// FR-120 to FR-126: Group and Direct Workspace Chat with Participant Window Tracking

import prisma from '@/lib/db/prisma';

export const messagingRepository = {
  async findConversationById(id: string) {
    return prisma.conversation.findUnique({
      where: { id },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                avatarUrl: true,
              },
            },
          },
        },
        activity: { select: { id: true, title: true, departmentId: true } },
        team: { select: { id: true, name: true } },
      },
    });
  },

  async findDirectConversation(userAId: string, userBId: string) {
    return prisma.conversation.findFirst({
      where: {
        type: 'direct',
        AND: [
          { participants: { some: { userId: userAId, removedAt: null } } },
          { participants: { some: { userId: userBId, removedAt: null } } },
        ],
      },
      include: {
        participants: {
          include: {
            user: { select: { id: true, name: true, avatarUrl: true } },
          },
        },
      },
    });
  },

  async createGroupConversation(data: {
    name: string;
    activityId?: string;
    teamId?: string;
    participantUserIds: string[];
  }) {
    return prisma.$transaction(async (tx) => {
      const conv = await tx.conversation.create({
        data: {
          type: 'group',
          name: data.name,
          activityId: data.activityId,
          teamId: data.teamId,
        },
      });

      if (data.participantUserIds.length > 0) {
        await tx.conversationParticipant.createMany({
          data: data.participantUserIds.map((userId) => ({
            conversationId: conv.id,
            userId,
          })),
        });
      }

      return conv;
    });
  },

  async createDirectConversation(data: {
    userAId: string;
    userBId: string;
    activityId?: string;
    teamId?: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const conv = await tx.conversation.create({
        data: {
          type: 'direct',
          activityId: data.activityId,
          teamId: data.teamId,
        },
      });

      await tx.conversationParticipant.createMany({
        data: [
          { conversationId: conv.id, userId: data.userAId },
          { conversationId: conv.id, userId: data.userBId },
        ],
      });

      return conv;
    });
  },

  async findActiveParticipant(conversationId: string, userId: string) {
    return prisma.conversationParticipant.findFirst({
      where: {
        conversationId,
        userId,
        removedAt: null,
      },
    });
  },

  async findParticipantRecords(conversationId: string, userId: string) {
    return prisma.conversationParticipant.findMany({
      where: {
        conversationId,
        userId,
      },
      orderBy: { joinedAt: 'asc' },
    });
  },

  async removeParticipant(conversationId: string, userId: string) {
    return prisma.conversationParticipant.updateMany({
      where: {
        conversationId,
        userId,
        removedAt: null,
      },
      data: {
        removedAt: new Date(),
      },
    });
  },

  async listUserConversations(userId: string) {
    return prisma.conversation.findMany({
      where: {
        participants: {
          some: {
            userId,
            removedAt: null,
          },
        },
      },
      include: {
        participants: {
          where: { removedAt: null },
          include: {
            user: { select: { id: true, name: true, role: true, avatarUrl: true } },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            content: true,
            createdAt: true,
            sender: { select: { id: true, name: true } },
          },
        },
        activity: { select: { id: true, title: true } },
        team: { select: { id: true, name: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  },

  async listMessages(conversationId: string) {
    return prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: {
          select: { id: true, name: true, role: true, avatarUrl: true },
        },
      },
    });
  },

  async createMessage(data: {
    conversationId: string;
    senderId: string;
    content: string;
    attachmentUrl?: string;
    attachmentName?: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const message = await tx.message.create({
        data: {
          conversationId: data.conversationId,
          senderId: data.senderId,
          content: data.content,
          attachmentUrl: data.attachmentUrl,
          attachmentName: data.attachmentName,
        },
        include: {
          sender: { select: { id: true, name: true, role: true } },
        },
      });

      // Update conversation updatedAt timestamp
      await tx.conversation.update({
        where: { id: data.conversationId },
        data: { updatedAt: new Date() },
      });

      return message;
    });
  },
};
