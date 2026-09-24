# VBridgeConnect — Master Implementation Roadmap (task.md)

**Companion to:** `PRD_text.txt`, `architecture.md`, `rules.md`, and `DESIGN.md`  
**Execution Strategy:** **Frontend First, Backend Second.**  
**Status:** Task specification phase (No application code written yet).

---

## Strategic Execution Approach: Frontend-First

To ensure immediate visual validation and lock in user experience before database migrations and server plumbing, the development follows a strict two-stage pipeline:
1. **Stage 1 (Frontend):** Build UI foundations, reusable components, role-based shells, and all 14 MVP screens using React + TypeScript + Tailwind CSS. Use typed mock data and mock API clients that mirror the exact REST contracts defined in `architecture.md`.
2. **Stage 2 (Backend):** Implement Fastify, Prisma schema, PostgreSQL migrations, state machine transition endpoints, domain event listeners, background cron jobs, and S3 file handling.
3. **Stage 3 (Full Integration):** Swap the mock API client for live backend endpoints, test transactions and concurrency locks, and run QA verification tests (QA-01 to QA-16).

---

## Summary Checklist

- [x] **Stage 1: Frontend Development**
  - [x] Phase 1.1: Project Setup & Design Token Foundation
  - [x] Phase 1.2: Core Component Library & UI Primitives
  - [x] Phase 1.3: Application Shell & Role-Based Navigation
  - [x] Phase 1.4: Screen Group A — Authentication & Onboarding
  - [x] Phase 1.5: Screen Group B — Student Experience (Dashboards, Opportunities, Workspace, Submissions, Certificates)
  - [x] Phase 1.6: Screen Group C — Faculty Mentor & Reviewer Experience (Cohort Risk, Rubric Grading, Messaging)
  - [x] Phase 1.7: Screen Group D — Coordinator & Admin Experience (Activity Builder, Application Pipeline, Directory, Audit Reports)
  - [x] Phase 1.8: Responsive Polish & Mobile Viewport Audit
- [ ] **Stage 2: Backend Development**
  - [ ] Phase 2.1: Server Setup & Database Architecture (Prisma + PostgreSQL)
  - [ ] Phase 2.2: Authentication, Authorization & Scope Middleware
  - [ ] Phase 2.3: Core Domain Modules & State Machine REST Verbs
  - [ ] Phase 2.4: Object Storage & S3 Signed Uploads
  - [ ] Phase 2.5: In-Process Domain Event Bus & Scheduled Jobs
  - [ ] Phase 2.6: Audit Ledger & Accreditation Reporting Engine
- [ ] **Stage 3: Integration, Security & QA Verification**
  - [ ] Phase 3.1: Frontend-to-Backend API Wiring
  - [ ] Phase 3.2: Verification of PRD Acceptance Criteria (QA-01 to QA-16)
  - [ ] Phase 3.3: Production Build & Deployment Readiness

---

## Detailed Task Breakdown

---

### STAGE 1: FRONTEND DEVELOPMENT (React + TypeScript + Tailwind)

#### Phase 1.1: Project Setup & Design Token Foundation
- [x] **TASK-FE-001**: Initialize Frontend Repository
  - Setup Vite + React + TypeScript in `frontend/`.
  - Configure ESLint, Prettier, and path aliases (`@components/*`, `@hooks/*`, `@types/*`, `@services/*`).
- [x] **TASK-FE-002**: Design Tokens & Tailwind Theme Configuration
  - Implement color palette from `DESIGN.md`: Indigo `#4F46E5`, Slate neutrals, semantic state colors (`draft`, `pending`, `active`, `success`, `warning`, `danger`).
  - Import Google Fonts: `Plus Jakarta Sans` (Display/Headings), `Inter` (Body/Data), `JetBrains Mono` (Code/Hashes).
  - Configure corner roundness (`rounded-xl` / 12px standard) and elevation shadows.
- [x] **TASK-FE-003**: Typed Mock Data Layer & API Client Contracts
  - Define TypeScript domain models (`User`, `Role`, `Activity`, `Application`, `Team`, `Milestone`, `Submission`, `Rubric`, `Certificate`, `AuditLog`).
  - Create mock repository services with deterministic fixtures for 6 roles (Student Siddharth, Mentor Dr. Vance, Coordinator, Industry Reviewer, Dean/Admin).
  - Build mock latency and error simulators for reliable UI state testing.

