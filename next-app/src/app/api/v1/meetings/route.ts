import { z } from 'zod';
import { apiRoute, createSuccessResponse, createErrorResponse } from '@/lib/api/envelope';
import fs from 'fs';
import path from 'path';
import prisma from '@/lib/db/prisma';

export interface PlannedMeeting {
  id: string;
  teamId: string;
  title: string;
  scheduledAt: string;
  agenda?: string;
  meetLink?: string;
  hostName: string;
  hostRole?: string;
  createdAt: string;
  updatedAt: string;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'meetings.json');

async function resolveTeamAliases(teamId: string): Promise<string[]> {
  const aliases = new Set<string>([teamId.toLowerCase().trim()]);
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(teamId);
  const normalized = teamId.replace(/^team-/i, '').replace(/-/g, ' ').trim();
  const digits = teamId.match(/\d+/)?.[0];

  try {
    const team = await prisma.team.findFirst({
      where: {
        OR: [
          ...(isUuid ? [{ id: teamId }] : []),
          { name: { equals: teamId, mode: 'insensitive' as const } },
          { name: { equals: normalized, mode: 'insensitive' as const } },
          ...(digits ? [{ name: { contains: digits, mode: 'insensitive' as const } }] : []),
        ],
      },
    });
    if (team) {
      aliases.add(team.id.toLowerCase());
      aliases.add(team.name.toLowerCase());
      aliases.add(`team-${team.name.toLowerCase().replace(/\s+/g, '-')}`);
      aliases.add(team.name.toLowerCase().replace(/\s+/g, ''));
    }
  } catch (e) {
    console.warn('[Meetings API] resolveTeamAliases warning:', e);
  }
  return Array.from(aliases);
}

