import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import bcrypt from 'bcryptjs';

export async function GET(req: NextRequest) {
  try {
    const users = await prisma.user.findMany({
      include: {
        department: { select: { id: true, name: true, code: true } },
        _count: {
          select: {
            teamMemberships: { where: { removedAt: null } },
            guidedTeams: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role.toUpperCase(),
      department: u.department?.name || 'Electronics and Computer Science',
      institutionalId: u.institutionalId || u.facultyCode || 'N/A',
      avatarUrl:
        u.avatarUrl ||
        `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(u.name)}`,
      createdAt: u.createdAt.toISOString(),
      activeTeamsCount: u._count.teamMemberships + u._count.guidedTeams,
    }));

    return NextResponse.json({ users: formatted });
  } catch (error: any) {
    console.error('[API /api/v1/admin/users GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, role, departmentName, institutionalId } = body;

    if (!name || !email || !role) {
      return NextResponse.json(
        { error: 'Name, email, and role are required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return NextResponse.json(
        { error: `User with email "${normalizedEmail}" already exists` },
        { status: 409 }
      );
    }

    // Find or create department
    const deptName = departmentName || 'Electronics and Computer Science';
    let dept = await prisma.department.findFirst({
      where: { name: deptName },
    });

    if (!dept) {
      // Find or create college
      let college = await prisma.college.findFirst({ where: { code: 'VIT' } });
      if (!college) {
        college = await prisma.college.create({
          data: { name: 'Vidyalankar Institute of Technology', code: 'VIT' },
        });
      }
      dept = await prisma.department.create({
        data: {
          name: deptName,
          code: deptName.split(' ').map((w: string) => w[0]).join('').toUpperCase() || 'DEPT',
          collegeId: college.id,
        },
      });
    }

    const mappedRole = role.toLowerCase();
    const defaultPasswordHash = await bcrypt.hash('Test1234!', 10);

    const newUser = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        role: mappedRole as any,
        departmentId: dept.id,
        institutionalId: institutionalId || undefined,
        passwordHash: defaultPasswordHash,
        facultyCode: mappedRole === 'coordinator' ? `FAC-${name.split(' ').pop()?.toUpperCase() || 'USER'}-2026` : undefined,
      },
      include: {
        department: true,
      },
    });

    // Record audit event
    await prisma.auditEvent.create({
      data: {
        action: 'INSTITUTIONAL_USER_CREATED',
        entityType: 'user',
        entityId: newUser.id,
        reason: `New institutional member ${newUser.name} provisioned with role ${newUser.role}.`,
        newValue: {
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          department: dept.name,
        },
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role.toUpperCase(),
        department: newUser.department?.name || deptName,
        institutionalId: newUser.institutionalId || newUser.facultyCode || 'N/A',
        avatarUrl: `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(newUser.name)}`,
      },
    });
  } catch (error: any) {
    console.error('[API /api/v1/admin/users POST] Error:', error);
    return NextResponse.json(
      { error: 'Failed to create user', details: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, role, departmentName, institutionalId } = body;

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({
      where: { id },
      include: { department: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let deptId = existing.departmentId;
    if (departmentName && departmentName !== existing.department?.name) {
      let dept = await prisma.department.findFirst({ where: { name: departmentName } });
      if (!dept) {
        let college = await prisma.college.findFirst({ where: { code: 'VIT' } });
        if (!college) {
          college = await prisma.college.create({
            data: { name: 'Vidyalankar Institute of Technology', code: 'VIT' },
          });
        }
        dept = await prisma.department.create({
          data: {
            name: departmentName,
            code: departmentName.split(' ').map((w: string) => w[0]).join('').toUpperCase() || 'DEPT',
            collegeId: college.id,
          },
        });
      }
      deptId = dept.id;
    }

    const mappedRole = role ? (role.toLowerCase() as any) : existing.role;

    const updated = await prisma.user.update({
      where: { id },
      data: {
        role: mappedRole,
        departmentId: deptId,
        institutionalId: institutionalId !== undefined ? institutionalId : existing.institutionalId,
      },
      include: {
        department: true,
      },
    });

    await prisma.auditEvent.create({
      data: {
        action: 'INSTITUTIONAL_USER_ROLE_UPDATED',
        entityType: 'user',
        entityId: updated.id,
        reason: `Administrator updated role for ${updated.name} to ${updated.role}.`,
        priorValue: { role: existing.role, department: existing.department?.name },
        newValue: { role: updated.role, department: updated.department?.name },
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        role: updated.role.toUpperCase(),
        department: updated.department?.name || 'Electronics and Computer Science',
        institutionalId: updated.institutionalId || updated.facultyCode || 'N/A',
        avatarUrl:
          updated.avatarUrl ||
          `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(updated.name)}`,
      },
    });
  } catch (error: any) {
    console.error('[API /api/v1/admin/users PATCH] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update user', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let id = searchParams.get('id');

    if (!id) {
      try {
        const body = await req.json();
        id = body?.id;
      } catch {}
    }

    if (!id) {
      return NextResponse.json({ error: 'User ID is required for deletion' }, { status: 400 });
    }

    const userToDelete = await prisma.user.findUnique({
      where: { id },
      include: {
        ownedActivities: { select: { id: true } },
      },
    });

    if (!userToDelete) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // If user owns activities, reassign or warn
    if (userToDelete.ownedActivities.length > 0) {
      const fallbackAdmin = await prisma.user.findFirst({
        where: { role: 'super_admin', id: { not: id } },
      });
      if (fallbackAdmin) {
        await prisma.activity.updateMany({
          where: { ownerId: id },
          data: { ownerId: fallbackAdmin.id },
        });
      } else {
        return NextResponse.json(
          { error: 'Cannot delete user because they own active academic initiatives. Please reassign ownership first.' },
          { status: 400 }
        );
      }
    }

    // Safely remove relations
    await prisma.notification.deleteMany({ where: { userId: id } });
    await prisma.conversationParticipant.deleteMany({ where: { userId: id } });
    await prisma.message.deleteMany({ where: { senderId: id } });
    await prisma.teamMembership.deleteMany({ where: { userId: id } });
    await prisma.team.updateMany({ where: { mentorId: id }, data: { mentorId: null } });
    await prisma.team.updateMany({ where: { industryMentorId: id }, data: { industryMentorId: null } });
    await prisma.submission.updateMany({ where: { reviewerId: id }, data: { reviewerId: null } });
    await prisma.application.updateMany({ where: { reviewerId: id }, data: { reviewerId: null } });
    await prisma.certificate.updateMany({ where: { revokedById: id }, data: { revokedById: null } });
    await prisma.certificate.deleteMany({ where: { studentId: id } });
    await prisma.submission.deleteMany({ where: { submittedById: id } });
    await prisma.application.deleteMany({ where: { applicantId: id } });
    await prisma.rosterInvitation.deleteMany({ where: { claimedById: id } });

    // Delete the user record
    await prisma.user.delete({ where: { id } });

    // Record in immutable audit ledger
    await prisma.auditEvent.create({
      data: {
        action: 'INSTITUTIONAL_USER_DELETED',
        entityType: 'user',
        entityId: id,
        reason: `Administrator deleted user ${userToDelete.name} (${userToDelete.email}) and revoked all institutional permissions.`,
        priorValue: {
          name: userToDelete.name,
          email: userToDelete.email,
          role: userToDelete.role,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: `User ${userToDelete.name} permanently deleted and permissions revoked.`,
    });
  } catch (error: any) {
    console.error('[API /api/v1/admin/users DELETE] Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete user', details: error.message },
      { status: 500 }
    );
  }
}