#### Phase 1.2: Core Component Library & UI Primitives
- [x] **TASK-FE-004**: Base Input & Action Components
  - Buttons (Primary Indigo, Slate Secondary, Danger Rose, Ghost, Loading spinner states).
  - Text fields, textareas, select menus, toggle switches, search bar with `Ctrl+K` shortcut cue.
- [x] **TASK-FE-005**: State Machine Badges & Indicator Chips
  - Activity status badges (`Draft`, `Open`, `In Progress`, `Under Review`, `Completed`).
  - Milestone status badges (`Not Started`, `Open`, `Submitted`, `Changes Requested`, `Accepted`, `Overdue`).
  - Application status badges (`Submitted`, `Waitlisted`, `Accepted`, `Rejected`).
- [x] **TASK-FE-006**: Team Risk Indicators (FR-070 to FR-075)
  - Green (On Track), Amber (Needs Attention / Due in <48h), Red (At Risk / Overdue >48h / 2+ Rejections).
- [x] **TASK-FE-007**: Feedback, Overlay & Drawer Components
  - Slide-over inspection drawer (for application review and submission details).
  - Modal dialog with blurred backdrop.
  - Toast notification system with role-scoped alert badges.
- [x] **TASK-FE-008**: Complex Interactive Widgets
  - Interactive Rubric Slider (0 to 10 scale with dynamic score weight calculation).
  - Multi-step Progress Stepper (for Activity Builder and Milestone progress).
  - Drag-and-drop file upload dropzone with MIME-type and size validation (max 50MB).

#### Phase 1.3: Application Shell & Role-Based Navigation
- [x] **TASK-FE-009**: Responsive Desktop Shell
  - Collapsible 260px left sidebar with role-aware navigation links.
  - Top navigation bar with university branding, search input, notification bell with unread badge counter, department scope dropdown, and user avatar.
- [x] **TASK-FE-010**: Mobile Layout Shell
  - Top sticky header with university monogram and user menu.
  - Docked bottom tab navigation (Home, Projects, Messages, Credentials).
- [x] **TASK-FE-011**: Role Switcher Sandbox Toolbar
  - Floating development bar to toggle between Student, Faculty Mentor, Coordinator, Partner, and Admin to test scoped UI visibility live.

#### Phase 1.4: Screen Group A — Authentication & Onboarding
- [x] **TASK-FE-012**: Screen 1 — Unified Login & SSO Portal (`/login`)
  - Split-screen desktop layout (50/50): Left dark-indigo branding panel with collaboration graphic and proof metrics; right white auth card.
  - "Sign in with University Portal (SSO)" primary button with university crest icon.
  - Institutional email & password inputs with remember-device toggle and IT help links.
  - Role-demo quick selector pill.
  - NAAC A++ accreditation trust seal in the footer.
  - Mobile layout adaptation with stacked layout and top curved banner.

#### Phase 1.5: Screen Group B — Student Experience
- [x] **TASK-FE-013**: Screen 2 — Student Personal Dashboard (`/student/dashboard`)
  - 4 KPI metric cards (Active Projects, Upcoming Milestones, Applications in Review, Verified Credentials).
  - Urgent Action Alert: Amber countdown card for milestone due in 36h with direct "Submit Deliverable" CTA.
  - Active project cards with milestone progress bars, team avatar stacks, and faculty advisor tag.
  - Direct workspace quick-links (IA Map Rule 1: direct shortcut to joined workspaces).
  - Institutional defense readiness gauge (88% ready).
- [x] **TASK-FE-014**: Screen 4 — Activity & Opportunity Catalogue (`/activities`)
  - Filter toolbar: Search, Category (Research, Capstone, Hackathon), Department, Capacity.
  - Responsive 3-column card grid: Category tag, title, supervisor info, capacity bar ("22/30 seats filled"), prerequisites chips, "Apply Now" button.
- [x] **TASK-FE-015**: Screen 7 — Active Team Project Workspace (The Shared Hub - `/projects/:id`)
  - Shared operational hub reached by both students and mentors with role-based permissions.
  - Header: Team Name, Activity Title, Mentor Badge, and Team Health Status Chip.
  - Implementation of all **9 Scoped Workspace Tabs (Per IA Map)**:
    1. `Overview`: Upcoming deadlines, recent activity feed, abstract, quick links.
    2. `Team`: Roster with designated roles (Lead, Contributor) and contact chips.
    3. `Milestones / Tasks`: Structured sprint roadmap with badges, due dates, weightage %.
    4. `Submission & Version History`: Deliverable uploads with immutable version history (FR-052).
    5. `Review / Rubric (Mentor-Only)`: Faculty grading sheet & private notes (role-guarded; hidden from students).
    6. `Files`: Document repository, datasets, and architecture diagrams.
    7. `Meetings`: Scheduled mentor sync sessions, office hours booking, agenda notes.
    8. `Announcements / Discussion`: Faculty broadcasts and threaded Q&A discussions.
    9. `Workspace Group Chat`: Scoped team communication (shares underlying thread with global `/messages`).
