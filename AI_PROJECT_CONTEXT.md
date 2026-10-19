# VBridgeConnect — Master AI Context & Project Specification

> **HOW TO USE THIS FILE WITH EXTERNAL AI (ChatGPT, Claude, Cursor, Gemini, Copilot):**  
> Copy and paste this entire file (or attach it) to any AI conversation. It provides complete, unambiguous context about the business mission, architecture, technology stack, directory map, user personas, API contracts, database schema, and strict engineering rules.

---

## 1. Executive Summary & Core Mission

**VBridgeConnect** is an enterprise-grade academic collaboration, capstone mentorship, and project governance platform built specifically for universities (tailored for **Vellore Institute of Technology - VIT** and scalable to all engineering institutions).

It solves the chaotic, unstandardized tracking of student mini-projects, capstone research, and industry-sponsored innovations by providing:
1. **A Single Source of Truth (PR-01)** for multidisciplinary student projects, mentor syncs, and deliverable reviews.
2. **Structured Multi-Stage Milestone Progression** with immutable deliverable version history (**FR-052**).
3. **Official Faculty & Review Panel Evaluation**: Implemented through interactive forms (e.g., *TE Mini-Project Review-2*) with live marks mapping (out of 50M) and 1-click **Excel (.xlsx) audit exports** for accreditation bodies (**NAAC, NBA, ABET**).
4. **Dual-Ledger Digital Credentials**: Cryptographically signed platform certificates with SHA-256 verification hashes and QR codes (**FR-114**) structurally isolated from student self-reported certificates (**FR-115**).
5. **Automated Cohort Onboarding**: Excel / PDF student-faculty roster parser that automatically connects admitted students and faculty guides upon login.
6. **Early Team Risk Escalation (FR-070 to FR-075)**: Visual flags for at-risk student teams (>48h overdue, 2+ consecutive deliverable rejections, or mentor inactivity).

---

## 2. Technology Stack

| Layer | Technology | Key Details & Rules |
| :--- | :--- | :--- |
| **Framework** | **Next.js 16 (App Router)** | Full-stack server components + client views (`next-app/src/app`) |
| **Language** | **TypeScript 5 (Strict Mode)** | 100% typed domain models, no `any` in production code |
| **Styling** | **Tailwind CSS v4** | Institutional Indigo (`#4F46E5`), Slate neutrals, custom badges |
| **Database** | **PostgreSQL (Supabase)** | Hosted in `ap-south-1` via Supavisor connection pooler |
| **ORM** | **Prisma ORM 6** | Schema in `next-app/prisma/schema.prisma` |
| **Authentication** | **NextAuth.js v5 (Auth.js) + JWT** | Edge-compatible JWT strategy with cookie demo fallbacks |
| **State Management** | **Zustand 5** | Global store in `next-app/src/store/appStore.ts` |
| **Object Storage** | **AWS S3 Presigned URLs** | Region `ap-south-1`, bucket `v-bridgecertificate` |
| **Excel Generation** | **SheetJS (xlsx)** | Dynamic import on-demand for zero initial bundle bloat |
| **Icons** | **Lucide React** | Feather-derived icons; optimized imports |

---

## 3. Four Core User Personas & Scopes

| Role | Demo Credentials | Default Route | Permissions & Scope |
| :--- | :--- | :--- | :--- |
| **STUDENT** | `vedant.nikumbh@vit.edu.in`<br>Password: `Test1234!` | `/dashboard` | Submit milestones, view active group workspace, see published evaluation remarks, upload certificates, browse opportunities. |
| **COORDINATOR** *(Faculty Mentor / Guide)* | `sheetal.patil@vit.edu.in`<br>Password: `Test1234!` | `/mentor/dashboard` | Assign projects to groups, create milestones, schedule mentor meetings, fill Review-2 Evaluation Forms, grade rubrics. |
| **INDUSTRY_PARTNER** *(Corporate Reviewer)* | `expert@industry.com`<br>Password: `expert123` | `/dashboard` | Review deliverables of assigned projects. **Strictly blocked** from viewing student GPAs, institutional grades, or faculty-private notes (**FR-092**). |
| **SUPER_ADMIN** *(Dean / Higher Authority)* | `admin@vbridge.com`<br>Password: `admin123` | `/admin/reports` | Full institutional visibility. Inspects all evaluation records, views cryptographic audit trail (**FR-130**), exports NAAC/ABET audit Excels. |

