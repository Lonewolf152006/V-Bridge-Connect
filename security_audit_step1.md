# VBridgeConnect — Security Audit (Steps 1 – 4)

> **Scope:** Every Route Handler in the codebase.  No Server Actions exist (`"use server"` grep returned zero results).

---

## STEP 1 — Complete Endpoint Enumeration

### A. Versioned API (`/api/v1/…`) — Production Endpoints

| # | File | Method | Route | Module | R/W | Auth Call |
|---|------|--------|-------|--------|-----|-----------|
| 1 | [route.ts](file:///c:/Users/Vedant/Downloads/V%20-%20Bridge%20connect/next-app/src/app/api/v1/applications/route.ts) | POST | `/api/v1/applications` | Application | W | `requireAuth(…, 'student','coordinator','super_admin')` |
| 2 | same | GET | `/api/v1/applications` | Application | R | `requireAuth()` (any role) |
| 3 | [route.ts](file:///c:/Users/Vedant/Downloads/V%20-%20Bridge%20connect/next-app/src/app/api/v1/applications/%5Bid%5D/route.ts) | GET | `/api/v1/applications/:id` | Application | R | `requireAuth()` (any role) |
| 4 | [route.ts](file:///c:/Users/Vedant/Downloads/V%20-%20Bridge%20connect/next-app/src/app/api/v1/applications/%5Bid%5D/%5Bverb%5D/route.ts) | POST | `/api/v1/applications/:id/:verb` | Application | W | `requireAuth()` (any role, deferred to state machine) |
| 5 | [route.ts](file:///c:/Users/Vedant/Downloads/V%20-%20Bridge%20connect/next-app/src/app/api/v1/teams/route.ts) | POST | `/api/v1/teams` | Team | W | `requireAuth(…, 'student','coordinator','super_admin')` |
| 6 | same | GET | `/api/v1/teams` | Team | R | `requireAuth()` (any role) |
| 7 | [route.ts](file:///c:/Users/Vedant/Downloads/V%20-%20Bridge%20connect/next-app/src/app/api/v1/teams/%5Bid%5D/route.ts) | GET | `/api/v1/teams/:id` | Team | R | `requireAuth()` (any role) |
| 8 | [route.ts](file:///c:/Users/Vedant/Downloads/V%20-%20Bridge%20connect/next-app/src/app/api/v1/teams/%5Bid%5D/%5Bverb%5D/route.ts) | POST | `/api/v1/teams/:id/:verb` | Team | W | `requireAuth(…, 'coordinator','super_admin')` |
| 9 | [route.ts](file:///c:/Users/Vedant/Downloads/V%20-%20Bridge%20connect/next-app/src/app/api/v1/teams/%5Bid%5D/lead/route.ts) | POST | `/api/v1/teams/:id/lead` | Team | W | `requireAuth()` (any role, deferred to service) |
| 10 | [route.ts](file:///c:/Users/Vedant/Downloads/V%20-%20Bridge%20connect/next-app/src/app/api/v1/teams/%5Bid%5D/members/route.ts) | POST | `/api/v1/teams/:id/members` | Team | W | `requireAuth()` (any role, deferred to service) |
| 11 | same | DELETE | `/api/v1/teams/:id/members` | Team | W | `requireAuth()` (any role, deferred to service) |
| 12 | [route.ts](file:///c:/Users/Vedant/Downloads/V%20-%20Bridge%20connect/next-app/src/app/api/v1/submissions/route.ts) | GET | `/api/v1/submissions` | Submission | R | `requireAuth()` (any role) |
| 13 | same | POST | `/api/v1/submissions` | Submission | W | `requireAuth(…, 'student','coordinator','super_admin')` |
| 14 | [route.ts](file:///c:/Users/Vedant/Downloads/V%20-%20Bridge%20connect/next-app/src/app/api/v1/submissions/%5Bid%5D/route.ts) | GET | `/api/v1/submissions/:id` | Submission | R | `requireAuth()` (any role) |
| 15 | [route.ts](file:///c:/Users/Vedant/Downloads/V%20-%20Bridge%20connect/next-app/src/app/api/v1/submissions/%5Bid%5D/%5Bverb%5D/route.ts) | POST | `/api/v1/submissions/:id/:verb` | Submission | W | Mixed — `resubmit` checks `student,coordinator,super_admin`; **all other verbs call `requireAuth()` with NO role filter** |
| 16 | [route.ts](file:///c:/Users/Vedant/Downloads/V%20-%20Bridge%20connect/next-app/src/app/api/v1/certificates/route.ts) | POST | `/api/v1/certificates` | Certificate | W | `requireAuth()` (any role; role-check inside handler for `platform_issued` only) |
| 17 | same | GET | `/api/v1/certificates` | Certificate | R | `requireAuth()` (any role) |
| 18 | [route.ts](file:///c:/Users/Vedant/Downloads/V%20-%20Bridge%20connect/next-app/src/app/api/v1/certificates/%5Bid%5D/route.ts) | GET | `/api/v1/certificates/:id` | Certificate | R | `requireAuth()` (any role) |
| 19 | same | DELETE | `/api/v1/certificates/:id` | Certificate | W | `requireAuth()` (any role, deferred to service) |
| 20 | [route.ts](file:///c:/Users/Vedant/Downloads/V%20-%20Bridge%20connect/next-app/src/app/api/v1/certificates/%5Bid%5D/%5Bverb%5D/route.ts) | POST | `/api/v1/certificates/:id/:verb` | Certificate | W | `requireAuth(…, 'coordinator','super_admin')` |
| 21 | [route.ts](file:///c:/Users/Vedant/Downloads/V%20-%20Bridge%20connect/next-app/src/app/api/v1/certificates/verify/%5Bhash%5D/route.ts) | GET | `/api/v1/certificates/verify/:hash` | Certificate | R | **NONE** (public, by design per FR-111) |
| 22 | [route.ts](file:///c:/Users/Vedant/Downloads/V%20-%20Bridge%20connect/next-app/src/app/api/v1/conversations/route.ts) | POST | `/api/v1/conversations` | Messaging | W | `requireAuth()` (any role, deferred to relationship checks) |
| 23 | same | GET | `/api/v1/conversations` | Messaging | R | `requireAuth()` (any role) |
| 24 | [route.ts](file:///c:/Users/Vedant/Downloads/V%20-%20Bridge%20connect/next-app/src/app/api/v1/conversations/%5Bid%5D/route.ts) | GET | `/api/v1/conversations/:id` | Messaging | R | `requireAuth()` + inline participant check |
| 25 | [route.ts](file:///c:/Users/Vedant/Downloads/V%20-%20Bridge%20connect/next-app/src/app/api/v1/conversations/%5Bid%5D/messages/route.ts) | GET | `/api/v1/conversations/:id/messages` | Messaging | R | `requireAuth()` (deferred to service) |
| 26 | same | POST | `/api/v1/conversations/:id/messages` | Messaging | W | `requireAuth()` (deferred to service) |
| 27 | [route.ts](file:///c:/Users/Vedant/Downloads/V%20-%20Bridge%20connect/next-app/src/app/api/v1/meetings/calendar/route.ts) | GET | `/api/v1/meetings/calendar` | Meetings | R | `auth()` (NextAuth session) — **DIFFERENT auth system** |
| 28 | same | POST | `/api/v1/meetings/calendar` | Meetings | W | `auth()` (NextAuth session) — **DIFFERENT auth system** |
| 29 | [route.ts](file:///c:/Users/Vedant/Downloads/V%20-%20Bridge%20connect/next-app/src/app/api/v1/uploads/certificate/route.ts) | POST | `/api/v1/uploads/certificate` | Uploads | W | `requireAuth()` (any role) |

### B. Legacy / Unversioned Endpoints (`/api/…`)

| # | File | Method | Route | Module | R/W | Auth Call |
|---|------|--------|-------|--------|-----|-----------|
| 30 | [route.ts](file:///c:/Users/Vedant/Downloads/V%20-%20Bridge%20connect/next-app/src/app/api/activities/route.ts) | GET | `/api/activities` | Activities (legacy) | R | **NONE** |
| 31 | same | POST | `/api/activities` | Activities (legacy) | W | **NONE** |
| 32 | [route.ts](file:///c:/Users/Vedant/Downloads/V%20-%20Bridge%20connect/next-app/src/app/api/auth/route.ts) | POST | `/api/auth` | Auth (mock) | W | **NONE** — returns fake JWT for any role |
| 33 | same | GET | `/api/auth` | Auth (mock) | R | **NONE** |
| 34 | [route.ts](file:///c:/Users/Vedant/Downloads/V%20-%20Bridge%20connect/next-app/src/app/api/auth/%5B...nextauth%5D/route.ts) | GET/POST | `/api/auth/*` | NextAuth | R/W | NextAuth internal |
| 35 | [route.ts](file:///c:/Users/Vedant/Downloads/V%20-%20Bridge%20connect/next-app/src/app/api/submissions/route.ts) | GET | `/api/submissions` | Submissions (legacy) | R | **NONE** |
| 36 | same | POST | `/api/submissions` | Submissions (legacy) | W | **NONE** |
| 37 | same | PATCH | `/api/submissions` | Submissions (legacy) | W | **NONE** |
| 38 | [route.ts](file:///c:/Users/Vedant/Downloads/V%20-%20Bridge%20connect/next-app/src/app/api/certificates/route.ts) | GET | `/api/certificates` | Certificates (legacy) | R | **NONE** |
| 39 | same | POST | `/api/certificates` | Certificates (legacy) | W | **NONE** |

**Total: 39 endpoint-method pairs** (25 production v1 + 4 NextAuth + 10 legacy/mock)

---

## STEP 2 — Per-Endpoint Security Checklist

### 🔴 CRITICAL Findings

#### FINDING C-1: Legacy endpoints have ZERO authentication
**Endpoints:** #30-39 (all `/api/activities`, `/api/auth`, `/api/submissions`, `/api/certificates`)

All legacy endpoints under `/api/activities`, `/api/submissions`, `/api/certificates`, and `/api/auth` have **no authentication or authorization whatsoever**. Anyone with network access can:

- **Create activities** (POST `/api/activities`) → creates real Prisma DB rows with no auth
- **Read all activities** (GET `/api/activities`) → leaks entire activity catalog to anonymous users
- **Submit mock deliverables** (POST `/api/submissions`) → no auth
- **Grade/evaluate deliverables** (PATCH `/api/submissions`) → any anonymous caller can "grade"
- **Create certificates** (POST `/api/certificates`) → creates real `self_reported` certificate DB rows with no auth; even lets caller specify an arbitrary `studentId`
- **Read all certificates** (GET `/api/certificates`) → leaks all certificate data
- **Get a fake valid JWT for any role** (POST `/api/auth`) → request `{role: "super_admin"}` and get a simulated token

> [!CAUTION]
> **POST `/api/auth`** is a privilege-escalation vector. A caller requests `{role: "super_admin"}` and the server returns a "success" response with a simulated token. While the simulated token isn't signed by the real JWT secret, **the frontend treats this response as a valid login**. The client stores the returned user object and uses it for UI rendering — meaning the user can see any role's dashboard.

> [!CAUTION]
> **POST `/api/certificates`** creates **real database rows** (Prisma insert) with an arbitrary `studentId`. An attacker can mint certificates under any student's identity.

> [!CAUTION]
> **POST `/api/activities`** creates **real database rows** with `status: 'published'` — an anonymous user can pollute the activity catalog.

---

#### FINDING C-2: Submission transition verb endpoint has no role restriction on review actions
**Endpoint:** #15 — POST `/api/v1/submissions/:id/:verb`

```typescript
// For non-resubmit verbs (open-review, accept, request-changes, reject-invalid, evaluate):
const user = await requireAuth(request);  // ← no role filter!
```

The `resubmit` branch correctly restricts to `student,coordinator,super_admin`. But all other verbs (`open-review`, `accept`, `request-changes`, `reject-invalid`, `evaluate`) call `requireAuth(request)` with **no role restriction**. The state machine's `assertSubmissionTransitionRole` is the only defense — but its `allowedRoles` lists `coordinator` and `super_admin`. This means:
- A **student** token can call `accept`, `reject-invalid`, `evaluate`, etc. and the route handler won't block it.
- The state machine role check does catch it, so this is defense-in-depth failure, not a full bypass. But if the state machine ever has a bug or a new verb is added without role lists, it becomes a real vulnerability.

**Recommendation:** Add `'coordinator', 'super_admin'` to the `requireAuth` call for non-resubmit verbs.

---

#### FINDING C-3: Coordinator scope not enforced on GET `/api/v1/applications` for coordinator role
**Endpoint:** #2 — GET `/api/v1/applications`

```typescript
if (user.role === 'coordinator' || user.role === 'super_admin') {
  const allApps = await prisma.application.findMany({ ... }); // NO department filter!
}
```

A coordinator can see **every application across all departments**, not just their own department. This violates architecture.md §8: *"a coordinator is scoped to their department/programme."*

**Recommendation:** Add `where: { activity: { departmentId: user.departmentId } }` for coordinators.

---

#### FINDING C-4: `industry_partner` can list all applications when activityId is not provided
**Endpoint:** #2 — GET `/api/v1/applications`

When no `activityId` is given and the role is not `student`, `coordinator`, or `super_admin`, the endpoint returns `[]`. But `industry_partner` is not explicitly handled — the fallthrough returns empty data. This is safe behavior (no leak), but the partner **can** supply an `activityId` and reach `listByActivity`, which calls `assertActivityScope`. That scope check for `industry_partner` only verifies conversation participant access — meaning if a partner has been added to any conversation for that activity, they see **all** applications. That's a data-exposure risk per architecture.md §8: *"an industry partner is scoped only to projects explicitly shared with them — grade and private-note endpoints are unreachable."*

---

### 🟠 HIGH Findings

#### FINDING H-1: Submissions GET endpoint has no scope check
**Endpoint:** #12 — GET `/api/v1/submissions?milestoneId=xxx`

```typescript
const user = await requireAuth(request);
const milestoneId = searchParams.get('milestoneId');
if (milestoneId) {
  const submissions = await submissionService.findByMilestoneId(milestoneId);
}
```

Any authenticated user (including `industry_partner`) can read **all submissions** for any milestone by guessing/knowing a milestone UUID. There is no `assertTeamScope` or `assertActivityScope` call. `findByMilestoneId` just does `prisma.submission.findMany({ where: { milestoneId } })` with no scoping.

Similarly, `GET /api/v1/submissions?teamId=xxx` — any authenticated user can read all submissions for any team.

---

#### FINDING H-2: Submissions detail GET has no scope check
**Endpoint:** #14 — GET `/api/v1/submissions/:id`

```typescript
const submission = await submissionService.findById(id);
if (!submission) return errorResponse('Submission not found', 404);
return successResponse(submission);
```

Any authenticated user can read any submission by ID. No ownership or scope check.

---

#### FINDING H-3: `industry_partner` can access reviewer private notes on applications
**Endpoint:** #3 — GET `/api/v1/applications/:id`

The `getById` service method strips `reviewerNote` only for `student` role:

```typescript
if (user.role === 'student') {
  const { reviewerNote, ...sanitized } = app;
  return sanitized;
}
return app; // ← industry_partner gets the full object including reviewerNote
```

Per architecture.md §8: *"grade and private-note endpoints are unreachable from a partner-scoped token."* `industry_partner` should not see `reviewerNote` or `decisionNote`.

---

#### FINDING H-4: Certificate GET has no ownership check
**Endpoint:** #18 — GET `/api/v1/certificates/:id`

Any authenticated user can read any certificate by ID. The service `getById` checks nothing about ownership. A student can read another student's certificate details.

---

#### FINDING H-5: Upload certificate presigned URL has no role restriction
**Endpoint:** #29 — POST `/api/v1/uploads/certificate`

Any authenticated user (any role) can generate a presigned S3 upload URL. An `industry_partner` should not be able to upload certificates.

---

#### FINDING H-6: Meetings calendar uses different auth system
**Endpoints:** #27-28 — GET/POST `/api/v1/meetings/calendar`

These use NextAuth `auth()` session instead of the JWT `requireAuth()` used everywhere else. This creates:
1. **No role check at all** — any signed-in user (any role) can create calendar meetings
2. **Auth bypass risk** — if a user has a valid NextAuth session but no JWT, or vice versa, behavior is inconsistent

---

### 🟡 MEDIUM Findings

#### FINDING M-1: Application transition endpoint accepts ANY verb
**Endpoint:** #4 — POST `/api/v1/applications/:id/:verb`

The route passes any `verb` string directly to `applicationService.transition()`. The state machine will reject invalid verbs, but the route handler doesn't validate the verb against a known allowlist first. An attacker can spray arbitrary verbs to probe the system.

#### FINDING M-2: No idempotency key support
**All state-changing endpoints**

Architecture.md §4: *"Transition endpoints accept an idempotency key so a retried request can't double-fire a transition or notification."* None of the endpoints implement this.

#### FINDING M-3: No rate limiting
**All endpoints**

Architecture.md §10: *"Rate limiting applied at the API gateway layer, particularly on auth and bulk-reminder endpoints."* No rate limiting exists.

#### FINDING M-4: `POST /api/v1/teams/:id/lead` has no `assertTeamScope`
**Endpoint:** #9

The route calls `requireAuth()` with no role restriction. The service checks if the user is the current lead, coordinator, or admin — but never calls `assertTeamScope()`. A student who is not a member of the team would get a service-level error (not a team lead), but a coordinator from a different department could change lead on any team.

#### FINDING M-5: `POST /api/v1/teams/:id/members` has no route-level role check
**Endpoint:** #10

The service's `addMember` checks lead/coordinator/admin, but the route handler accepts any authenticated role. An `industry_partner` would hit the service-level check, but it's defense-in-depth missing.

---

## STEP 3 — Data Exposure Check

| Field | Should Not Be Visible To | Current Behavior | Finding |
|-------|--------------------------|------------------|---------|
| `reviewerNote` | student, industry_partner | Stripped for student ✅; **leaked to industry_partner** ❌ | H-3 |
| `decisionNote` | industry_partner | **Leaked** ❌ | H-3 |
| `reviewerPrivateNote` (submissions) | student, industry_partner | No stripping at all — full object returned | H-1, H-2 |
| All certificate data | other students | Any authenticated user can read by ID | H-4 |
| All submission data | non-team members | Any authenticated user can read by milestone/team/ID | H-1, H-2 |

---

## STEP 4 — Findings Summary Table

| ID | Severity | Category | Endpoint(s) | Description | Impact |
|----|----------|----------|-------------|-------------|--------|
| **C-1** | 🔴 Critical | AuthN | #30-39 (all legacy `/api/…`) | Zero authentication — anonymous read/write to DB | Privilege escalation, data pollution, certificate forgery |
| **C-2** | 🔴 Critical | AuthZ | #15 (`/v1/submissions/:id/:verb`) | Review actions have no route-level role filter | Defense-in-depth failure; students one state-machine bug away from grading |
| **C-3** | 🔴 Critical | Scope | #2 (`/v1/applications` GET) | Coordinator sees all departments' applications | Cross-department data leak |
| **C-4** | 🔴 Critical | Scope | #2 (`/v1/applications` GET) | Industry partner can list applications via activityId if they have any conversation access | Over-privileged partner data access |
| **H-1** | 🟠 High | Scope | #12 (`/v1/submissions` GET) | No scope check — any user reads any submission | Cross-team data exposure |
| **H-2** | 🟠 High | Scope | #14 (`/v1/submissions/:id` GET) | No scope check on detail view | Same |
| **H-3** | 🟠 High | Data Exposure | #3 (`/v1/applications/:id` GET) | `reviewerNote` leaked to industry_partner | Private reviewer notes exposed to external party |
| **H-4** | 🟠 High | Scope | #18 (`/v1/certificates/:id` GET) | No ownership check | Any user reads any certificate |
| **H-5** | 🟠 High | AuthZ | #29 (`/v1/uploads/certificate` POST) | Any role can generate upload URLs | Unauthorized file uploads |
| **H-6** | 🟠 High | AuthN | #27-28 (`/v1/meetings/calendar`) | Uses different auth system, no role check | Inconsistent security boundary |
| **M-1** | 🟡 Medium | Validation | #4 (`/v1/applications/:id/:verb`) | No verb allowlist | Information leakage via probing |
| **M-2** | 🟡 Medium | Idempotency | All state-changing | No idempotency key | Double-fire risk |
| **M-3** | 🟡 Medium | Rate Limiting | All | No rate limiting | DoS/brute-force risk |
| **M-4** | 🟡 Medium | Scope | #9 (`/v1/teams/:id/lead`) | Cross-department coordinator can change lead | Scope violation |
| **M-5** | 🟡 Medium | AuthZ | #10 (`/v1/teams/:id/members`) | No route-level role restriction | Defense-in-depth gap |

---

## Recommended Fix Priority

> [!IMPORTANT]
> **No code has been changed.** This is a verification-only report per your instructions. The fixes below are recommendations.

### Phase 1 — Immediate (Critical)
1. **Delete or disable all legacy endpoints** (`/api/activities`, `/api/auth`, `/api/submissions`, `/api/certificates`) — they have zero auth and create real DB rows
2. **Add role filters** to submission transition route for non-resubmit verbs
3. **Scope coordinator application queries** to their department
4. **Block industry_partner** from application listing unless explicitly shared

### Phase 2 — High Priority  
5. Add `assertTeamScope`/`assertActivityScope` to submission read endpoints
6. Strip `reviewerNote`/`decisionNote` from industry_partner responses
7. Add ownership check to certificate detail endpoint
8. Restrict upload URL generation to `student` role
9. Unify meetings calendar to use JWT auth, add role checks

### Phase 3 — Hardening
10. Add verb allowlists at route level
11. Implement idempotency keys
12. Add rate limiting
13. Add cross-department scope checks for team lead/member operations

---

> [!NOTE]
> Ready for your review. Tell me to proceed and I'll implement all fixes in priority order.