- [x] **TASK-FE-016**: Screen 8 — Milestone Tracking & Health Dashboard (`/projects/:id/milestones`)
  - Interactive horizontal timeline / stepper across the top.
  - Milestone cards: Deadline, overdue flags, state badges, rubric weightage, and mentor feedback callout box.
- [x] **TASK-FE-017**: Screen 9 — Deliverable Submission & Version History (`/projects/:id/milestones/:mId/submit`)
  - Drag-and-drop file upload (PDF, DOCX, ZIP) + GitHub URL input.
  - Immutable version history drawer (FR-052) displaying prior uploads (v1 vs v2) with timestamps, changelogs, and review remarks.
  - Lock notice: "Submissions cannot be edited after final grading."
- [x] **TASK-FE-018**: Screen 11 — Certificate Verification & Portfolio Hub (`/certificates`)
  - Tab 1: Platform-Issued Credentials (deep indigo border, gold foil seal, recipient name, QR code, SHA-256 hash box, "Download PDF", "Verify On-Chain", "Add to LinkedIn").
  - Tab 2: Self-Reported External Certifications (FR-115) with dashed border, "External / Not Audited by University Authorities" disclaimer watermark, receipt preview link, and upload external credential modal.
- [x] **TASK-FE-018A**: Student Secondary Screens (Per IA Map)
  - Personal Record Reports (`/student/reports`): Exportable transcript of completed projects and competencies.
  - Profile & Notification Preferences (`/student/profile`): Digest frequency, email/in-app toggles, and institutional identity card.

#### Phase 1.6: Screen Group C — Faculty Mentor & Reviewer Experience
- [x] **TASK-FE-019**: Screen 3 — Faculty Mentor Cohort Dashboard (`/mentor/dashboard`)
  - Department selector and active cohort counters (Teams, Students, Academic Tracks).
  - Cohort Health & Risk Matrix (FR-070 to FR-075): 3 flagged team cards with red/orange status badges, inactivity warnings, and direct "Send Nudge" / "Schedule Sync" CTAs.
  - Submissions Pending Rubric Evaluation data table: Team, Activity, Milestone Stage, Submission Date with version badge (v2), Rubric Weightage, and "Evaluate Now" CTA.
  - Direct workspace quick-links to all assigned team hubs (IA Map Rule 1).
  - Right sidebar: Mentor office hours schedule and turnaround performance metrics.
- [x] **TASK-FE-020**: Screen 10 — Rubric Grading Workspace (`/mentor/submissions/:id/grade`)
  - Split-screen workspace (60% left, 40% right).
  - Left pane: Embedded PDF/deliverable viewer with page pagination, zoom, and immutable version chip (`Version 2 of 2`).
  - Right pane: Live score summary (`24 / 30 pts`, 80% Grade A-), interactive score sliders for Technical Feasibility, Empirical Rigor, and Code Standards.
  - Two-tier feedback: Private faculty internal notes (`Hidden from students • ABET Audit Only`) and public student constructive feedback textarea.
  - Action buttons: Amber outline "Request Revisions" and solid emerald green "Accept & Publish Grade".
  - Completion Trigger (IA Map Rule 2): Final milestone evaluation completion automatically initiates platform certificate issuance.
- [x] **TASK-FE-021**: Screen 12 — Contextual Messaging & Team Chat (`/messages`)
  - Scoped channel sidebar organized by Activity and Team (FR-120 to FR-126).
  - Chat window: Pinned channel guidelines, message bubbles with sender role badges (`[Mentor] Dr. Vance`), file attachments, and audit trail note.
  - Unified Thread Sync (IA Map Rule 3): Global `/messages` and Workspace Tab 9 (`Workspace Group Chat`) access the exact same conversation threads.

#### Phase 1.7: Screen Group D — Coordinator & Admin Experience
- [x] **TASK-FE-022**: Screen 5 — Activity Builder & Milestone Setup (`/coordinator/activities/new`)
  - 5-step wizard: Basics & Capacity Limits, Application Criteria & Deadlines, Milestone Builder (drag-and-drop milestones with deliverables and weightage %), Mentor & Industry Partner Assignment, Review & Publish.
