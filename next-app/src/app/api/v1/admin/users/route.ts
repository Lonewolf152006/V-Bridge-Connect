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
