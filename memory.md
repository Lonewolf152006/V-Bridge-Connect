# VBridgeConnect — Persistent Agent Context & Memory (memory.md)

**Project:** VBridgeConnect  
**Repository Location:** `c:\Users\Vedant\Downloads\V - Bridge connect`  
**Purpose:** Universal context anchor across AI sessions and agent switches (Gemini, Claude, GPT, etc.).  
**Last Updated:** September 24, 2026  
**Current Milestone:** Stage 1 (Frontend Build Complete) -> Ready for Stage 2 (Backend Fastify + Prisma + PostgreSQL)

---

## 1. Project Summary & Core Mission

VBridgeConnect is an institutional, academic collaboration and project governance platform designed for universities to connect students, faculty mentors, department coordinators, external reviewers, and industry partners.

It provides a single source of truth (PR-01) for:
- Interdisciplinary student capstone projects, research grants, and hackathons.
- Structured multi-stage milestone tracking with immutable deliverable versioning (FR-052).
- Objective rubric evaluation with separate private faculty remarks and public constructive feedback.
- Early detection of stalled or at-risk student teams (FR-070 to FR-075).
- Tamper-evident digital credentials (official platform-verified certificates with QR verification vs unverified self-reported certificates; FR-114, FR-115).
- Accreditation audit trails (NAAC, NIRF, ABET compliance).

---

## 2. Source-of-Truth Hierarchy & Key Files

Any agent operating in this repository MUST respect this precedence order (defined in `rules.md`):

1. **`PRD_text.txt`** (or `VBridgeConnect_Technical_PRD.docx`):
   - The functional requirements (`FR-001` through `FR-126`), 14 MVP screens (Section 23), user stories, acceptance criteria (`QA-01` to `QA-16`), and state machines (Section 9).
2. **`architecture.md`**:
   - System design, modular monolith pattern, REST resource conventions (`/api/v1/*`), domain event bus, background job runner, security boundaries, and data schemas.
3. **`rules.md`**:
   - Non-negotiable coding conventions, safety rules, naming patterns, and testing requirements.
4. **`DESIGN.md`**:
   - Visual tokens (Tailwind, Indigo `#4F46E5`, Plus Jakarta Sans / Inter), layout grids, component library patterns, Stitch prompts, and catalog of generated visual prototypes.
5. **`task.md`**:
   - Master phased implementation checklist. Enforces **Frontend-First, Backend-Second**.
6. **`memory.md`** (This file):
   - Instant agent context, current status, active decisions, and handoff protocols.

---

## 2.1 Information Architecture & Navigation Rules (Per `VBridgeConnect_IA_Map.pdf`)

The official Information Architecture Map establishes how every screen links across the platform:
1. **Entry & Role Bifurcation:**
   - `Login / Account Activation` -> `Home (role-aware landing)`
   - Student role routes to `Student Home / My Work` (accessing Opportunities, Application Tracker, Certificates, Messages, Personal Reports, Profile).
   - Mentor / Coordinator / Admin role routes to `Mentor Home (exception queues)` (accessing Activity Creator, Applications & Selection, People & Access, Reports/Administration).
2. **The Single Shared Activity/Team Workspace Hub:**
   - Both Students (from *Application & Status Tracker* on selection) and Mentors (from *Applications & Selection* on team confirmed) converge into the **same Workspace hub** (`/projects/:id`).
   - The Workspace contains **9 scoped tabs**:
     1. `Overview` (deadlines, activity feed, abstract)
     2. `Team` (roster, roles: Lead vs Contributor)
     3. `Milestones / Tasks` (sprint roadmap, status badges)
     4. `Submission & Version History` (immutable upload versions FR-052)
     5. `Review / Rubric (Mentor-Only)` (evaluation tools strictly role-guarded from students)
     6. `Files` (documents, datasets, diagrams)
     7. `Meetings` (mentor sync schedules & agenda)
     8. `Announcements / Discussion` (threaded notices & Q&A)
     9. `Workspace Group Chat` (scoped team chat)
3. **Three Critical Structural Relationships:**
   - **Direct Shortcut:** Student Home and Mentor Home link directly to any already-joined or already-assigned workspace.
   - **Completion-Triggered Certificate:** A platform-issued certificate is generated directly from the **Review / Rubric completion step**, not as an isolated administrative action.
   - **Unified Thread Architecture:** A student's global `Messages` screen and a workspace's `Workspace Group Chat` tab surface the **exact same underlying message thread** from two distinct entry points.

