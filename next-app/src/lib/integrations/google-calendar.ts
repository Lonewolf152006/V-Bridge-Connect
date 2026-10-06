// VBridgeConnect — Google Calendar & Meet Integration Service
// Communicates with Google Calendar REST API v3 using native fetch.
// Creates team sync meetings, generates Google Meet links, and syncs milestone reviews.

export interface CalendarEventInput {
  title: string;
  description?: string;
  startTime: Date | string;
  endTime: Date | string;
  attendees?: string[]; // email addresses
  createMeetLink?: boolean;
}

export interface CalendarEventOutput {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  meetLink?: string | null;
  htmlLink: string;
  status: string;
}

const GOOGLE_CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3';

/**
 * Creates a scheduled event in Google Calendar with optional automatic Google Meet link.
 */
export async function createGoogleCalendarMeeting(
  accessToken: string,
  event: CalendarEventInput
): Promise<CalendarEventOutput> {
  const startIso = new Date(event.startTime).toISOString();
  const endIso = new Date(event.endTime).toISOString();

  const body: Record<string, unknown> = {
    summary: event.title,
    description: event.description || 'Scheduled via VBridgeConnect Collaboration Hub',
    start: {
      dateTime: startIso,
      timeZone: 'UTC',
    },
    end: {
      dateTime: endIso,
      timeZone: 'UTC',
    },
    attendees: event.attendees?.map((email) => ({ email })) || [],
    reminders: {
      useDefault: true,
    },
  };

  if (event.createMeetLink !== false) {
    body.conferenceData = {
      createRequest: {
        requestId: `vbridge-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        conferenceSolutionKey: {
          type: 'hangoutsMeet',
        },
      },
    };
  }

  const url = `${GOOGLE_CALENDAR_API_BASE}/calendars/primary/events?conferenceDataVersion=1`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Google Calendar API error (${response.status}): ${errorBody}`);
  }

  const data = await response.json();

  return {
    id: data.id,
    title: data.summary,
    startTime: data.start?.dateTime || data.start?.date,
    endTime: data.end?.dateTime || data.end?.date,
    meetLink: data.hangoutLink || data.conferenceData?.entryPoints?.[0]?.uri || null,
    htmlLink: data.htmlLink,
    status: data.status,
  };
}

/**
 * Lists upcoming meetings from the user's primary Google Calendar.
 */
export async function listGoogleCalendarMeetings(
  accessToken: string,
  maxResults: number = 10
): Promise<CalendarEventOutput[]> {
  const timeMin = new Date().toISOString();
  const url = `${GOOGLE_CALENDAR_API_BASE}/calendars/primary/events?timeMin=${encodeURIComponent(
    timeMin
  )}&maxResults=${maxResults}&singleEvents=true&orderBy=startTime`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Google Calendar API error (${response.status}): ${errorBody}`);
  }

  const data = await response.json();

  return (data.items || []).map((item: any) => ({
    id: item.id,
    title: item.summary || 'Untitled Meeting',
    startTime: item.start?.dateTime || item.start?.date,
    endTime: item.end?.dateTime || item.end?.date,
    meetLink: item.hangoutLink || item.conferenceData?.entryPoints?.[0]?.uri || null,
    htmlLink: item.htmlLink,
    status: item.status,
  }));
}
