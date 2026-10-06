// VBridgeConnect — Google Calendar & Meeting Route Handler
// GET: List upcoming team sync meetings
// POST: Create a new meeting with Google Meet link

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import {
  createGoogleCalendarMeeting,
  listGoogleCalendarMeetings,
} from '@/lib/integrations/google-calendar';

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = session.googleAccessToken;
  if (!token) {
    return NextResponse.json(
      {
        connected: false,
        message: 'Google Calendar not connected. Sign in with Google to enable calendar syncing.',
      },
      { status: 200 }
    );
  }

  try {
    const meetings = await listGoogleCalendarMeetings(token, 10);
    return NextResponse.json({
      connected: true,
      meetings,
    });
  } catch (err: any) {
    console.error('[Google Calendar API] Error listing events:', err);
    return NextResponse.json(
      {
        connected: false,
        error: err.message || 'Failed to list Google Calendar events',
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const role = session.user.role;
  if (!['student', 'coordinator', 'super_admin'].includes(role)) {
    return NextResponse.json(
      { error: 'Forbidden: your role is not permitted to create team meetings' },
      { status: 403 }
    );
  }

  const token = session.googleAccessToken;
  if (!token) {
    return NextResponse.json(
      {
        error: 'Google Calendar token not found in session. Please sign in with Google.',
      },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { title, description, startTime, endTime, attendees } = body;

    if (!title || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Missing required fields: title, startTime, endTime' },
        { status: 400 }
      );
    }

    const meeting = await createGoogleCalendarMeeting(token, {
      title,
      description,
      startTime,
      endTime,
      attendees,
      createMeetLink: true,
    });

    return NextResponse.json({
      success: true,
      meeting,
    });
  } catch (err: any) {
    console.error('[Google Calendar API] Error creating event:', err);
    return NextResponse.json(
      {
        error: err.message || 'Failed to create Google Calendar event',
      },
      { status: 500 }
    );
  }
}
