# Step-by-Step Implementation Plan: Native Meeting Scheduler & Automated Email Alerts

Based on the architectural interview, this plan implements:
1. **Custom SMTP Email Alerts** via Nodemailer with institutional fallback.
2. **Native Meeting Scheduler** allowing faculty mentors & industry experts to schedule review meetings and code defenses with student groups directly in VBridgeConnect.
3. **Automated Event Triggers** emailing students and mentors for meeting bookings, grades released, project allocations, and deadline reminders.
4. **Live In-App Notification Feed** in the top navbar with unread counts and mark-all-read capabilities.

---

## Step 1: Environment Variables Setup (`.env`)

Add standard Custom SMTP configuration variables to [`next-app/.env`](file:///c:/Users/Vedant/Downloads/V%20-%20Bridge%20connect/next-app/.env):

```env
# Custom Institutional SMTP Server Configuration
SMTP_HOST="smtp.vit.edu.in"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="connect@vit.edu.in"
SMTP_PASS=""
SMTP_FROM='"V-Bridge Connect" <connect@vit.edu.in>'
```

*Note*: If `SMTP_PASS` is empty during development, the email service will automatically log formatted HTML email previews and recipient lists to the terminal without failing requests.

---

## Step 2: Database Schema & Models (`prisma/schema.prisma`)

Add the missing `Notification` and `Meeting` models to [`schema.prisma`](file:///c:/Users/Vedant/Downloads/V%20-%20Bridge%20connect/next-app/prisma/schema.prisma):

```prisma
model Notification {
  id         String   @id @default(uuid()) @db.Uuid
  userId     String   @db.Uuid
  title      String
  body       String
  severity   String   @default("info") // 'info' | 'warning' | 'urgent'
  entityType String?  // 'milestone' | 'submission' | 'meeting' | 'application' | 'team'
  entityId   String?
  isRead     Boolean  @default(false)
  linkTo     String?
  createdAt  DateTime @default(now()) @db.Timestamptz

  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, isRead])
  @@map("notifications")
}

model Meeting {
  id              String    @id @default(uuid()) @db.Uuid
  teamId          String    @db.Uuid
  title           String
  agenda          String?
  scheduledAt     DateTime  @db.Timestamptz
  durationMinutes Int       @default(30)
  meetingUrl      String?   // Google Meet / Zoom / MS Teams / In-Person
  location        String?   // e.g. "ECS Seminar Hall / Cabin 402"
  createdById     String    @db.Uuid
  status          String    @default("scheduled") // 'scheduled' | 'completed' | 'cancelled'
  createdAt       DateTime  @default(now()) @db.Timestamptz
  updatedAt       DateTime  @updatedAt @db.Timestamptz

  team            Team      @relation(fields: [teamId], references: [id], onDelete: Cascade)
  createdBy       User      @relation("MeetingHost", fields: [createdById], references: [id])

  @@index([teamId, scheduledAt])
  @@map("meetings")
}
```

*Run*: `npx prisma db push` and `npx prisma generate`.

---

## Step 3: Transactional Email Service (`src/lib/modules/email/email.service.ts`)

Create a dedicated email module using `nodemailer` that supports:
- Transport creation using `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`.
- Safe delivery: if SMTP credentials are not yet entered, logs rich preview to console and returns cleanly.
- 4 Responsive institutional HTML email templates:
  1. **Meeting Invitation**: Agenda, Scheduled Date & Time, Team Name, Host Name, and prominent "Join Meeting" button.
  2. **Milestone Grade Released**: Score, evaluation status, faculty remarks, and link to inspect rubric.
  3. **Project Topic Allocated**: Problem statement, domain, assigned mentor, and link to workspace.
  4. **48-Hour Deadline Reminder**: Milestone title, due date/time, and submission requirements.

---

## Step 4: Backend REST APIs

1. **`src/app/api/v1/meetings/route.ts`**:
   - `GET`: Returns scheduled meetings for the requesting user's teams or supervised cohorts.
   - `POST`: Validates meeting details (title, teamId, scheduledAt, meetingUrl, agenda), saves to `prisma.meeting`, fetches recipient emails for all team members + mentor, calls `emailService.sendMeetingScheduledEmail()`, and creates in-app notification rows.
2. **`src/app/api/v1/notifications/route.ts`**:
   - `GET`: Returns the active user's notifications with unread counts.
   - `PATCH`: Marks specific or all notifications as read (`isRead: true`).

---

## Step 5: Event Bus Hookup (`src/lib/modules/notification/notification.service.ts`)

Connect domain event listeners to automated emails:
- `submission.accepted` & `submission.evaluated` -> Dispatches `sendSubmissionGradedEmail()` to all student authors.
- `mentor.assign-project` -> Dispatches `sendProjectAssignedEmail()` to all team members.
- `milestone.overdue` -> Dispatches urgency notification to team and mentor.

---

## Step 6: Frontend UI Integration

1. **`ScheduleMeetingModal.tsx`**:
   - Modal with fields: Meeting Title, Target Student Group, Date & Time Picker, Duration (15m, 30m, 45m, 60m), Google Meet / Zoom URL, and Agenda Notes.
2. **`MentorDashboard.tsx`**:
   - Add **"Schedule Review / Defense"** button to each student group card.
   - Display scheduled meeting badges with countdown and direct "Join Call" button.
3. **`StudentDashboard.tsx` & `WorkspaceHub.tsx`**:
   - Render an **"Upcoming Meetings & Defenses"** widget with meeting agenda, date, host name, and 1-click "Join Google Meet / Zoom" link.
4. **`TopNavbar.tsx`**:
   - Connect the notification bell to `GET /api/v1/notifications`, display live unread count badge, and enable "Mark all read".

---

## Step 7: Automated Verification & Regression Testing

- Create `tests/notifications.meeting.test.ts` to verify:
  - Meeting creation and database persistence.
  - Email notification rendering and transport fallback.
  - Notification mark-as-read API.
- Run full test suite (`npx vitest run`) to verify all 88+ tests pass.
- Run `npx next build --webpack` to ensure zero compilation or prerendering errors.
