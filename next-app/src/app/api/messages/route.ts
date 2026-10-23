import { z } from 'zod';
import { apiRoute, createSuccessResponse, createErrorResponse } from '@/lib/api/envelope';
import prisma from '@/lib/db/prisma';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function resolveDbUser(userPayload: { id?: string; name?: string; email?: string; role?: string }) {
  const email = (userPayload.email || '').toLowerCase().trim();
  const name = userPayload.name || 'User';
  const role = (userPayload.role?.toLowerCase() || 'student') as any;

  if (userPayload.id && UUID_REGEX.test(userPayload.id)) {
    const existing = await prisma.user.findUnique({ where: { id: userPayload.id } });
    if (existing) return existing;
  }

  if (email) {
    const existing = await prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
    });
    if (existing) return existing;
  }

  if (name) {
    const existing = await prisma.user.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
    });
    if (existing) return existing;
  }

  const cleanEmail = email || `${name.toLowerCase().replace(/[^a-z0-9]/g, '.')}@vit.edu.in`;
  return prisma.user.create({
    data: {
      email: cleanEmail,
      name,
      role: role === 'coordinator' ? 'coordinator' : role === 'industry_partner' ? 'industry_partner' : role === 'super_admin' ? 'super_admin' : 'student',
      passwordHash: 'seeded-password-hash',
    },
  });
}

async function resolveDbConversation(channelId: string) {
  let conv = await prisma.conversation.findFirst({
    where: { name: channelId },
  });

  if (!conv) {
    const isDirect = channelId.startsWith('dm-');
    conv = await prisma.conversation.create({
      data: {
        name: channelId,
        type: isDirect ? 'direct' : 'group',
      },
    });
  }

  return conv;
}

const getMessagesQuerySchema = z
  .object({
    channelId: z.string().optional(),
    cursor: z.string().optional(),
    limit: z
      .union([z.string(), z.number()])
      .optional()
      .transform((v) => Math.min(Number(v) || 50, 50)),
  })
  .strict();

const postMessageSchema = z
  .object({
    channelId: z.string().default('mini-6-all'),
    content: z.string().optional(),
    codeSnippet: z
      .object({
        language: z.string().optional(),
        code: z.string(),
      })
      .optional(),
    senderId: z.string().optional(),
    senderName: z.string().optional(),
    senderEmail: z.string().optional(),
    role: z.string().optional(),
    attachmentUrl: z.string().optional(),
    attachmentName: z.string().optional(),
  })
  .strict();