- [x] **TASK-FE-023**: Screen 6 — Application Review & Selection Pipeline (`/coordinator/activities/:id/applications`)
  - Kanban board / Segmented pipeline: Submitted -> Shortlisted -> Accepted -> Waitlisted -> Rejected.
  - Real-time capacity lock counter (QA-10).
  - Application inspection slide-over drawer with student GPA, statement of purpose, portfolio, and reviewer rubric.
  - Batch decision trigger: "Send Batch Decisions" (moves accepted teams into their dedicated Workspace Hub).
- [x] **TASK-FE-024**: Screen 13 — Department Directory & Role Permissions (`/admin/people`)
  - Student, faculty, and industry partner directory with search and role filters.
  - Role assignment and department scope modifier modal.
  - Batch student/faculty invite via CSV upload.
- [x] **TASK-FE-025**: Screen 14 — Department Analytics & Audit Reports (`/admin/reports`)
  - Cohort completion funnel chart, average time-to-evaluation metrics.
  - Immutable audit trail table with UTC timestamps, actor, entity, and action taken.
  - Export buttons: "Export NAAC Activity Report (CSV)" and "Export Accreditation PDF".

#### Phase 1.8: Responsive Polish & Mobile Viewport Audit
- [x] **TASK-FE-026**: Mobile Viewport Optimization
  - Validate touch targets (minimum 44×44px), card stacking, bottom sheet modals on mobile devices.
  - Verify bottom navigation bar switching and header compactness.

---

### STAGE 2: BACKEND DEVELOPMENT (Node.js + Fastify + Prisma + PostgreSQL)

#### Phase 2.1: Server Setup & Database Architecture
- [ ] **TASK-BE-001**: Initialize Backend Environment
  - Fastify + TypeScript setup in `backend/`.
  - CORS, Helmet, rate-limiting, and error-handling plugins.
- [ ] **TASK-BE-002**: PostgreSQL & Prisma Schema Design
  - Implement full schema in `prisma/schema.prisma` with UUIDv4 primary keys and `TIMESTAMPTZ` columns (`created_at`, `updated_at`).
  - Entities: `User`, `Role`, `Department`, `Activity`, `Application`, `Team`, `TeamMember`, `Milestone`, `Submission`, `SubmissionVersion`, `RubricCriterion`, `RubricScore`, `Certificate`, `ExternalCertificate`, `Message`, `AuditLog`.
  - Enums matching PRD state machines exactly: `ActivityStatus`, `ApplicationStatus`, `MilestoneStatus`, `TeamRiskLevel`, `CertificateType`.
- [ ] **TASK-BE-003**: Database Seed & Migration Engine
  - Create initial migrations.
  - Seed script creating realistic academic data (CS department, 14 teams, mentors, rubrics, and sample submissions).

#### Phase 2.2: Authentication, Authorization & Scope Middleware
- [ ] **TASK-BE-004**: JWT Authentication & Institutional SSO Stub
  - Implement `jose`-based JWT token creation and verification (access + refresh tokens).
  - SSO callback endpoint supporting institutional directory simulation.
- [ ] **TASK-BE-005**: Role & Scope-Based Authorization Middleware
  - Server-side guard checking role permissions and data scopes:
    - Coordinator: Scoped to their department only.
    - Mentor: Scoped to their assigned activities and teams.
    - Industry Partner (FR-092): Scoped strictly to shared deliverables; blocked from internal academic grading and private faculty notes.

#### Phase 2.3: Core Domain Modules & State Machine REST Verbs
- [ ] **TASK-BE-006**: Activity Module (`/api/v1/activities`)
  - CRUD operations, draft/publish lifecycle, milestone weightage validation (must total 100%).
- [ ] **TASK-BE-007**: Application Module (`/api/v1/applications`)
  - Application submission, withdrawal, and status transitions.
  - Capacity-sensitive selection with row-level database lock inside a transaction (`SELECT FOR UPDATE`) to prevent overselling slots (QA-10).
- [ ] **TASK-BE-008**: Team & Milestone Module (`/api/v1/teams`, `/api/v1/milestones`)
  - Team formation and roster validation.
  - Action-based milestone transition endpoints:
    - `POST /milestones/:id/submit`
    - `POST /milestones/:id/accept`
    - `POST /milestones/:id/request-changes`
    - `POST /milestones/:id/waive`
- [ ] **TASK-BE-009**: Submission Module (`/api/v1/submissions`)
  - Immutable version creation (FR-052): A new submission always inserts a new `SubmissionVersion` row; previous rows remain untouched.
