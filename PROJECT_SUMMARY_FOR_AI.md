# VBridgeConnect — Quick Project Summary for AI

> **Use this concise summary when providing quick context to AI coding assistants (ChatGPT, Claude, Cursor, Copilot).**

---

### What is VBridgeConnect?
**VBridgeConnect** is an academic collaboration & project governance web application for engineering colleges (specifically tailored for **VIT - Vellore Institute of Technology**). It coordinates capstone projects, research grants, and mini-projects across students, faculty mentors, coordinators, industry experts, and deans.

### Tech Stack
- **Framework**: Next.js 16 (App Router) + React 19 + TypeScript 5
- **Styling**: Tailwind CSS v4 (Indigo `#4F46E5` primary, Slate neutrals)
- **Database**: PostgreSQL (Supabase pooler in Mumbai `ap-south-1`) via Prisma ORM 6
- **Auth**: NextAuth.js v5 (JWT session strategy + Edge middleware + institutional demo fallback)
- **Storage**: AWS S3 (Presigned PUT/GET URLs for deliverables & certificates)
- **Spreadsheets**: SheetJS (`xlsx`) loaded dynamically for NAAC/NBA audit exports

### 4 Key User Roles & Logins
1. **Student** (`vedant.nikumbh@vit.edu.in` / `Test1234!`): Submits deliverables, views project progress, manages credentials.
2. **Coordinator / Mentor** (`sheetal.patil@vit.edu.in` / `Test1234!`): Allocates project topics, schedules mentor syncs, fills the Review-2 panel evaluation form, evaluates submissions.
3. **Industry Partner** (`expert@industry.com` / `expert123`): Mentors company-sponsored projects. Scoped away from student grades/GPAs (FR-092).
4. **Super Admin** (`admin@vbridge.com` / `admin123`): Inspects all group evaluations, audits tamper-evident logs (FR-130), exports NAAC/ABET compliance Excels.

### Key Screens & Components
- `/login`: Unified institutional login with SSO and role preview selector.
- `/dashboard`: Role-based home (Student workspace status, Mentor exception queue, or Admin).
- `/projects/[teamId]`: **The Single Shared Workspace Hub** with 4 core tabs:
  1. `Overview`: Project abstract, team roster, upcoming deadlines.
  2. `Milestones & Deliverables`: Multi-stage deliverable tracking with immutable versions.
  3. `Mentor Sync & Meet`: Scheduled sync meetings with professor video meeting links.
  4. `TE Review-2 Form`: Official 18-question evaluation form for panel evaluators with live mapped marks (/50M).
- `/admin/reports`: Accreditation audit dashboard, complete evaluation records table, and 1-click Excel export.
- `/certificates`: Digital credentials split into platform-issued (verified, QR code, SHA-256) and self-reported.

### Essential Rules for Any AI Modifying This Project
1. **Frontend-first, Next.js App Router**: Everything lives inside `next-app/src/`.
2. **Never use external avatars**: Do not call `api.dicebear.com`. Use `<InitialsAvatar name={user.name} />`.
3. **Lazy load heavy libraries**: Use `const XLSX = await import('xlsx')` or `next/dynamic` for large components.
4. **Preserve State Machine Integrity**: Every milestone submission is immutable; new uploads must create a new version row.
