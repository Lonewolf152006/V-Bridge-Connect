import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

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

async function getStoredMeetings(): Promise<PlannedMeeting[]> {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      await fs.promises.mkdir(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DATA_FILE)) {
      await fs.promises.writeFile(DATA_FILE, JSON.stringify([], null, 2), 'utf-8');
      return [];
    }
    const raw = await fs.promises.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('[Meetings API] Error reading meetings file:', err);
    return [];
  }
}

async function saveStoredMeetings(meetings: PlannedMeeting[]): Promise<void> {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      await fs.promises.mkdir(DATA_DIR, { recursive: true });
    }
    await fs.promises.writeFile(DATA_FILE, JSON.stringify(meetings, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Meetings API] Error saving meetings file:', err);
  }
}

// GET /api/v1/meetings?teamId=...
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const teamId = searchParams.get('teamId');

    const all = await getStoredMeetings();
    const filtered = teamId ? all.filter((m) => m.teamId === teamId) : all;

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

    const all = await getStoredMeetings();
    const newMeeting: PlannedMeeting = {
      id: `meet-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      teamId,
      title: title.trim(),
      scheduledAt: new Date(scheduledAt).toISOString(),
      agenda: agenda?.trim() || '',
      meetLink: meetLink?.trim() || '',
      hostName: hostName?.trim() || 'Dr. Sheetal Patil',
      hostRole: hostRole?.trim() || 'Faculty Guide',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

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
