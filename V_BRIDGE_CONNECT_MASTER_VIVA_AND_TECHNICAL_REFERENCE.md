# VBridgeConnect — Complete Technical Reference & Viva Voce Master Manual

> **Document Type:** Master Architectural Specification, Technical Dictionary & Viva Voce Defense Guide  
> **Target Audience:** Engineering Students, Project Review Panels, Faculty Coordinators, External Examiners (VIT Vellore / Chennai)  
> **System Name:** **VBridgeConnect** (Academic Collaboration, Mentorship & Capstone Project Governance Portal)  
> **Curricular Target:** B.Tech / M.Tech Capstone Projects, Mini-Projects (TE/BE), Research Grants, Industry-Sponsored Mentorship  
> **Accreditation Alignment:** **NAAC (Criteria 1 & 2)**, **NBA (Outcome-Based Education - Tier 1)**, **ABET Compliance**

---

# Table of Contents
1. [Executive Summary & System Purpose](#1-executive-summary--system-purpose)
2. [Complete A-to-Z Technical Terms & Concept Dictionary](#2-complete-a-to-z-technical-terms--concept-dictionary)
3. [Full-Stack Architecture & Component Execution Model](#3-full-stack-architecture--component-execution-model)
4. [Database Modeling & PostgreSQL Supabase Architecture](#4-database-modeling--postgresql-supabase-architecture)
5. [Deterministic Finite State Machines & Lifecycles](#5-deterministic-finite-state-machines--lifecycles)
6. [Security, Authentication & Role-Based Access Control (RBAC)](#6-security-authentication--role-based-access-control-rbac)
7. [Vercel Production Authentication Diagnosis & Fix](#7-vercel-production-authentication-diagnosis--fix)
8. [Academic Specialization: VIT TE Review-2 & Cohort Roster Ingestion](#8-academic-specialization-vit-te-review-2--cohort-roster-ingestion)
9. [DevOps, Cloud Storage & Performance Engineering](#9-devops-cloud-storage--performance-engineering)
10. [Comprehensive Technical Viva Voce Question Bank (60+ In-Depth Q&As)](#10-comprehensive-technical-viva-voce-question-bank-60-in-depth-qas)
    - [10.1 System Architecture & Framework Design](#101-system-architecture--framework-design)
    - [10.2 Frontend, Next.js 16 & React 19 RSCs](#102-frontend-nextjs-16--react-19-rscs)
    - [10.3 Backend REST APIs, Middleware & Event Bus](#103-backend-rest-apis-middleware--event-bus)
    - [10.4 Database Engineering, PostgreSQL & Prisma ORM](#104-database-engineering-postgresql--prisma-orm)
    - [10.5 Authentication, NextAuth v5 & Security Auditing](#105-authentication-nextauth-v5--security-auditing)
    - [10.6 State Machines & Business Logic Validation](#106-state-machines--business-logic-validation)
    - [10.7 DevOps, Cloud Storage & Vercel Edge Hosting](#107-devops-cloud-storage--vercel-edge-hosting)
    - [10.8 Institutional Governance, NAAC/NBA & Viva Edge Cases](#108-institutional-governance-naacnba--viva-edge-cases)

---

# 1. Executive Summary & System Purpose

### 1.1 The Problem It Solves
In Indian engineering universities (such as **Vellore Institute of Technology - VIT**), project governance is traditionally plagued by administrative fragmentation:
- **Disjointed Channels:** Students communicate through unmonitored WhatsApp or Telegram groups, faculty receive code and reports over scattered email threads, and evaluations are jotted down on loose paper rubrics or static Google Forms.
- **Lost Project Provenance:** Deliverables are overwritten or lost; panel members have no tamper-evident way to verify when a student group submitted code versus when an advisor approved it.
- **Accreditation Headaches:** When **NAAC** (National Assessment and Accreditation Council) or **NBA** (National Board of Accreditation) visits campus, department coordinators spend weeks manually cross-referencing spreadsheets to compile project marks, industry sponsorship proofs, and rubrics.
- **Unguarded External Mentorship:** When corporate mentors assist on projects, universities risk exposing private student academic records (GPAs, institutional emails, internal faculty remarks) to third parties without role segregation.

### 1.2 The VBridgeConnect Solution
**VBridgeConnect** is an enterprise-grade academic collaboration and project governance portal engineered to serve as the **Single Source of Truth (PR-01)** for multidisciplinary university engineering projects.

Key architectural pillars:
1. **Single Source of Truth (PR-01):** Every team roster, meeting agenda, code submission, faculty review, and grade is stored in a centralized relational database.
2. **Immutable Deliverables (PR-02 / FR-052):** Submissions cannot be overwritten in place. Any revised code or documentation creates a new sequentially versioned audit record.
3. **Dual-Ledger Digital Credentials (PR-04 / FR-114 & FR-115):** Platform-verified certificates (backed by SHA-256 cryptographic hashes and instant QR code verification) are structurally segregated from student self-reported certificates.
4. **Official TE Review-2 Evaluation Engine:** Integrated 18-question evaluation panel form mapped directly to a standardized 50-mark rubric with instant 1-click Excel export for audit bodies.
5. **Role-Scoped Access Control (PR-06 / FR-092):** Strict server-side access boundaries ensuring industry partners mentor teams without visibility into institutional student grades.

---

# 2. Complete A-to-Z Technical Terms & Concept Dictionary

| Term / Acronym | Full Form / Technical Definition | Context in VBridgeConnect |
| :--- | :--- | :--- |
| **ABET** | Accreditation Board for Engineering and Technology | International engineering accreditation benchmark satisfied by our tamper-evident milestone histories. |
| **ACID** | Atomicity, Consistency, Isolation, Durability | Database transaction properties guaranteed by PostgreSQL when processing capacity selection and grading. |
| **App Router** | Next.js 13+ Directory-based Routing System (`src/app`) | Implements React Server Components, streaming suspense, and layout inheritance across workspaces. |
| **Audit Log (FR-130)** | Append-Only Cryptographic Event Trail | Captures every critical transition (`actor`, `prior_value`, `new_value`, `ip_address`, `timestamp`). |
| **AWS S3** | Amazon Simple Storage Service (Bucket: `v-bridgecertificate`) | Secure cloud object storage for student report PDFs, ZIP archives, and generated certificate SVGs/PDFs. |
| **Bcrypt** | Adaptive Password Hashing Function | Blowfish-based cryptographic hashing with salt rounds ($10$) used to store student and mentor passwords securely. |
| **Capacity Locking** | Database Row-Level Locking (`FOR UPDATE`) | Prevents project slot oversubscription when multiple students apply for limited mentor vacancies concurrently. |
| **CSRF** | Cross-Site Request Forgery | Web attack prevented in NextAuth by cryptographically matching the `__Host-authjs.csrf-token` cookie with request bodies. |
| **Direct URL** | Unpooled Database Port (5432) | Direct TCP connection to Supabase PostgreSQL used exclusively by Prisma during schema migrations (`prisma migrate`). |
| **Dual-Ledger Credentials** | Two-Tiered Certificate Architecture | Strict structural separation between platform-issued cryptographically verified certificates and student self-uploaded certificates. |
| **Edge Runtime** | Lightweight V8 Serverless Execution Environment | Ultra-fast execution environment used by `middleware.ts` to inspect JWT session tokens before page rendering without Node.js overhead. |
| **Envelope Pattern** | Standardized JSON API Response Structure | All REST responses follow `{ data, meta, error }` with typed HTTP status codes and unique `requestId` tracking. |
| **Event Bus** | In-Process Publish/Subscribe Domain Dispatcher | Decouples core business transactions (e.g. `milestone.accepted`) from asynchronous notifications and risk evaluations. |
| **FSM** | Finite State Machine | Mathematical model of computation ensuring entities (Milestones, Submissions) only transition through valid, verified states. |
| **HKDF** | HMAC-based Extract-and-Expand Key Derivation Function | Cryptographic algorithm used by NextAuth to derive symmetric encryption and signing keys from `AUTH_SECRET`. |
| **Idempotency Key** | Unique Client Transaction Token (`X-Idempotency-Key`) | Header passed with state-changing requests to ensure network retries on flaky mobile connections never duplicate submissions. |
| **Immutable Submissions** | Non-Destructive Update Pattern (FR-052) | Re-submissions create a new `SubmissionVersion` row; prior files, remarks, and timestamps are permanently preserved. |
| **InitialsAvatar** | Local Deterministic Avatar Generator | Custom SVG/CSS fallback component generating user avatars from names, eliminating unreliable external network calls (e.g. DiceBear). |
| **JWT** | JSON Web Token (RFC 7519) | Signed, stateless authorization token carrying user ID, institutional email, and role inside an encrypted HTTP-only cookie. |
| **Lucide React** | Tree-Shakeable Icon Library | Feather-derived minimalist UI icon set statically compiled for zero runtime performance overhead. |
| **Modular Monolith** | Single Deployable with Strictly Enforced Domain Boundaries | Architectural pattern grouping Activities, Teams, Submissions, and Certificates into isolated domain modules inside one codebase. |
| **NAAC** | National Assessment and Accreditation Council | Indian accreditation council whose Criteria 1 (Curricular Aspects) and Criteria 2 (Teaching-Learning) are supported by our exports. |
| **NBA** | National Board of Accreditation | Indian accreditation body adhering to the Washington Accord; satisfied by our rubric-mapped Outcome Based Education reports. |
| **NextAuth v5 (Auth.js)** | Modern Full-Stack Authentication Framework | Edge-compatible session management engine supporting OAuth2, institutional credentials, and JWT encryption. |
| **NIRF** | National Institutional Ranking Framework | Indian Ministry of Education ranking metric bolstered by structured student research tracking and industry mentorship records. |
| **OBE** | Outcome Based Education | Pedagogical methodology measuring student learning outcomes through rubric-based scoring (Review-2 50-mark distribution). |
| **Optimistic Locking** | Concurrency Control via Version Increment | Mechanism using an entity's `version` field to reject concurrent conflicting updates without blocking database reads. |
| **PgBouncer / Supavisor** | High-Performance PostgreSQL Connection Pooler | Supabase proxy running on port 6543 managing hundreds of ephemeral serverless connections to avoid database exhaustion. |
| **Presigned URL** | Time-Limited Authenticated S3 Upload/Download Link | Secure S3 link generated on the server (`AWS SDK v3`) allowing clients to PUT/GET files directly to S3 without exposing bucket credentials. |
| **Prisma ORM 6** | Next-Generation TypeScript Object-Relational Mapper | Type-safe database query engine providing automated schema migrations, relation loading, and compile-time query validation. |
| **PWA** | Progressive Web App | Web application utilizing Service Workers (`sw.js`) and web app manifests (`manifest.json`) for installability and offline caching. |
| **RBAC** | Role-Based Access Control | Authorization framework enforcing granular endpoint permissions based on user roles (`student`, `coordinator`, `industry_partner`, `super_admin`). |
| **RSC** | React Server Component | Server-side rendered component executed exclusively on the server, streaming HTML to the browser with zero JavaScript bundle size. |
| **SHA-256** | Secure Hash Algorithm (256-bit digest) | One-way cryptographic hash generated over certificate metadata (`recipient`, `activity`, `completionDate`) for public authenticity checks. |
| **SheetJS (`xlsx`)** | Pure JavaScript Spreadsheet Engine | Client/server library dynamically loaded on-demand (`import('xlsx')`) to generate formatted `.xlsx` audit reports without bundle bloat. |
| **Soft Delete** | Non-Destructive Inactivation Pattern | Marking entities with `archived_at` or `status: 'archived'` rather than issuing SQL `DELETE` commands, maintaining audit integrity. |
| **Supabase** | Cloud Postgres Platform (Region: `ap-south-1` Mumbai) | Managed database backend providing PostgreSQL, connection pooling, and low-latency storage close to Indian universities. |
| **Tailwind CSS v4** | Utility-First Modern CSS Framework | Modern styling engine with native CSS cascade layers, custom institutional color palette (Indigo `#4F46E5`), and responsive flex/grid layouts. |
| **TIMESTAMPTZ** | PostgreSQL Timestamp with Time Zone | Database column type storing absolute UTC timestamps, preventing time skew across client devices and international reviewers. |
| **TWA** | Trusted Web Activity | Google Play Store Android wrapper packaging the PWA using Chrome Custom Tabs and Digital Asset Links (`.well-known/assetlinks.json`). |
| **UUID v4** | Universally Unique Identifier (128-bit) | Cryptographically random primary key preventing enumeration attacks (e.g. `GET /projects/1` vs `GET /projects/4f9e...`). |
| **VAPID** | Voluntary Application Server Identification (RFC 8292) | Cryptographic key pair scheme authenticating web push notification servers directly to browser push endpoints without Google account logins. |
| **Washington Accord** | International Accreditation Agreement | Global standard for professional engineering degrees represented in India by NBA Tier-1 compliance. |
| **Zustand 5** | Minimalist Lightweight Client State Store | Fast, unopinionated React client state management store (`appStore.ts`) tracking active workspace tabs, user profiles, and UI toasts. |

---

# 3. Full-Stack Architecture & Component Execution Model

### 3.1 Architectural Paradigm: The Modular Monolith
VBridgeConnect is engineered as a **Modular Monolith**. Rather than introducing the operational overhead, network latency, and distributed transaction complexity of microservices, all functionality resides within a single, highly structured Next.js codebase.

```mermaid
flowchart TB
    subgraph Browser["Client Layer (Responsive Web / Mobile TWA)"]
        UI["React 19 Frontend Components"]
        STORE["Zustand Global Store"]
    end

    subgraph Edge["Vercel Edge Network"]
        MW["middleware.ts\n(JWT verification & Edge RBAC)"]
    end

    subgraph NextServer["Next.js 16 Application Server (Node.js Serverless)"]
        AUTH["NextAuth.js v5 (Auth.js)"]
        ROUTER["App Router REST API (/api/v1/*)"]
        
        subgraph DomainModules["Internal Domain Modules"]
            ACT["Activities"]
            TEAM["Teams & Roster"]
            MS["Milestones & Submissions"]
            EVAL["TE Review-2 Evaluation"]
            CERT["Dual-Ledger Certificates"]
            MSG["Workspace Messaging"]
        end

        BUS["In-Process Domain Event Bus"]
        AUDIT["Audit & Compliance Engine"]
    end

    subgraph Storage["External Cloud Infrastructure"]
        S3[("AWS S3 Bucket\n(Presigned File Deliverables)")]
        SUPA_POOL[("Supabase Supavisor Pooler\n(:6543 Transaction Mode)")]
        PG[("PostgreSQL 15 Database\n(ap-south-1 Mumbai)")]
    end

    UI --> MW
    MW --> ROUTER
    ROUTER --> AUTH
    ROUTER --> DomainModules
    DomainModules --> BUS
    BUS --> AUDIT
    BUS -.-> DomainModules
    DomainModules --> SUPA_POOL --> PG
    DomainModules --> S3
```

### 3.2 The 3 Execution Mechanisms for State Transitions
Every status change across activities, milestones, deliverables, and teams is strictly governed by one of three execution mechanisms:
1. **Synchronous REST Action Call:** Triggered directly by authenticated user interaction (`POST /api/v1/milestones/:id/accept`). Validates roles, updates database rows, and publishes an in-process domain event.
2. **Scheduled Automated Cron Sweeps:** Time-based jobs executed via scheduled serverless webhooks (`/api/cron/*` with `CRON_SECRET` authorization). Examples:
   - *Milestone Overdue Sweep (Every 15 min):* Checks milestones where `due_date < NOW()` and status is unsubmitted; sets status to `overdue`.
   - *Team Inactivity Sweep (Every 6 hrs):* Calculates elapsed time since last meaningful team activity; escalates risk from `on_track` to `watch` or `at_risk`.
3. **Internal Event Bus Cascade Listeners:** Pure code-level event subscriptions decoupling side effects. When a milestone becomes `overdue`, the event bus notifies the Team Module to recalculate risk and notifies the Notification Module to dispatch emails. **No raw database triggers are used for business logic**, ensuring full testability and visibility.

---

# 4. Database Modeling & PostgreSQL Supabase Architecture

### 4.1 Connection Architecture (Pooled vs Direct)
VBridgeConnect utilizes **Supabase PostgreSQL** hosted in the `ap-south-1` (Mumbai) region for minimum latency to Indian academic campuses:
- **`DATABASE_URL` (Port 6543 via Supavisor):** Configured with `?pgbouncer=true&connection_limit=10&pool_timeout=15`. Used by Next.js Serverless lambdas to multiplex database requests through a high-performance transaction pooler, preventing connection exhaustion.
- **`DIRECT_URL` (Port 5432 Direct TCP):** Used exclusively by Prisma CLI for schema migrations (`prisma migrate deploy`) where prepared statements and session-level DDL locks are required.

### 4.2 Comprehensive Entity-Relationship Diagram

```mermaid
erDiagram
    User ||--o{ TeamMembership : "belongs to"
    User ||--o{ Activity : "creates / coordinates"
    User ||--o{ Application : "submits"
    User ||--o{ Submission : "uploads"
    User ||--o{ Review2Evaluation : "evaluates"
    User ||--o{ Certificate : "holds"
    User ||--o{ AuditEvent : "acts in"
    
    Department ||--o{ User : "contains"
    Department ||--o{ Activity : "hosts"

    Activity ||--o{ Application : "receives"
    Activity ||--o{ Team : "governs"
    Activity ||--o{ Milestone : "mandates"

    Team ||--o{ TeamMembership : "roster"
    Team ||--o{ Submission : "owns"
    Team ||--o{ Review2Evaluation : "receives evaluation"
    Team ||--o{ Conversation : "workspace chat"

    Milestone ||--o{ Submission : "targets"
    Submission ||--o{ SubmissionVersion : "version history"

    Conversation ||--o{ Message : "contains"
```

### 4.3 Database Schema Blueprint & Constraints

| Table / Entity | Primary Key | Key Columns & Types | Foreign Keys & Cascades | Integrity Constraints & Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `users` | `UUID` | `email` (VARCHAR, UNIQUE)<br>`passwordHash` (TEXT)<br>`role` (ENUM: `UserRole`)<br>`facultyCode` (VARCHAR, UNIQUE) | `departmentId` -> `departments(id)` (SET NULL) | Email normalized to lowercase. Roles: `student`, `coordinator`, `industry_partner`, `super_admin`. |
| `departments` | `UUID` | `name` (VARCHAR, UNIQUE)<br>`code` (VARCHAR, e.g. "SCOPE") | None | Represents university academic divisions (e.g. Computer Science, Electronics). |
| `activities` | `UUID` | `title` (VARCHAR)<br>`capacity` (INT)<br>`status` (ENUM: `ActivityStatus`) | `ownerId` -> `users(id)`<br>`departmentId` -> `departments(id)` | Governs capstone project cycles, internships, and research grants. |
| `teams` | `UUID` | `name` (VARCHAR)<br>`riskStatus` (ENUM: `TeamRiskStatus`)<br>`projectTitle` (TEXT) | `activityId` -> `activities(id)`<br>`facultyGuideId` -> `users(id)`<br>`industryGuideId` -> `users(id)` | Single collaboration unit. Tracks team health (`on_track`, `watch`, `at_risk`, `blocked`). |
| `team_memberships`| `UUID` | `role` (ENUM: `lead`, `contributor`)<br>`joinedAt` (TIMESTAMPTZ) | `teamId` -> `teams(id)` (CASCADE)<br>`userId` -> `users(id)` (CASCADE) | Unique constraint on `[teamId, userId]` prevents double enrollment. |
| `milestones` | `UUID` | `title` (VARCHAR)<br>`dueDate` (TIMESTAMPTZ)<br>`weightage` (INT)<br>`status` (ENUM: `MilestoneStatus`) | `activityId` -> `activities(id)` (CASCADE) | Stage deliverables (e.g., Synopsis, Literature Review, TE Review-2, Final Thesis). |
| `submissions` | `UUID` | `status` (ENUM: `SubmissionStatus`)<br>`currentVersion` (INT) | `milestoneId` -> `milestones(id)`<br>`teamId` -> `teams(id)`<br>`submittedById` -> `users(id)` | Root container for milestone deliverables. Immutable versioning anchored here. |
| `submission_versions`| `UUID` | `versionNumber` (INT)<br>`fileUrl` (TEXT)<br>`fileChecksum` (VARCHAR)<br>`createdAt` (TIMESTAMPTZ) | `submissionId` -> `submissions(id)` (CASCADE) | **FR-052 Immutable Submissions:** Stores historical deliverable snapshots and S3 pointers. |
| `review2_evaluations`| `UUID` | `totalMarks` (FLOAT, /50)<br>`planningScore` (INT, 1-10)<br>`problemScore` (INT, 1-10)<br>`litReviewScore` (INT, 1-10)<br>`analysisScore` (INT, 1-10)<br>`completedPercent` (VARCHAR) | `teamId` -> `teams(id)`<br>`evaluatedById` -> `users(id)` | Official VIT TE Mini-Project Review-2 18-question evaluation record. |
| `certificates` | `UUID` | `type` (ENUM: `platform_issued`, `self_reported`)<br>`status` (ENUM: `CertificateStatus`)<br>`verificationHash` (VARCHAR, UNIQUE)<br>`metadata` (JSONB) | `recipientId` -> `users(id)`<br>`activityId` -> `activities(id)` (OPTIONAL) | Dual-ledger credential store. Platform certificates carry SHA-256 hash. |
| `audit_events` | `UUID` | `actorId` (UUID)<br>`action` (VARCHAR)<br>`entityType` (VARCHAR)<br>`entityId` (UUID)<br>`priorValue` (JSONB)<br>`newValue` (JSONB)<br>`timestamp` (TIMESTAMPTZ) | `actorId` -> `users(id)` | Append-only audit trail satisfying **FR-130** and institutional compliance requirements. |
| `roster_invitations`| `UUID`| `registrationNumber` (VARCHAR)<br>`email` (VARCHAR)<br>`assignedGuideCode` (VARCHAR)<br>`claimed` (BOOLEAN) | None | Staged student-faculty cohort mappings parsed from official university spreadsheets. |

---

# 5. Deterministic Finite State Machines & Lifecycles

### 5.1 Activity Lifecycle (9 States)
```
[draft] ──(submit)──> [awaiting_approval] ──(approve)──> [published]
                                                              │
                                                        (close deadline)
                                                              │
[completed] <──(finalize)── [under_final_review] <── [active] <───┘
     │
(retention passed)
     │
[archived] (Terminal)
* Can transition to [cancelled] from draft, awaiting_approval, or published.
```

### 5.2 Milestone Lifecycle (8 States)
```
[not_started] ──(work begun)──> [in_progress] ──(submit deliverable)──> [submitted]
      │                                                                      │
  (deadline passed)                                                    (faculty review)
      │                                                                ┌─────┴─────┐
      ▼                                                                ▼           ▼
  [overdue] <───────────────────────────────────────────────── [changes_requested] [accepted]
      │                                                                             (Final)
      └──(faculty waive)──> [waived]
```

### 5.3 Submission Lifecycle & Versioning (FR-052)
A submission begins in `draft` or `submitted`. 
- When an advisor or review panel requests edits, it moves to `changes_requested`.
- **Under NO circumstances does the student edit the existing row.**
- The student uploads a new deliverable via `POST /api/v1/submissions/:id/resubmit`. This increments `currentVersion` and creates an immutable child row in `submission_versions`.
- Prior files and marks remain permanently readable by coordinators and accreditation auditors.

### 5.4 Team Risk Escalation Engine (FR-070 to FR-075)
Team risk is continuously evaluated across 4 states:
1. **`on_track` (Green):** All active milestones are pending or accepted within deadlines; mentor sync occurred within the last 14 days.
2. **`watch` (Yellow):** Single overdue milestone (<48h) OR no mentor meeting recorded for 15-21 days.
3. **`at_risk` (Orange):** Milestone overdue >48 hours OR 2 consecutive deliverable rejections (`changes_requested`). Triggers automated notifications to the Department Coordinator.
4. **`blocked` (Red):** Critical deliverable rejected twice with unresolved blocker flag OR mentor inactive for >30 days. Escalated to Dean / Academic Chair.

---

# 6. Security, Authentication & Role-Based Access Control (RBAC)

### 6.1 Authentication Architecture (NextAuth v5 + JWT)
- **Token Format:** Cryptographically signed JWE (JSON Web Encryption) utilizing AES-256-GCM encryption with HKDF key derivation from `AUTH_SECRET`.
- **Stateless Verification:** Sessions are decoded directly in Vercel Edge Middleware (`middleware.ts`) without querying the database on every HTTP asset request, yielding sub-10ms route validation.
- **Edge Security Isolation:** Heavy cryptographic libraries (`bcrypt`, `nodemailer`) and database drivers (`@prisma/client`) are strictly isolated to Node.js Serverless handlers and never bundled into the Edge Middleware bundle.

### 6.2 Role Permissions Matrix

| Platform Action / Resource | Student | Coordinator (Faculty) | Industry Partner | Super Admin (Dean) |
| :--- | :---: | :---: | :---: | :---: |
| Submit Deliverables & Code | **Allowed** | Denied | Denied | Denied |
| Create Milestones & Deadlines | Denied | **Allowed** | Denied | **Allowed** |
| Fill TE Review-2 Evaluation Form | Denied | **Allowed** | Denied | **Allowed** |
| View Industry Deliverables | Own Team | Department | **Assigned Only** | All |
| View Student GPAs & Academic Records | Own Record | Department | **STRICTLY BLOCKED (FR-092)** | All |
| Export NAAC/NBA Accreditation Excels | Denied | Department | Denied | **Full Institution** |
| Inspect Cryptographic Audit Log | Denied | Denied | Denied | **Full Inspection (FR-130)** |
| Upload Institutional Roster | Denied | **Allowed** | Denied | **Allowed** |

---

# 7. Vercel Production Authentication Diagnosis & Fix

### 7.1 The Production Incident
During production testing on Vercel (`https://v-bridge-connect.vercel.app/login`), users experienced a silent failure:
1. Entering valid credentials (`vedant.nikumbh@vit.edu.in` / `Test1234!`) and clicking **Sign In** resulted in no error message.
2. The user was redirected to `/dashboard`, which immediately bounced back to `/login?callbackUrl=%2Fdashboard`.
3. Vercel production logs revealed:
   ```json
   {"level":"info","requestMethod":"GET","requestPath":"/api/auth/error","responseStatusCode":302}
   ```

### 7.2 Forensic Technical Root Cause
1. **Mismatched `NEXTAUTH_URL`:** In the Vercel dashboard, `NEXTAUTH_URL` had been configured to `http://localhost:3000` during initial setup 15 days prior.
2. **Cookie Mismatch & CSRF Rejection:** In production over HTTPS, NextAuth v5 expects secure cookie prefixes (`__Host-authjs.csrf-token` and `__Secure-authjs.callback-url`). Because `NEXTAUTH_URL` was insecure HTTP on `localhost`, NextAuth rejected incoming HTTPS credentials requests with `MissingCSRF` and issued a 302 redirect to `http://localhost:3000/login?error=MissingCSRF`.
3. **Silent Client Bouncing:** The frontend `LoginScreen.tsx` checked only `signInResult?.error`. Because NextAuth v5 beta returns a redirect URL rather than populating the error field on relative redirects, `signInResult?.error` was `null`. The code proceeded to fetch `/api/auth/session`, received an unauthenticated empty session, defaulted `targetRoute` to `/dashboard`, and redirected. The Edge Middleware caught the unauthenticated `/dashboard` request and bounced the user back to `/login`.

### 7.3 Implemented Fix
1. **Vercel Cloud Configuration:**
   - Removed obsolete `NEXTAUTH_URL="http://localhost:3000"`.
   - Set `NEXTAUTH_URL="https://v-bridge-connect.vercel.app"`.
   - Added `AUTH_URL="https://v-bridge-connect.vercel.app"`.
   - Injected `AUTH_TRUST_HOST="true"` to force NextAuth to respect `x-forwarded-host` and `x-forwarded-proto` headers behind Vercel's reverse proxy.
   - Configured `AUTH_SECRET` explicitly across Production and Preview environments.
2. **Defensive Runtime Sanitization in Code:**
   In both `auth.config.ts` (Edge) and `auth.ts` (Node.js Serverless):
   ```typescript
   if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
     if (process.env.NEXTAUTH_URL?.includes('localhost') || process.env.NEXTAUTH_URL?.includes('127.0.0.1')) {
       process.env.NEXTAUTH_URL = 'https://v-bridge-connect.vercel.app';
     }
     if (process.env.AUTH_URL?.includes('localhost') || process.env.AUTH_URL?.includes('127.0.0.1')) {
       process.env.AUTH_URL = 'https://v-bridge-connect.vercel.app';
     }
     process.env.AUTH_TRUST_HOST = 'true';
   }
   ```
3. **Hardened Login Error Handling:**
   `LoginScreen.tsx` now explicitly parses `signInResult.url` for error strings and verifies that `/api/auth/session` successfully returns a valid user before navigating away from the login portal.

---

# 8. Academic Specialization: VIT TE Review-2 & Cohort Roster Ingestion

### 8.1 The 18-Question Review-2 Evaluation Rubric
In Indian engineering curricula (specifically TE Mini-Project Review-2 at VIT), project groups undergo a rigorous formal viva evaluation. The platform embeds this official panel form:

```
Total Marks (/50) = (Planning × 0.5) + (Problem Statement × 1.0) + (Lit Review × 1.5) + (Analysis & Execution × 2.0)
```

| # | Evaluation Criterion | Input Control | Weightage / Score Range |
| :---: | :--- | :--- | :--- |
| **1** | Project Group Selection | Dropdown | Pre-selected to active team |
| **2** | All Students Present? | Radio (Yes / No) | Flags absent students to CC advisor |
| **3** | Names of Absent Students | Text Input | Mandatory if Q2 is 'No' |
| **4** | Suggested Project Title | Text Input | Panel title refinement |
| **5** | Outcome of Idea Presentation | Radio (`Idea Approved` / `Modifications Required`) | Gates milestone progression |
| **6** | Suggested Modifications | Text Area | Mandatory if Q5 is 'Modifications Required' |
| **7** | Outcome Expected (#MANDATORY) | Text Area | Formal measurable engineering goal |
| **8** | **Project Planning** | 1 to 10 Scale | **Mapped to 5 Marks** ($\text{Score} \times 0.5$) |
| **9** | **Clarity of Problem Statement** | 1 to 10 Scale | **Mapped to 10 Marks** ($\text{Score} \times 1.0$) |
| **10**| **Literature Review** | 1 to 10 Scale | **Mapped to 15 Marks** ($\text{Score} \times 1.5$) |
| **11**| **Analysis & Real-Life Execution**| 1 to 10 Scale | **Mapped to 20 Marks** ($\text{Score} \times 2.0$) |
| **12**| Project Difficulty Level | 1 to 10 Scale | Qualitative complexity audit |
| **13**| Quality of Presentation & Slides | 1 to 10 Scale | Presentation skills evaluation |
| **14**| English Technical Communication | 1 to 10 Scale | Professional communication assessment |
| **15**| Project Completion Percentage | Dropdown (`0-25%`, `25-50%`, `50-75%`, `75-90%`, `90-100%`) | Progress estimation |
| **16**| Panel Member 1 Name | Text Input | Formal signature record |
| **17**| Panel Member 2 Name | Text Input | Formal signature record |
| **18**| Evaluation Attachment | File Dropzone | Optional rubric scan, PDF, PPT (up to 10MB) |

### 8.2 NAAC / NBA 1-Click Excel Audit Generation
To satisfy accreditation committees, `Review2EvaluationAuditTable.tsx` provides a 1-click export button. 
- Utilizes `SheetJS` (`xlsx`) loaded on-demand via dynamic `import('xlsx')` so initial client bundle size is unaffected.
- Generates a multi-sheet spreadsheet detailing individual student registration numbers, group scores, individual rubric distributions, completion percentages, and panel evaluator names ready for immediate submission to the Dean of Academics.

### 8.3 Cohort Roster Ingestion Engine
Departments upload official student-faculty allocation spreadsheets (`.xlsx` or `.csv`). The parser extracts:
`[Student Reg No] -> [Student Email] -> [Project Title] -> [Assigned Guide Code]`
Upon first institutional login, the `rosterService.autoConnectUserOnLogin()` automatically assigns the student to their designated project workspace and faculty guide without requiring manual administrator intervention.

---

# 9. DevOps, Cloud Storage & Performance Engineering

### 9.1 AWS S3 Presigned URL Pipeline
Deliverable uploads never stream directly through Next.js serverless functions, avoiding Vercel's 4.5MB request body payload limit.
1. Client requests an upload slot via `POST /api/v1/deliverables/presigned-url` with file metadata (`fileName`, `fileType`, `fileSize`).
2. Server validates user permissions, generates an S3 object key, and creates a presigned S3 PUT URL using `@aws-sdk/s3-request-presigner` expiring in 15 minutes.
3. Client streams file bytes directly to the `v-bridgecertificate` AWS S3 bucket in Mumbai (`ap-south-1`).
4. Client notifies API with S3 file URL and client-calculated SHA-256 checksum; API creates an immutable `SubmissionVersion` row.

### 9.2 Bundle Optimization & Performance Budgets
- **Lazy-Loaded Heavy Dependencies:** `const XLSX = await import('xlsx')` prevents 350KB of spreadsheet parsing code from impacting first-page load.
- **Local SVGs Over External Networks:** Replaced external network calls to `api.dicebear.com` with `<InitialsAvatar />` to eliminate network round-trip overhead and prevent broken avatars on firewalled campus Wi-Fi networks.
- **Tailwind CSS v4:** Zero-runtime utility classes compiled into static CSS layers for maximum rendering speed.

---

# 10. Comprehensive Technical Viva Voce Question Bank (60+ In-Depth Q&As)

---

## 10.1 System Architecture & Framework Design

#### Q1: What is the high-level architecture of VBridgeConnect, and why did you choose it over microservices?
**Answer:** VBridgeConnect is built as a **Modular Monolith** using Next.js 16 (App Router), TypeScript, and PostgreSQL (Supabase) via Prisma ORM 6. We deliberately chose a modular monolith over microservices because the application operates within a single institutional transaction boundary where strict data consistency (e.g. project capacity allocation and grading rubrics) is paramount. Microservices would introduce distributed transaction overhead, eventual consistency complexities, and deployment latency without offering tangible advantages for a university cohort. Internal module boundaries (Activities, Teams, Submissions, Certificates, Messaging) are strictly isolated through service interfaces, allowing any module to be extracted into a standalone microservice in the future if scale warrants it.

#### Q2: What is the "Single Source of Truth" principle (PR-01) in your project?
**Answer:** In many universities, project tracking is fragmented across personal spreadsheets, email threads, and paper forms. Principle PR-01 dictates that the relational database is the sole, authoritative system of record. Dashboards, progress percentages, milestone alerts, and NAAC/NBA compliance exports are never calculated from secondary trackers; they are dynamically derived via indexed SQL queries against live submission, meeting, and evaluation records.

#### Q3: What is the role of the in-process Domain Event Bus?
**Answer:** The domain event bus implements an in-memory publish-subscribe pattern that decouples synchronous HTTP request handling from secondary side-effects. When an action occurs (e.g., `milestone.accepted`), the domain module persists the state change and emits a domain event. The Notification Module and Audit Module subscribe to this event and execute asynchronously. This prevents circular dependencies between modules and keeps business logic out of opaque database triggers.

#### Q4: Why did you not use raw database triggers for business rules?
**Answer:** Raw SQL database triggers hide critical business logic inside the database engine, making it difficult to version-control, unit-test, and debug. Triggers also bypass application-level logging, making it hard to attribute audit records to specific authenticated web users. By keeping state machine cascades in application code (coordinated via the domain event bus), our business logic remains transparent, fully testable, and capable of generating rich audit entries.

---

## 10.2 Frontend, Next.js 16 & React 19 RSCs

#### Q5: What is the difference between React Server Components (RSC) and Client Components in your App Router architecture?
**Answer:** React Server Components (the default in Next.js App Router) execute exclusively on the server. They have direct access to backend resources (database, environment secrets) and render static HTML streamed to the browser with zero JavaScript bundle overhead. Client Components (declared with `'use client'`) are hydrated on the browser to handle user interactivity, event listeners (`onClick`, `onChange`), and client-side hooks (`useState`, `useEffect`, `useAppStore`). In VBridgeConnect, pages like `/dashboard/page.tsx` act as Server Component dispatchers, fetching initial session state securely before streaming interactive views like `StudentDashboard.tsx` or `MentorDashboard.tsx`.

#### Q6: How does the application prevent layout shift during data loading?
**Answer:** We implement streaming Suspense boundaries with tailored skeleton components (`<DashboardSkeleton />`, `<WorkspaceSkeleton />`) in `loading.tsx` files. Next.js instantly delivers the persistent layout shell with HTTP 200 chunked transfer encoding while heavy relational data (project rosters, milestone trees) streams in asynchronously, eliminating Layout Shift (CLS) and yielding instant perceived page load times.

#### Q7: Why do you use Zustand instead of Redux for client-side state?
**Answer:** Redux introduces significant boilerplate (actions, reducers, dispatchers, selectors) and larger bundle sizes. Zustand 5 is a lightweight (~1.2KB), unopinionated state manager with an intuitive hook-based API. We use Zustand in `appStore.ts` strictly for transient client state—such as the currently active workspace tab, mobile drawer toggle, and ephemeral UI toast notifications—leaving server data caching to Next.js server actions and React cache.

#### Q8: Why did you replace external avatar generators with a custom `InitialsAvatar`?
**Answer:** Previously, avatar rendering called `api.dicebear.com`. In academic environments, campus Wi-Fi firewalls often block third-party avatar CDNs, causing broken images and console errors. Furthermore, external network requests add latency and introduce potential privacy leaks. Our local `<InitialsAvatar />` renders deterministic SVGs with pastel color hashing directly in CSS/HTML from the user's name, guaranteeing 0ms latency, zero network overhead, and 100% offline reliability.

---

## 10.3 Backend REST APIs, Middleware & Event Bus

#### Q9: What API design pattern does VBridgeConnect follow?
**Answer:** We follow a resource-oriented RESTful architectural pattern versioned under `/api/v1/`. Responses strictly adhere to the **Envelope Pattern**:
```json
{
  "data": { ... },
  "meta": { "timestamp": "2026-10-24T05:00:00Z", "requestId": "uuid" },
  "error": null
}
```
State transitions are modelled as discrete verbs rather than open updates—for example, `POST /api/v1/milestones/:id/accept` rather than `PATCH /api/v1/milestones/:id { "status": "accepted" }`. This guarantees that all state transitions pass through the state machine validation layer.

#### Q10: How do Idempotency Keys work in your API?
**Answer:** Mobile network connectivity on campus can be unstable, causing users to tap buttons repeatedly. Critical endpoints (such as deliverable submission and grading) accept an `X-Idempotency-Key` header. When a request arrives, the server checks the database or memory cache for that key. If an identical key was processed within the last 15 minutes, the server returns the cached response instead of re-executing the transaction, preventing duplicate submissions or double-grading.

#### Q11: How does your Edge Middleware (`middleware.ts`) protect routes without slowing down requests?
**Answer:** Vercel Edge Middleware runs on Cloudflare/V8 isolates distributed geographically. It inspects the encrypted NextAuth JWT cookie directly using lightweight Web Crypto APIs. If a token is missing, expired, or lacks the required role (e.g. a student trying to access `/admin/reports`), the Edge isolate immediately returns an HTTP 302 redirect or 401 JSON response without waking up the Node.js serverless container or querying the database.

---

## 10.4 Database Engineering, PostgreSQL & Prisma ORM

#### Q12: Why do you have two database connection strings (`DATABASE_URL` and `DIRECT_URL`)?
**Answer:** This architecture separates pooled application queries from direct DDL operations:
- **`DATABASE_URL` (Port 6543):** Connects through Supabase’s Supavisor connection pooler in transaction mode. Because serverless lambda functions spin up and down dynamically, direct connections would quickly exhaust PostgreSQL's maximum connection limit. The pooler allows hundreds of lambda functions to share a small pool of active connections.
- **`DIRECT_URL` (Port 5432):** Connects directly to the PostgreSQL TCP socket. This is required by Prisma CLI for schema migrations (`prisma migrate`), which require session-level locking and prepared statements that transaction poolers do not support.

#### Q13: How does the system handle race conditions during project application selection?
**Answer:** When an activity has limited capacity (e.g., a faculty member can guide only 3 capstone teams), concurrent applications can cause race conditions. We wrap the selection logic in a Prisma interactive transaction (`prisma.$transaction`) with a PostgreSQL row-level lock (`SELECT ... FOR UPDATE`). This guarantees that concurrent approvals are serialized; once capacity reaches zero, subsequent applications are automatically routed to the `waitlisted` state.

#### Q14: What is the purpose of UUID v4 primary keys over auto-incrementing integers?
**Answer:** Auto-incrementing integer IDs (`1, 2, 3...`) are susceptible to **Insecure Direct Object Reference (IDOR)** attacks, where malicious users can enumerate records by incrementing IDs in the URL. UUID v4 generates cryptographically random 128-bit identifiers, preventing URL guessing and allowing distributed client-side ID generation without database round-trips.

#### Q15: Why are all timestamps stored as `TIMESTAMPTZ` in UTC?
**Answer:** Indian universities often have external review panel members or industry mentors operating across different time zones. Storing timestamps in `TIMESTAMP WITH TIME ZONE` (UTC) ensures deadline enforcement (e.g., 23:59:59 deadline) is mathematically absolute regardless of the client's local computer clock or daylight saving variations.

---

## 10.5 Authentication, NextAuth v5 & Security Auditing

#### Q16: How is user password authentication implemented?
**Answer:** Passwords are never stored in plaintext. During registration or roster seeding, passwords are encrypted using **Bcrypt** with a work factor (salt rounds) of 10. During authentication, `bcrypt.compare()` hashes the incoming password with the stored salt and verifies the result in constant time, preventing timing attacks.

#### Q17: What was the root cause of the recent Vercel production login failure, and how was it resolved?
**Answer:** The production deployment failed because `NEXTAUTH_URL` was configured in the Vercel environment as `http://localhost:3000`. Over HTTPS on `https://v-bridge-connect.vercel.app`, NextAuth v5 rejected the incoming credentials callback due to a mismatch between HTTPS host headers and the HTTP localhost configuration, resulting in a `MissingCSRF` 302 redirect. We resolved this by updating Vercel environment variables (`NEXTAUTH_URL="https://v-bridge-connect.vercel.app"`, `AUTH_TRUST_HOST="true"`, `AUTH_SECRET`), implementing runtime URL sanitization fallbacks in `auth.ts` and `auth.config.ts`, and hardening `LoginScreen.tsx` to prevent blind client redirects on unauthenticated sessions.

#### Q18: How does VBridgeConnect enforce role scoping for Industry Mentors (FR-092)?
**Answer:** External industry experts must never access confidential student academic records (CGPA, historical grades, private faculty notes). We enforce this at the database query level: all industry-scoped endpoints filter records through an explicit project assignment join. Even if an industry partner attempts to call `/api/v1/students/:id/grades`, the server-side RBAC guard inspects the JWT role and rejects the request with HTTP 403 Forbidden.

#### Q19: What is the Tamper-Evident Audit Log (FR-130)?
**Answer:** The `AuditEvent` table is an append-only ledger. When any sensitive action occurs (grade submission, certificate revocation, roster change), the system writes an immutable row containing the actor ID, entity type, prior state JSON, new state JSON, IP address, and UTC timestamp. The database user permissions prevent any `UPDATE` or `DELETE` queries on this table, ensuring full compliance for NAAC and NBA audits.

---

## 10.6 State Machines & Business Logic Validation

#### Q20: Explain the "Immutable Submissions" rule (FR-052). Why is it critical for universities?
**Answer:** In traditional portals, students frequently overwrite uploaded files when asked to make corrections, destroying the evidence of their initial submission. Under rule FR-052, a student resubmission never performs an SQL `UPDATE` on existing file records. Instead, it creates a new `SubmissionVersion` row linked to the parent submission. This preserves the complete chronological history of project iterations, allowing evaluators to verify whether feedback was addressed.

#### Q21: What is the Dual-Ledger Credential Model (FR-114 vs FR-115)?
**Answer:** Student resumes often mix authentic institutional awards with self-reported online course certificates. VBridgeConnect solves this by maintaining two separate ledgers:
1. **Platform-Issued Credentials (FR-114):** Automatically issued upon successful project completion. Signed with an immutable SHA-256 cryptographic hash, displayed with a gold verified seal, and publicly verifiable via QR code.
2. **Self-Reported Credentials (FR-115):** Certificates uploaded by students from external providers (e.g. Coursera, NPTEL). Displayed with a dashed border and an explicit institutional disclaimer banner stating they are unverified.

#### Q22: How does the Team Risk Escalation Engine calculate team health?
**Answer:** A background job evaluates three parameters:
1. Milestone deadline compliance (overdue by >48 hours triggers `at_risk`).
2. Consecutive deliverable rejections (2 rejections trigger `at_risk`).
3. Faculty mentor sync recency (no logged sync meeting in >21 days escalates from `on_track` to `watch`).
Teams flagged as `at_risk` or `blocked` appear immediately on the Coordinator Dashboard exception queue.

---

## 10.7 DevOps, Cloud Storage & Vercel Edge Hosting

#### Q23: Why do file uploads use AWS S3 Presigned URLs instead of passing through Next.js API routes?
**Answer:** Serverless functions on Vercel impose a strict 4.5MB request payload limit and have execution timeouts (15 seconds). Uploading large capstone deliverables (e.g., 50MB project ZIPs or high-resolution PPTs) through the serverless function would crash the lambda and consume expensive compute time. With presigned URLs, the server merely authenticates the request and signs an S3 upload policy; the browser streams the file binary directly to AWS S3, bypassing serverless limits entirely.

#### Q24: How does dynamic import improve performance in the Admin Reports module?
**Answer:** The `SheetJS` (`xlsx`) library used for generating accreditation spreadsheets is ~350KB minified. By importing it dynamically (`const XLSX = await import('xlsx')`) inside the export button click handler, the library is only downloaded when the administrator explicitly requests an Excel export, keeping initial page load bundles lean.

#### Q25: How does the Progressive Web App (PWA) / Trusted Web Activity (TWA) work?
**Answer:** VBridgeConnect includes a Service Worker (`sw.js`) and Web Manifest (`manifest.json`) that cache essential shell assets for offline resilience. On Android devices, the application is packaged as a Trusted Web Activity (TWA), validating domain ownership via Digital Asset Links (`.well-known/assetlinks.json`) to run as a full-screen native Android app without the browser address bar.

---

## 10.8 Institutional Governance, NAAC/NBA & Viva Edge Cases

#### Q26: How does VBridgeConnect support NAAC Criteria 1 and Criteria 2?
**Answer:** 
- **NAAC Criteria 1 (Curricular Aspects):** Requires proof of project-based learning, industry-sponsored capstones, and multidisciplinary initiatives. VBridgeConnect generates verified project registries with industry mentor timestamps.
- **NAAC Criteria 2 (Teaching-Learning & Evaluation):** Requires transparent, formative evaluation processes. Our system records every rubric score, absent student notification, and mentor meeting minutes, exported into formatted spreadsheets with one click.

#### Q27: How does the TE Review-2 scoring formula work?
**Answer:** The Review-2 evaluation computes marks out of 50 using a weighted formula across four 10-point parameters:
- **Project Planning (1-10):** Weighted at $0.5 \times \text{Score}$ (Max 5 Marks).
- **Clarity of Problem Statement (1-10):** Weighted at $1.0 \times \text{Score}$ (Max 10 Marks).
- **Literature Review (1-10):** Weighted at $1.5 \times \text{Score}$ (Max 15 Marks).
- **Analysis & Real-Life Usability (1-10):** Weighted at $2.0 \times \text{Score}$ (Max 20 Marks).
$$\text{Total} = (P \times 0.5) + (S \times 1.0) + (L \times 1.5) + (A \times 2.0) = 50\text{ Marks}$$

#### Q28: What happens if an absent student's name is submitted in Review-2?
**Answer:** When the evaluator selects "No" for "Were all students present?", an input field mandates recording the absent student's name. Upon submission, the platform marks the absent student's individual evaluation record as absent, computes a zero score for that review, and dispatches an automated CC notification to the Department Coordinator and Academic Guide.

#### Q29: What happens if the database connection pooler fails during a viva demonstration?
**Answer:** VBridgeConnect implements graceful degradation. In `prisma.ts`, `checkDatabasePoolHealth()` monitors latency and connection health. The client uses React Error Boundaries (`ErrorBoundary.tsx`) and root fallbacks (`error.tsx`) to catch network disconnects, display informative diagnostics, and provide a 1-click retry mechanism without crashing the entire browser session.

#### Q30: What is your future roadmap for the platform?
**Answer:** 
1. **Automated AI Literature Review Validation:** Integrating Gemini / Claude APIs to perform automated similarity checks and citation verification on uploaded synopses.
2. **Smart Contract Credential Anchoring:** Anchoring platform SHA-256 certificate hashes into a public/consortium blockchain (e.g. Polygon) for decentralized third-party employer verification.
3. **Automated Biometric Meeting Attendance:** Integrating WebRTC video sync meetings with facial verification against institutional ID photos.

---

*End of Master Document — VBridgeConnect Technical Specification & Viva Voce Preparation Manual.*