---

## 3. Technology Stack & Architecture

| Layer | Technology Choice | Rules & Constraints |
|:---|:---|:---|
| **Full-Stack Application** | **Next.js (App Router) + TypeScript + Tailwind CSS** (`next-app/`) | Seamlessly hosts all 14 screens, components, layout shells, Zustand stores, and `/app/api/*` backend route handlers in a unified production architecture. |
| **Legacy Frontend** | React 19 + Vite + TypeScript (`frontend/`) | Preserved as standalone client-side reference implementation. |
| **Backend API Layer** | Next.js Route Handlers (`/app/api/*`) + Prisma + PostgreSQL | Direct server-side API routes (`auth`, `activities`, `submissions`, `certificates`) with role security and cryptographic audit logging. |
| **Auth** | JWT (`jose`) + Institutional SSO Stub | Short-lived access tokens + refresh tokens, server-side role & scope verification on every request. |
| **Storage** | S3-Compatible Object Storage | File bytes never enter the database. Presigned URLs only (`PUT` for upload, `GET` for download with 15m expiry). |
| **Async & Background** | In-process Event Bus + Scheduled Jobs | Domain events (past-tense verbs, e.g., `milestone.overdue`); cron jobs for deadline checks & risk escalation. |

---

## 4. Non-Negotiable Engineering Directives (From `rules.md`)

1. **Unified Full-Stack Architecture:** The application is hosted in `next-app/` with Next.js App Router for both UI screens and backend `/app/api/*` endpoints.
2. **All 14 Screens Fully Ported:** Every screen, layout shell, and component is ported into `next-app/` with `'use client'` where appropriate and `next/link` / `next/navigation`.
3. **Presentation Demo Control Panel:** Floating dock at the bottom allows instant 1-click toggling between device viewports (Desktop PC vs Phone iPhone 15 frame vs iPad tablet frame) and 6 user personas.
4. **State Transitions are Actions, Not Generic Updates:**
   - Always implement explicit action verbs: `POST /api/submissions`, `PATCH /api/submissions` for rubric grading.
5. **Immutable Submissions (FR-052):**
   - A resubmission is ALWAYS a new `SubmissionVersion` row. Never run an `UPDATE` on prior submission files or student summaries.
6. **Certificate Distinction (FR-114 & FR-115):**
   - Official platform-issued certificates (deep indigo border, gold foil seal, QR code, SHA-256 hash) must be structurally separated in the database, API, and UI from student self-reported certificates (dashed border, disclaimer watermark).
   - Self-reported certificates must NEVER flow into official accreditation exports.
7. **Scoped Server-Side Authorization:**
   - Industry Partner role (FR-092) is strictly scoped to shared project deliverables. They must be structurally blocked from viewing student grades, GPAs, or private faculty notes.
   - Department Coordinator is scoped to their department only.
8. **Capacity Locks Inside Transactions (QA-10):**
   - When accepting applicants against an activity's capacity, use a database row lock (`SELECT FOR UPDATE`) inside an atomic transaction.

---

## 5. Design System Reference & Stitch Assets

- **Primary Color:** Indigo `#4F46E5`
- **Surface / Background:** Slate-50 `#F8FAFC`, White `#FFFFFF`
- **Typography:**
  - Headings / Display: `Plus Jakarta Sans`
  - Body / Tabular Numbers: `Inter`
  - Hashes / Monospace: `JetBrains Mono`
- **Stitch Project:** `VBridgeConnect MVP` (`projects/3222589985242576023`)
- **Stitch Design System Asset:** `assets/11376949610900100480`
- **Generated Prototypes Catalog (Live URLs in `DESIGN.md` Section 8):**
  - Screen 1: Portal Login & SSO (Desktop)
  - Screen 2: Student Personal Dashboard (Desktop & Mobile)
  - Screen 3: Faculty Mentor Cohort Dashboard (Desktop)
  - Screen 10: Interactive Rubric Grading Workspace (Desktop)
  - Screen 11: Digital Credentials & Verification Hub (Desktop)

---

## 6. The 6 User Personas & Scopes

