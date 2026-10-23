import { z } from 'zod';
import { apiRoute, createSuccessResponse, createErrorResponse } from '@/lib/api/envelope';
import prisma from '@/lib/db/prisma';
import bcrypt from 'bcryptjs';

const getUsersQuerySchema = z
  .object({
    role: z.enum(['student', 'coordinator', 'super_admin', 'industry_partner', 'faculty']).optional(),
    cursor: z.string().optional(),
    limit: z
      .union([z.string(), z.number()])
      .optional()
      .transform((v) => Math.min(Number(v) || 50, 50)),
  })
  .strict();

const createUserSchema = z
  .object({
    name: z.string().min(1, 'Name is required').max(150),
    email: z.string().email('Valid email is required'),
    role: z.string().min(1, 'Role is required'),
    departmentName: z.string().max(150).optional(),
    institutionalId: z.string().max(50).optional(),
  })
  .strict();

const patchUserSchema = z
  .object({
    id: z.string().min(1, 'User ID is required'),
    role: z.string().optional(),
    departmentName: z.string().optional(),
    institutionalId: z.string().optional(),
  })
  .strict();

export const GET = apiRoute(
  {
    requireAuth: true,
    roles: ['super_admin', 'coordinator'],
    rateLimit: { limit: 120, windowMs: 60000 },
    querySchema: getUsersQuerySchema,
  },
  async ({ query, requestId }) => {
    const limit = query.limit || 50;

    const users = await prisma.user.findMany({
      where: query.role ? { role: query.role as any } : undefined,
      take: limit + 1,
      ...(query.cursor ? { skip: 1, cursor: { id: query.cursor } } : {}),
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

    const hasMore = users.length > limit;
    const paginated = hasMore ? users.slice(0, limit) : users;

    const formatted = paginated.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role.toUpperCase(),
      department: u.department?.name || 'Electronics and Computer Science',
      institutionalId: u.institutionalId || u.facultyCode || 'N/A',
      avatarUrl: u.avatarUrl || '',
      createdAt: u.createdAt.toISOString(),
      activeTeamsCount: u._count.teamMemberships + u._count.guidedTeams,
    }));

    // Backwards compatible payload with both `data` and `users`
    const nextCursor = hasMore ? paginated[paginated.length - 1]?.id : null;
    return createSuccessResponse(formatted, {
      requestId,
      pagination: {
        limit,
        hasMore,
        nextCursor,
        total: users.length,
      },
      headers: {
        'x-user-count': String(formatted.length),
      },
    });
  }
);

export const POST = apiRoute(
  {
    requireAuth: true,
    roles: ['super_admin', 'coordinator'],
    idempotent: true,
    rateLimit: { limit: 30, windowMs: 60000 },
    bodySchema: createUserSchema,
  },
  async ({ body, requestId }) => {
    const normalizedEmail = body.email.toLowerCase().trim();

    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return createErrorResponse(
        'CONFLICT',
        `User with email "${normalizedEmail}" already exists`,
        409,
        requestId,
        [{ field: 'email', message: 'Email is already registered' }]
      );
    }

    const deptName = body.departmentName || 'Electronics and Computer Science';
    let dept = await prisma.department.findFirst({
      where: { name: deptName },
    });

    if (!dept) {
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

    const mappedRole = body.role.toLowerCase();
    const defaultPasswordHash = await bcrypt.hash('Test1234!', 10);

    const newUser = await prisma.user.create({
      data: {
        name: body.name.trim(),
        email: normalizedEmail,
        role: mappedRole as any,
        departmentId: dept.id,
        institutionalId: body.institutionalId || undefined,
        passwordHash: defaultPasswordHash,
        facultyCode:
          mappedRole === 'coordinator'
            ? `FAC-${body.name.trim().split(' ').pop()?.toUpperCase() || 'USER'}-2026`
            : undefined,
      },
      include: {
        department: true,
      },
    });

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

    const userPayload = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role.toUpperCase(),
      department: newUser.department?.name || deptName,
      institutionalId: newUser.institutionalId || newUser.facultyCode || 'N/A',
      avatarUrl: newUser.avatarUrl || '',
    };

    return createSuccessResponse(userPayload, { status: 201, requestId });
  }
);

export const PATCH = apiRoute(
  {
    requireAuth: true,
    roles: ['super_admin', 'coordinator'],
    rateLimit: { limit: 30, windowMs: 60000 },
    bodySchema: patchUserSchema,
  },
  async ({ body, requestId }) => {
    const { id, role, departmentName, institutionalId } = body;

    const existing = await prisma.user.findUnique({
      where: { id },
      include: { department: true },
    });

    if (!existing) {
      return createErrorResponse('NOT_FOUND', 'User not found', 404, requestId);
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

    return createSuccessResponse(
      {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        role: updated.role.toUpperCase(),
        department: updated.department?.name || 'Electronics and Computer Science',
        institutionalId: updated.institutionalId || updated.facultyCode || 'N/A',
        avatarUrl: updated.avatarUrl || '',
      },
      { requestId }
    );
  }
);
