import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getOptionalSession } from '@/lib/auth/get-session';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Helper to find or create a user with a valid UUID
async function resolveDbUser(userPayload: { id?: string; name?: string; email?: string; role?: string }) {
  const email = (userPayload.email || '').toLowerCase().trim();
  const name = userPayload.name || 'User';
  const role = (userPayload.role?.toLowerCase() || 'student') as any;

  // 1. Try finding by ID if valid UUID
  if (userPayload.id && UUID_REGEX.test(userPayload.id)) {
    const existing = await prisma.user.findUnique({ where: { id: userPayload.id } });
    if (existing) return existing;
  }

  // 2. Try finding by email
  if (email) {
    const existing = await prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
    });
    if (existing) return existing;
  }

  // 3. Try finding by name
  if (name) {
    const existing = await prisma.user.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
    });
    if (existing) return existing;
  }

  // 4. Create new user in DB so they have a persistent real UUID
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

// Helper to find or create a conversation for a channelId
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const channelId = searchParams.get('channelId') || 'mini-6-all';

    const conv = await prisma.conversation.findFirst({
      where: { name: channelId },
      include: {
        messages: {
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
      return NextResponse.json({
        success: true,
        channelId,
        data: [],
      });
    }

    const formattedMessages = conv.messages.map((m) => {
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

    return NextResponse.json({
      success: true,
      channelId,
      data: formattedMessages,
    });
  } catch (error: any) {
    console.error('[GET /api/messages error]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getOptionalSession().catch(() => null);
    const body = await request.json();
    const {
      channelId = 'mini-6-all',
      content,
      codeSnippet,
      senderId,
      senderName,
      senderEmail,
      role,
      attachmentUrl,
      attachmentName,
    } = body;

    let finalContent = (content || '').trim();
    if (codeSnippet?.code) {
      const lang = codeSnippet.language || 'python';
      finalContent = finalContent
        ? `${finalContent}\n\n\`\`\`${lang}\n${codeSnippet.code}\n\`\`\``
        : `\`\`\`${lang}\n${codeSnippet.code}\n\`\`\``;
    }

    if (!finalContent) {
      if (attachmentName) {
        finalContent = `Attached: ${attachmentName}`;
      } else {
        return NextResponse.json(
          { success: false, error: 'Message content cannot be empty' },
          { status: 400 }
        );
      }
    }

    // Resolve sender in database
    const dbSender = await resolveDbUser({
      id: session?.id || senderId,
      name: session?.name || senderName,
      email: session?.email || senderEmail,
      role: session?.role || role,
    });

    // Resolve conversation in database
    const conv = await resolveDbConversation(channelId);

    // Ensure sender is a participant
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

    // Create the message in database
    const createdMsg = await prisma.message.create({
      data: {
        conversationId: conv.id,
        senderId: dbSender.id,
        content: finalContent,
        attachmentUrl: attachmentUrl || undefined,
        attachmentName: attachmentName || undefined,
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

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: conv.id },
      data: { updatedAt: new Date() },
    });

    const responseMessage = {
      id: createdMsg.id,
      channelId,
      senderId: dbSender.id,
      senderName: createdMsg.sender?.name || dbSender.name,
      senderEmail: createdMsg.sender?.email || dbSender.email,
      role: (createdMsg.sender?.role?.toUpperCase() || dbSender.role.toUpperCase()) as any,
      timestamp: new Date(createdMsg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt: createdMsg.createdAt.toISOString(),
      text: content?.trim() || '',
      codeSnippet: codeSnippet || undefined,
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

    return NextResponse.json(
      { success: true, data: responseMessage },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[POST /api/messages error]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to send message' },
      { status: 500 }
    );
  }
}