---

## 4. Information Architecture & Key Routes

```
/
├── /login                         -> Unified Split-Screen Sign In (SSO, Institutional @vit.edu.in, Admin)
├── /dashboard                     -> Role-aware dashboard (Student Home / Mentor overview / Admin)
├── /opportunities                 -> Multidisciplinary project catalog with tag filters & prerequisites
├── /projects/[teamId]             -> THE SINGLE SHARED WORKSPACE HUB (9 scoped tabs)
│     ├── Overview                 -> Project abstract, team lead, active milestone deadline
│     ├── Milestones & Deliverables-> Deliverable versioning, upload dropzone, status badges
│     ├── Mentor Sync & Meet       -> Meeting agendas, scheduled timestamps, video call URLs
│     └── TE Review-2 Form         -> Official 18-question evaluation form for panel evaluators
├── /certificates                  -> Digital credential portfolio (Verified Platform vs Self-Reported)
├── /messages                      -> Real-time multi-user team messaging & mentor direct sync
├── /mentor/dashboard              -> Faculty cohort risk matrix, proposal reviews, group management
├── /coordinator/roster-upload     -> Cohort bulk upload (Excel .xlsx / PDF roster parsing)
└── /admin/reports                 -> Super Admin audit ledger, Review-2 evaluation records & Excel export
```

---

## 5. Directory & File Structure (`next-app/`)

```
next-app/
├── prisma/
│   ├── schema.prisma              # Database schema (User, Team, Milestone, Submission, AuditEvent, etc.)
│   └── seed.ts                    # Idempotent database fixtures
├── public/                        # Static assets, institutional crests, icons
├── src/
│   ├── app/                       # Next.js App Router (Pages & API endpoints)
│   │   ├── layout.tsx             # Root layout with SessionProvider, Shell, ToastProvider
│   │   ├── loading.tsx            # Root streaming loader (instant HTTP 200 chunked Suspense fallback)
│   │   ├── error.tsx              # Root client error boundary with retry and reset()
│   │   ├── global-error.tsx       # Root layout fallback boundary
│   │   ├── not-found.tsx          # Institutional 404 page
│   │   ├── page.tsx               # Redirects root to /login
│   │   ├── login/page.tsx         # Unified authentication portal
│   │   ├── dashboard/page.tsx     # Role-based dashboard dispatcher
│   │   ├── projects/[teamId]/     # Project workspace hub
│   │   ├── certificates/page.tsx  # Credential showcase
│   │   ├── admin/reports/page.tsx # Institutional audit & analytics
│   │   └── api/v1/                # REST API endpoints
│   │       ├── evaluations/review-2/route.ts  # TE Review-2 evaluation submission & retrieval
│   │       ├── mentor/assign-project/route.ts # Faculty project topic assignment
│   │       ├── meetings/route.ts              # Mentor sync planning & video links
│   │       ├── roster/upload/route.ts         # Bulk student roster ingestion
│   │       ├── student/dashboard/route.ts     # Real-time student progress aggregation
│   │       └── certificates/                  # Cryptographic credential verification
│   ├── components/                # Reusable UI primitives
│   │   ├── common/                # Button, Card, Badge, RiskBadge, Modal, InitialsAvatar
│   │   ├── evaluation/            # EvaluationFormReview2 (Official 18-question review panel form)
│   │   └── admin/                 # Review2EvaluationAuditTable (Live audit KPIs & Excel export)
│   ├── layouts/                   # Shells: DesktopShell (responsive), TopNavbar, Sidebar
│   ├── screens/                   # High-level screen components
│   │   ├── student/StudentDashboard.tsx
│   │   ├── mentor/MentorDashboard.tsx
│   │   ├── workspace/WorkspaceHub.tsx
│   │   └── admin/AnalyticsAuditReports.tsx
│   ├── store/
│   │   └── appStore.ts            # Zustand client state (currentUser, activeWorkspace, notifications)
│   ├── types/
│   │   └── index.ts               # Core TypeScript definitions (User, Team, Milestone, Submission, etc.)
│   └── lib/
│       ├── auth/                  # NextAuth v5 configuration, edge middleware rules, get-session.ts
│       ├── db/prisma.ts           # Prisma client singleton
│       └── integrations/s3.ts     # AWS S3 Presigned URL generator
```