export const GET = apiRoute(
  {
    requireAuth: true,
    rateLimit: { limit: 120, windowMs: 60000 },
    querySchema: getMessagesQuerySchema,
  },
  async ({ query, requestId }) => {
    const channelId = query.channelId || 'mini-6-all';
    const limit = query.limit || 50;

    const conv = await prisma.conversation.findFirst({
      where: { name: channelId },
      include: {
        messages: {
          take: limit + 1,
          orderBy: { createdAt: 'asc' },
          include: {
            sender: {
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
      },
    });

    if (!conv || conv.messages.length === 0) {
      return createSuccessResponse([], {
        requestId,
        pagination: { limit, hasMore: false },
      });
    }

    const hasMore = conv.messages.length > limit;
    const paginatedMsgs = hasMore ? conv.messages.slice(0, limit) : conv.messages;

    const formattedMessages = paginatedMsgs.map((m) => {
      let text = m.content;
      let codeSnippet: { language: string; code: string } | undefined = undefined;

      const codeMatch = m.content.match(/```(\w+)?\r?\n([\s\S]*?)\r?\n```/);
      if (codeMatch) {
        codeSnippet = {
          language: codeMatch[1] || 'python',
          code: codeMatch[2],
        };
        text = m.content.replace(codeMatch[0], '').trim();
      }

      return {
        id: m.id,
        channelId,
        senderId: m.senderId,
        senderName: m.sender?.name || 'User',
        senderEmail: m.sender?.email,
        role: (m.sender?.role?.toUpperCase() || 'STUDENT') as any,
        timestamp: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        createdAt: m.createdAt.toISOString(),
        text,
        codeSnippet,
        reactions: [],
        attachments: m.attachmentUrl
          ? [
              {
                id: `att-${m.id}`,
                name: m.attachmentName || 'Attachment',
                size: 'Uploaded',
                type: m.attachmentName?.endsWith('.pdf')
                  ? 'pdf'
                  : m.attachmentName?.match(/\.(png|jpg|jpeg|webp)$/i)
                  ? 'image'
                  : 'generic',
                url: m.attachmentUrl,
                previewUrl: m.attachmentUrl,
              },
            ]
          : undefined,
      };
    });

    return createSuccessResponse(formattedMessages, {
      requestId,
      pagination: {
        limit,
        hasMore,
        nextCursor: hasMore ? formattedMessages[formattedMessages.length - 1]?.id : null,
      },
    });
  }
);

export const POST = apiRoute(
  {
    requireAuth: true,
    idempotent: true,
    rateLimit: { limit: 60, windowMs: 60000 },
    bodySchema: postMessageSchema,
  },
  async ({ body, user, requestId }) => {
    let finalContent = (body.content || '').trim();
    if (body.codeSnippet?.code) {
      const lang = body.codeSnippet.language || 'python';
      finalContent = finalContent
        ? `${finalContent}\n\n\`\`\`${lang}\n${body.codeSnippet.code}\n\`\`\``
        : `\`\`\`${lang}\n${body.codeSnippet.code}\n\`\`\``;
    }

    if (!finalContent && !body.attachmentName) {
      return createErrorResponse('VALIDATION_ERROR', 'Message content or attachment is required', 422, requestId);
    }

    if (!finalContent && body.attachmentName) {
      finalContent = `Attached: ${body.attachmentName}`;
    }

    const dbSender = await resolveDbUser({
      id: user.userId || body.senderId,
      name: user.name || body.senderName,
      email: user.email || body.senderEmail,
      role: user.role || body.role,
    });

    const conv = await resolveDbConversation(body.channelId);

    const existingParticipant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId: conv.id,
        userId: dbSender.id,
        removedAt: null,
      },
    });

    if (!existingParticipant) {
      await prisma.conversationParticipant.create({
        data: {
          conversationId: conv.id,
          userId: dbSender.id,
        },
      });
    }

    const createdMsg = await prisma.message.create({
      data: {
        conversationId: conv.id,
        senderId: dbSender.id,
        content: finalContent,
        attachmentUrl: body.attachmentUrl || undefined,
        attachmentName: body.attachmentName || undefined,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            avatarUrl: true,
          },
        },
      },
    });

    await prisma.conversation.update({
      where: { id: conv.id },
      data: { updatedAt: new Date() },
    });

    const responseMessage = {
      id: createdMsg.id,
      channelId: body.channelId,
      senderId: dbSender.id,
      senderName: createdMsg.sender?.name || dbSender.name,
      senderEmail: createdMsg.sender?.email || dbSender.email,
      role: (createdMsg.sender?.role?.toUpperCase() || dbSender.role.toUpperCase()) as any,
      timestamp: new Date(createdMsg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt: createdMsg.createdAt.toISOString(),
      text: body.content?.trim() || '',
      codeSnippet: body.codeSnippet || undefined,
      reactions: [],
      attachments: createdMsg.attachmentUrl
        ? [
            {
              id: `att-${createdMsg.id}`,
              name: createdMsg.attachmentName || 'Attachment',
              size: 'Uploaded',
              type: createdMsg.attachmentName?.endsWith('.pdf')
                ? 'pdf'
                : createdMsg.attachmentName?.match(/\.(png|jpg|jpeg|webp)$/i)
                ? 'image'
                : 'generic',
              url: createdMsg.attachmentUrl,
              previewUrl: createdMsg.attachmentUrl,
            },
          ]
        : undefined,
    };

    return createSuccessResponse(responseMessage, { status: 201, requestId });
  }
);