- [ ] **TASK-BE-010**: Rubric & Evaluation Module (`/api/v1/rubrics`)
  - Rubric criterion scoring and weighted grade calculation.
  - Strict isolation: Private faculty notes stored in separate column never serialized in student-facing payloads.
- [ ] **TASK-BE-011**: Certificate Module (`/api/v1/certificates`)
  - Issue official certificate with SHA-256 hash generation and public verification token.
  - Public verification endpoint: `GET /api/v1/verify/:hash`.
  - Self-reported certificate endpoint: `POST /api/v1/certificates/self-reported` (stored as `ExternalCertificate` with non-audited flag FR-115).
- [ ] **TASK-BE-012**: Messaging Module (`/api/v1/conversations`, `/api/v1/messages`)
  - Scoped channel access control, message pagination, and file attachment handling.

#### Phase 2.4: Object Storage & S3 Signed Uploads
- [ ] **TASK-BE-013**: S3 Storage Service
  - Presigned upload URL generation (`PUT`) with file type & size limits.
  - Presigned download URL generation (`GET`) with short-lived expiration (15 minutes).
  - Database stores only metadata (`file_url`, `checksum_sha256`, `size_bytes`, `mime_type`), never raw binary bytes.

#### Phase 2.5: In-Process Domain Event Bus & Scheduled Jobs
- [ ] **TASK-BE-014**: Domain Event Bus
  - Implement in-process event emitter for past-tense events: `milestone.submitted`, `milestone.accepted`, `milestone.overdue`, `submission.rejected`, `certificate.issued`.
- [ ] **TASK-BE-015**: Notification Handler
  - Event listener dispatching in-app alerts and logging simulated email notifications.
- [ ] **TASK-BE-016**: Scheduled Background Job Runner
  - `node-cron` worker running every 15 minutes:
    - Evaluate milestone deadlines; emit `milestone.overdue` when past due date without submission.
    - Evaluate team activity; flag team as `NEEDS_ATTENTION` or `AT_RISK` when inactive or overdue >48 hours (FR-070 to FR-075).

#### Phase 2.6: Audit Ledger & Accreditation Reporting Engine
- [ ] **TASK-BE-017**: Immutable Audit Logger
  - Event listener subscribing to all critical transitions and writing to `AuditLog` table (`actor_id`, `entity_type`, `entity_id`, `action`, `prev_state`, `new_state`, `ip_address`, `timestamp_utc`).
- [ ] **TASK-BE-018**: Reporting & Accreditation Exports
  - Query endpoint `/api/v1/reports/naac-activity` generating reproducible CSV and JSON summaries with query metadata (QA-12).

---

### STAGE 3: INTEGRATION, SECURITY & QA VERIFICATION

#### Phase 3.1: Frontend-to-Backend API Wiring
- [ ] **TASK-INT-001**: API Client Connection
  - Replace frontend mock repository with Axios/Fetch client targeting `/api/v1/*`.
  - Configure automatic JWT header injection and token refresh interceptors.
- [ ] **TASK-INT-002**: File Upload End-to-End Flow
  - Test client request for presigned S3 URL -> direct upload to storage -> notify backend of completed upload.

#### Phase 3.2: Verification of PRD Acceptance Criteria (QA-01 to QA-16)
- [ ] **TASK-INT-003**: State Machine Transitions Test (QA-01 to QA-05)
  - Verify invalid transitions are rejected by API with HTTP 400/409.
- [ ] **TASK-INT-004**: Capacity & Concurrency Test (QA-10)
  - Simulate concurrent applications filling the final available seat; verify no overselling occurs.
- [ ] **TASK-INT-005**: Scope Boundary & Privacy Test (QA-11, FR-092)
  - Verify Industry Partner cannot query student grades or private faculty remarks.
- [ ] **TASK-INT-006**: Certificate Ledger & Self-Reported Isolation Test (QA-14, FR-114, FR-115)
  - Verify self-reported certificates cannot be verified via the official registrar endpoint and do not appear in official accreditation reports.
- [ ] **TASK-INT-007**: Audit Trail Completeness Test (QA-12)
  - Verify every milestone transition and rubric publication generates an immutable audit record.

#### Phase 3.3: Production Build & Deployment Readiness
- [ ] **TASK-INT-008**: Build Validation
  - Run `npm run build` on both frontend and backend to verify zero TypeScript errors and bundle size compliance.
- [ ] **TASK-INT-009**: Documentation & Runbook
  - Finalize local development instructions and environment variable templates (`.env.example`).