---

## 6. Official Feature Spotlight: TE Mini-Project Review-2 Evaluation

In Indian engineering curricula (specifically TE level at VIT), student groups undergo periodic formal reviews. The official **Review-2 (2026-27)** form is built into the Workspace (`/projects/[teamId]` -> `TE Review-2 Form`):

### The 18 Evaluation Criteria:
1. **Select Project Group for Evaluation**: Dropdown of groups, pre-selected to active team.
2. **Were all the students present for the review ?**: Yes / No (With CC notification note).
3. **Names of Absent students if any**: Text ('NA' if all present).
4. **Suggested Title of the Project**: Evaluator recommendation.
5. **Outcome of Project Idea Presentation**: `Idea Approved` / `Modifications required`.
6. **Modifications suggested (if any)**: Mandatory if Outcome is *"Modifications required"*.
7. **Outcome expected from the project (#MANDATORY)**: Final measurable completion target.
8. **Project Planning**: 1 to 10 scale (mapped to **5 Marks**).
9. **Clarity of Problem Statement and Objectives**: 1 to 10 scale (mapped to **10 Marks**).
10. **Literature Review**: 1 to 10 scale (mapped to **15 Marks**).
11. **Analysis - Execution / Real life application / Usability**: 1 to 10 scale (mapped to **20 Marks**).
12. **Difficulty level of project as per UG level**: 1 to 10 scale.
13. **Quality of the Presentation**: 1 to 10 scale.
14. **Whether the students were speaking in Proper English ?**: 1 to 10 scale.
15. **How much percent of the Project is Completed?**: `0-25%`, `25-50%`, `50-75%`, `75-90%`, `90-100%`.
16. **Name of Panel Member 1**: Text input.
17. **Name of Panel Member 2**: Text input.
18. **Optional Attachment**: Word, Excel, PPT, PDF, Image up to 10MB.

### Score Formula:
$$\text{Total Marks (/50)} = (\text{Planning} \times 0.5) + (\text{Problem} \times 1.0) + (\text{Lit Review} \times 1.5) + (\text{Analysis} \times 2.0)$$

### Super Admin Results:
- Evaluated results immediately sync to Super Admin (`/admin/reports`).
- Includes a 1-click **"Export Review-2 Excel (.xlsx) for Audit"** button using `SheetJS` to generate compliant spreadsheets for higher authorities.

---

## 7. Non-Negotiable Engineering Rules

When writing or modifying code for this project, you MUST respect these architectural rules:

1. **Immutable Submissions (FR-052)**: Resubmissions MUST ALWAYS create a new `SubmissionVersion` row. NEVER perform an in-place `UPDATE` on prior deliverable files or summaries.
2. **Credential Segregation (FR-114 & FR-115)**: Platform-verified certificates (gold foil seal, QR verification code, SHA-256 hash) must never be mixed with student self-reported certificates (dashed border, disclaimer banner).
3. **Role Scoping (FR-092)**: Industry Partners can only view deliverables of teams they mentor. They must never see student GPAs, institutional grades, or faculty-private remarks.
4. **Zero Unnecessary Network Requests**: Never query external avatar generators like `api.dicebear.com`. Use the local `<InitialsAvatar name={user.name} />` component.
5. **Dynamic Imports for Heavy Bundles**: Libraries like `xlsx` or heavy client modals must be imported dynamically (`const XLSX = await import('xlsx')`) to preserve fast page loading.
6. **State Transitions are Verbs**: Use explicit REST verbs (`POST /api/v1/submissions/[id]/grade`, `POST /api/v1/evaluations/review-2`), never generic PATCH updates.

---

## 8. Common CLI Commands

```bash
# Run local dev server
cd next-app
npm run dev

# Run production build (fastest, optimized)
npm run build
npm run start

# Generate Prisma Client after schema changes
npx prisma generate

# Execute automated test suite
npm run test
```
