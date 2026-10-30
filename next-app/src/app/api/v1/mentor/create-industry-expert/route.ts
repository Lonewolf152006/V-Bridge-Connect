// POST /api/v1/mentor/create-industry-expert
// Enables Faculty Guides (coordinators) to provision an Industry Expert login directly,
// assign them to student groups, and generate a ready-to-share access credential & invite message.

import { NextRequest, NextResponse } from 'next/server';
import { getOptionalSession } from '@/lib/auth/get-session';
import prisma from '@/lib/db/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const createIndustryExpertSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Valid work email is required'),
  company: z.string().optional(),
  designation: z.string().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  teamIds: z.array(z.string()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const sessionUser = await getOptionalSession();
    if (!sessionUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (sessionUser.role !== 'coordinator' && sessionUser.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Only faculty mentors can provision industry expert logins.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = createIndustryExpertSchema.safeParse(body);
    if (!parsed.success) {
      const firstErr = parsed.error.issues[0]?.message || 'Invalid input';
      return NextResponse.json({ success: false, error: firstErr }, { status: 400 });
    }

    const { name, company, designation, teamIds } = parsed.data;
    const cleanEmail = parsed.data.email.trim().toLowerCase();

    // Default friendly password if not supplied
    const cleanCompany = (company || 'Industry').replace(/[^a-zA-Z0-9]/g, '');
    const defaultPassword = parsed.data.password || `${cleanCompany}@2026`;
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    // Fetch faculty user details and their faculty invite code
    const facultyUser = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: { id: true, name: true, email: true, facultyCode: true, departmentId: true },
    });

    const facultyCode = facultyUser?.facultyCode || 'FAC-GUIDE-2026';
    const facultyName = facultyUser?.name || 'Faculty Guide';

    // 1. Create or update the Industry Expert user
    let expertUser = await prisma.user.findFirst({
      where: { email: { equals: cleanEmail, mode: 'insensitive' } },
    });

    if (expertUser) {
      expertUser = await prisma.user.update({
        where: { id: expertUser.id },
        data: {
          name: name.trim(),
          role: 'industry_partner',
          passwordHash: passwordHash,
          departmentId: facultyUser?.departmentId || expertUser.departmentId,
        },
      });
    } else {
      expertUser = await prisma.user.create({
        data: {
          name: name.trim(),
          email: cleanEmail,
          role: 'industry_partner',
          passwordHash: passwordHash,
          departmentId: facultyUser?.departmentId || undefined,
        },
      });
    }

    // 2. Determine target student teams guided by this faculty guide
    let assignedTeamNames: string[] = [];
    let targetTeams = [];

    if (teamIds && teamIds.length > 0) {
      targetTeams = await prisma.team.findMany({
        where: {
          id: { in: teamIds },
          mentorId: sessionUser.id,
        },
        include: { conversations: { where: { type: 'group' }, take: 1 } },
      });
    } else {
      // Default: Assign to all teams mentored by this faculty guide
      targetTeams = await prisma.team.findMany({
        where: { mentorId: sessionUser.id },
        include: { conversations: { where: { type: 'group' }, take: 1 } },
      });
    }

    // 3. Bind expert to each team and add to conversation channel
    for (const team of targetTeams) {
      await prisma.team.update({
        where: { id: team.id },
        data: { industryMentorId: expertUser.id },
      });
      assignedTeamNames.push(team.name);

      if (team.conversations.length > 0) {
        const conv = team.conversations[0];
        const existingParticipant = await prisma.conversationParticipant.findFirst({
          where: { conversationId: conv.id, userId: expertUser.id },
        });
        if (!existingParticipant) {
          await prisma.conversationParticipant.create({
            data: {
              conversationId: conv.id,
              userId: expertUser.id,
            },
          });
        }
      }
    }

    // 4. Log audit event
    await prisma.auditEvent.create({
      data: {
        action: 'INDUSTRY_EXPERT_PROVISIONED_BY_FACULTY',
        entityType: 'user',
        entityId: expertUser.id,
        actorId: sessionUser.id,
        reason: `Faculty ${facultyName} provisioned industry expert login for ${name} (${company || 'Industry Partner'}).`,
        newValue: {
          expertId: expertUser.id,
          name: expertUser.name,
          email: expertUser.email,
          company: company || 'N/A',
          teamsAssigned: assignedTeamNames,
          facultyCode,
        },
      },
    });

    const origin = process.env.NEXTAUTH_URL || 'https://v-bridge-connect.vercel.app';
    const loginUrl = `${origin}/login?tab=industry&email=${encodeURIComponent(cleanEmail)}`;

    const shareableMessage = `Dear ${name.trim()},

You have been provisioned as an Industry Co-Mentor on VBridgeConnect by ${facultyName} for student project teams: ${assignedTeamNames.length > 0 ? assignedTeamNames.join(', ') : 'All Assigned Cohort Groups'}.

Login Credentials:
• Portal Link: ${loginUrl}
• Role Tab: Industry Expert
• Email: ${cleanEmail}
• Temporary Password: ${defaultPassword}
• Faculty Mentor Code: ${facultyCode}

You can immediately review student code commits, schedule delivery milestones, and co-evaluate deliverables.`;

    return NextResponse.json({
      success: true,
      message: `Industry Expert account successfully created for ${name.trim()}!`,
      data: {
        expert: {
          id: expertUser.id,
          name: expertUser.name,
          email: expertUser.email,
          company: company || 'Industry Co-Mentor',
          designation: designation || '',
        },
        credentials: {
          email: cleanEmail,
          password: defaultPassword,
          facultyCode,
          loginUrl,
        },
        teamsAssigned: assignedTeamNames,
        shareableMessage,
      },
    });
  } catch (error: any) {
    console.error('[CreateIndustryExpert API Error]:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to create industry expert account.' },
      { status: 500 }
    );
  }
}