1. **Student:** Enrolled in activities, tracking upcoming milestones, submitting deliverables, viewing rubric scores, accessing verified certificates.
2. **Faculty Mentor:** Assigned to activities/teams, monitoring cohort risk (FR-070 to FR-075), conducting rubric evaluations, scheduling office hours.
3. **Department Coordinator:** Department-level admin, creating activities via wizard, managing application capacity & waitlists, releasing certificates.
4. **External Reviewer:** Invited subject-matter expert, assigned to specific milestones for rubric evaluation.
5. **Industry Partner (FR-092):** Sponsoring company representative, viewing deliverable milestones and messaging teams; isolated from grades/internal notes.
6. **Super Admin / Dean:** Institutional oversight, cross-department analytics, audit ledger inspection, system configuration.

---

## 7. Current Project Progress Tracker

| Stage | Phase | Status | Notes |
|:---|:---|:---|:---|
| **0. Discovery & Design** | PRD Extraction & Analysis | **COMPLETED** | Saved to `PRD_text.txt`. |
| **0. Discovery & Design** | Design System Specification | **COMPLETED** | Saved to `DESIGN.md`. |
| **0. Discovery & Design** | Stitch AI Screen Generation | **COMPLETED** | 6 key screens generated, screenshots in `DESIGN.md`. |
| **0. Discovery & Design** | Implementation Task Roadmap | **COMPLETED** | Saved to `task.md`. |
| **0. Discovery & Design** | Persistent Context Anchor | **COMPLETED** | Saved to `memory.md` (this file). |
| **1. Frontend Build (Vite)** | Phase 1.1 – 1.8: Components & Screens | **COMPLETED** | All 14 screens, 9-tab Workspace Hub, standalone Vite frontend built and tested. |
| **1.5 Unified Next.js Migration** | Full-Stack Porting (`next-app/`) | **COMPLETED** | All 14 screens, components, layouts, Presentation Control Panel, and App Router pages ported into Next.js App Router (`next-app/`). |
| **2. Backend API Handlers** | Next.js API Routes (`/app/api/*`) | **COMPLETED & OPERATIONAL** | `/api/auth`, `/api/activities`, `/api/submissions`, `/api/certificates` live and tested. |
| **2.1 Database & Persistence** | Supabase PostgreSQL + Prisma ORM | **LIVE & SYNCED** | Connected to Supabase `nionpjxfbrafuhdpxrmi` via connection pooler (`aws-0-ap-south-1.pooler.supabase.com`). All tables pushed, Prisma Client synced, tested live. Supabase agent skills installed. |
| **2.2 Domain Modules & State Machines** | 5 Modules (Submission, Application, Team, Certificate, Messaging) | **COMPLETED & TESTED** | All 5 modules with state machines, repositories, services, `/api/v1/*` routes, and 56 passing Vitest tests. Roles: Faculty Mentor & External Reviewer removed, responsibilities absorbed by Coordinator. |
| **2.3 Authentication & Session** | NextAuth v5 (Auth.js) + GitHub & Google OAuth | **COMPLETED & VERIFIED** | GitHub & Google OAuth providers + Credentials, auto-syncing OAuth users into Prisma `users` table, client `SessionProvider`, global layout integration. |
| **2.4 Storage & Integrations** | AWS S3 Presigned URLs + Google Calendar API + Event Bus | **COMPLETED & VERIFIED** | S3 client with PUT presigning; Google Calendar & Meet integration (`/api/v1/meetings/calendar`); domain event bus registered with subscribers. |
| **2.5 Build & Type Verification** | Full Turbopack Next.js Build | **100% PASSING** | `npm run build` compiled 24/24 routes cleanly with 0 TypeScript errors. All 67 Vitest tests passing. |
| **3. Integration & QA Acceptance** | QA-01 to QA-16 Automated Verification Suite | **COMPLETED & VERIFIED** | `tests/qa.acceptance.test.ts` passes all 11 integration test scenarios covering state machines, concurrency, role redaction, dual-ledger certificate isolation, and audit trail. |

---

## 8. Handoff Protocol for AI Agents

When an AI agent initializes or switches into this workspace:
1. **Read `memory.md` first:** Understand where the project stands and what constraints are locked.
2. **Consult `task.md`:** Identify the next open checkbox (`- [ ]`) under the active phase.
3. **Do not deviate from the Frontend-First rule:** If asked to write backend code before the frontend is complete, remind the user of the locked roadmap in `task.md`.
4. **Reference requirement IDs:** In code comments and commit descriptions, always link to `FR-XXX`, `PR-XX`, and `QA-XX` (e.g. `// FR-052: Immutable submission versioning`).
5. **Update documentation as tasks finish:** When a task is completed, mark its checkbox in `task.md` (`- [x]`) and update the progress tracker table in `memory.md`.
