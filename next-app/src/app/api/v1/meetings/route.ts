import { NextRequest, NextResponse } from 'next/server';
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

  // 1. Load from PostgreSQL auditEvent for permanent cross-deployment persistence
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

  // 2. Load from local JSON file cache
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

// GET /api/v1/meetings?teamId=...
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const teamId = searchParams.get('teamId');

    const all = await getStoredMeetings();

    if (!teamId) {
      return NextResponse.json({ success: true, meetings: all });
    }

    const aliases = await resolveTeamAliases(teamId);
    const filtered = all.filter((m) => aliases.includes(m.teamId.toLowerCase()));

    return NextResponse.json({
      success: true,
      meetings: filtered,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch meetings' },
      { status: 500 }
    );
  }
}

// POST /api/v1/meetings - Plan a new meeting
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { teamId, title, scheduledAt, agenda, meetLink, hostName, hostRole } = body;

    if (!teamId || !title || !scheduledAt) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: teamId, title, scheduledAt' },
        { status: 400 }
      );
    }

    // Resolve canonical team ID if possible
    let canonicalTeamId = teamId;
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
        canonicalTeamId = team.id;
      }
    } catch (e) {
      console.warn('[Meetings API] Canonical team resolve error:', e);
    }

    const newMeeting: PlannedMeeting = {
      id: `meet-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      teamId: canonicalTeamId,
      title: title.trim(),
      scheduledAt: new Date(scheduledAt).toISOString(),
      agenda: agenda?.trim() || '',
      meetLink: meetLink?.trim() || '',
      hostName: hostName?.trim() || 'Dr. Sheetal Patil',
      hostRole: hostRole?.trim() || 'Faculty Guide',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 1. Persist to PostgreSQL DB auditEvent table
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

    // 2. Also save to local file
    const all = await getStoredMeetings();
    all.unshift(newMeeting);
    await saveStoredMeetings(all);

    return NextResponse.json({
      success: true,
      meeting: newMeeting,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to plan meeting' },
      { status: 500 }
    );
  }
}

// PATCH /api/v1/meetings - Professor uploads / updates meeting link
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { meetingId, meetLink } = body;

    if (!meetingId) {
      return NextResponse.json(
        { success: false, error: 'Missing meetingId' },
        { status: 400 }
      );
    }

    const all = await getStoredMeetings();
    const idx = all.findIndex((m) => m.id === meetingId);

    if (idx === -1) {
      return NextResponse.json(
        { success: false, error: `Meeting with ID "${meetingId}" not found` },
        { status: 404 }
      );
    }

    all[idx].meetLink = meetLink ? meetLink.trim() : '';
    all[idx].updatedAt = new Date().toISOString();

    // 1. Update in PostgreSQL
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

    // 2. Update in file
    await saveStoredMeetings(all);

    return NextResponse.json({
      success: true,
      meeting: all[idx],
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to update meeting link' },
      { status: 500 }
    );
  }
}