async function getStoredMeetings(): Promise<PlannedMeeting[]> {
  const meetingMap = new Map<string, PlannedMeeting>();

  try {
    const dbEvents = await prisma.auditEvent.findMany({
      where: { entityType: 'meeting' },
      orderBy: { createdAt: 'desc' },
    });
    for (const evt of dbEvents) {
      if (evt.newValue && typeof evt.newValue === 'object') {
        const m = evt.newValue as unknown as PlannedMeeting;
        if (m.id && m.teamId && m.title) {
          meetingMap.set(m.id, m);
        }
      }
    }
  } catch (dbErr) {
    console.warn('[Meetings API] Error fetching DB meetings:', dbErr);
  }

  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = await fs.promises.readFile(DATA_FILE, 'utf-8');
      const fileMeetings: PlannedMeeting[] = JSON.parse(raw);
      for (const m of fileMeetings) {
        if (!meetingMap.has(m.id)) {
          meetingMap.set(m.id, m);
        }
      }
    }
  } catch (err) {
    console.warn('[Meetings API] Error reading meetings file:', err);
  }

  return Array.from(meetingMap.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

async function saveStoredMeetings(meetings: PlannedMeeting[]): Promise<void> {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      await fs.promises.mkdir(DATA_DIR, { recursive: true });
    }
    await fs.promises.writeFile(DATA_FILE, JSON.stringify(meetings, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[Meetings API] File write warning (expected in read-only lambdas):', err);
  }
}

const getMeetingsQuerySchema = z
  .object({
    teamId: z.string().optional(),
    cursor: z.string().optional(),
    limit: z
      .union([z.string(), z.number()])
      .optional()
      .transform((v) => Math.min(Number(v) || 50, 50)),
  })
  .strict();

const createMeetingSchema = z
  .object({
    teamId: z.string().min(1, 'teamId is required'),
    title: z.string().min(1, 'title is required').max(200),
    scheduledAt: z.string().min(1, 'scheduledAt is required'),
    agenda: z.string().max(2000).optional(),
    meetLink: z.string().optional(),
    hostName: z.string().max(100).optional(),
    hostRole: z.string().max(100).optional(),
  })
  .strict();

const patchMeetingSchema = z
  .object({
    meetingId: z.string().min(1, 'meetingId is required'),
    meetLink: z.string().optional(),
  })
  .strict();

export const GET = apiRoute(
  {
    requireAuth: true,
    rateLimit: { limit: 120, windowMs: 60000 },
    querySchema: getMeetingsQuerySchema,
  },
  async ({ query, requestId }) => {
    const all = await getStoredMeetings();
    const limit = query.limit || 50;

    let filtered = all;
    if (query.teamId) {
      const aliases = await resolveTeamAliases(query.teamId);
      filtered = all.filter((m) => aliases.includes(m.teamId.toLowerCase()));
    }

    const paginated = filtered.slice(0, limit);
    return createSuccessResponse(paginated, {
      requestId,
      pagination: {
        limit,
        hasMore: filtered.length > limit,
        nextCursor: filtered.length > limit ? paginated[paginated.length - 1]?.id : null,
        total: filtered.length,
      },
    });
  }
);

export const POST = apiRoute(
  {
    requireAuth: true,
    roles: ['coordinator', 'super_admin', 'industry_partner', 'student'],
    idempotent: true,
    rateLimit: { limit: 30, windowMs: 60000 },
    bodySchema: createMeetingSchema,
  },
  async ({ body, user, requestId }) => {
    let canonicalTeamId = body.teamId;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.teamId);
    const normalized = body.teamId.replace(/^team-/i, '').replace(/-/g, ' ').trim();
    const digits = body.teamId.match(/\d+/)?.[0];
    try {
      const team = await prisma.team.findFirst({
        where: {
          OR: [
            ...(isUuid ? [{ id: body.teamId }] : []),
            { name: { equals: body.teamId, mode: 'insensitive' as const } },
            { name: { equals: normalized, mode: 'insensitive' as const } },
            ...(digits ? [{ name: { contains: digits, mode: 'insensitive' as const } }] : []),
          ],
        },
      });
      if (team) {
        canonicalTeamId = team.id;
      }
    } catch (e) {
      console.warn('[Meetings API] Canonical team resolve error:', e);
    }

    const newMeeting: PlannedMeeting = {
      id: `meet-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      teamId: canonicalTeamId,
      title: body.title.trim(),
      scheduledAt: new Date(body.scheduledAt).toISOString(),
      agenda: body.agenda?.trim() || '',
      meetLink: body.meetLink?.trim() || '',
      hostName: body.hostName?.trim() || user.name || 'Dr. Sheetal Patil',
      hostRole: body.hostRole?.trim() || user.role || 'Faculty Guide',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await prisma.auditEvent.create({
        data: {
          entityType: 'meeting',
          entityId: newMeeting.id,
          action: 'meeting_planned',
          newValue: newMeeting as any,
          reason: `Meeting planned for team ${newMeeting.teamId}`,
        },
      });
    } catch (dbErr) {
      console.warn('[Meetings API] DB audit log write warning:', dbErr);
    }

    const all = await getStoredMeetings();
    all.unshift(newMeeting);
    await saveStoredMeetings(all);

    return createSuccessResponse(newMeeting, { status: 201, requestId });
  }
);

export const PATCH = apiRoute(
  {
    requireAuth: true,
    roles: ['coordinator', 'super_admin', 'industry_partner', 'student'],
    rateLimit: { limit: 30, windowMs: 60000 },
    bodySchema: patchMeetingSchema,
  },
  async ({ body, requestId }) => {
    const { meetingId, meetLink } = body;

    const all = await getStoredMeetings();
    const idx = all.findIndex((m) => m.id === meetingId);

    if (idx === -1) {
      return createErrorResponse('NOT_FOUND', `Meeting with ID "${meetingId}" not found`, 404, requestId);
    }

    all[idx].meetLink = meetLink ? meetLink.trim() : '';
    all[idx].updatedAt = new Date().toISOString();

    try {
      await prisma.auditEvent.create({
        data: {
          entityType: 'meeting',
          entityId: meetingId,
          action: 'meeting_link_updated',
          newValue: all[idx] as any,
          reason: `Meeting link updated to ${all[idx].meetLink}`,
        },
      });
    } catch (dbErr) {
      console.warn('[Meetings API] DB link update warning:', dbErr);
    }

    await saveStoredMeetings(all);
    return createSuccessResponse(all[idx], { requestId });
  }
);
