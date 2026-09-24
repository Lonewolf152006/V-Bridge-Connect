# VBridgeConnect — Coding Rules (rules.md)

**Read this before generating, editing, or reviewing any code in this repo.**

This file encodes decisions already made in the PRD and `architecture.md` so an AI coding assistant doesn't have to re-derive them every session, and doesn't quietly drift from them either. It governs **how** code is written. The PRD governs **what** to build; `architecture.md` governs the **system design**. If this file ever conflicts with either of those, stop and flag the conflict — don't silently pick one.

---

## 0. Source-of-truth hierarchy

1. `PRD.md` — functional requirements (FR-XXX), user stories (US-XXX), acceptance criteria (QA-XX), state machines.
2. `architecture.md` — system design, execution model, data/API/security conventions.
3. `rules.md` (this file) — day-to-day coding conventions that implement (1) and (2).

Never invent a new entity, state, endpoint, or role that isn't in the PRD. If the task needs one, say so explicitly instead of adding it quietly.

---

## 1. Recommended stack

*Confirm with the team before treating this as locked — it's a starting recommendation consistent with `architecture.md`, not a decision made for you.*

| Layer | Choice |
|---|---|
| Backend | Node.js + TypeScript, Fastify |
| ORM / DB | Prisma → PostgreSQL |
| Auth | JWT (short-lived access + refresh) via `jose`; OIDC client for institutional SSO |
| Background jobs | `node-cron` for interval jobs (BullMQ/Redis if volume grows — see architecture.md §15) |
| Frontend | React + TypeScript, Tailwind |
| Testing | Vitest + Supertest (API), React Testing Library (UI) |
| Object storage | S3-compatible SDK, signed URLs only |

---

## 2. Non-negotiable architecture rules

These come straight from `architecture.md`. Do not "simplify" them away under deadline pressure — each one exists because it maps to a specific PRD requirement.

- **Never put business logic in a database trigger.** Cascading transitions (e.g. `milestone.overdue → team risk escalation`) live in application-layer event listeners, so they're visible, testable, and able to write their own audit entry. DB triggers are only for mechanical things like `updated_at` maintenance.
- **State transitions are actions, not raw field updates.** Implement `POST /milestones/{id}/accept`, never a generic `PATCH /milestones/{id} { status: "accepted" }`. Every transition must be validated against the state machine in PRD §9 — reject anything not an explicitly allowed `from → to` pair.
- **Every critical transition emits a domain event and writes an audit entry.** If you add a new transition and skip either of these, the feature is incomplete, not done.
- **Server-side authorization on every request.** Never branch UI or API behavior on a client-supplied role/scope claim without re-checking it server-side. A partner-scoped token must be structurally unable to reach a grade or private-note endpoint — not just blocked by a UI that hides the button.
- **Capacity-sensitive writes run inside a DB transaction with a row lock.** (e.g. application selection vs. activity capacity — this is what QA-10 in the PRD verifies.)
- **Files are never stored in the database.** Store a reference (URL, checksum, size, content type) in the DB; bytes go to object storage behind a short-lived signed URL.
- **Submitted versions are immutable.** A resubmission is always a new row/version, never an `UPDATE` of a prior submission.

---

## 3. Data rules

- Primary keys: `UUID` (v4) — no auto-increment integer IDs.
- All timestamps: `TIMESTAMPTZ`, stored and reasoned about in UTC. Format on the way out, never store localized.
- Status/role/type fields: `ENUM` or an equivalent check constraint — validated at the DB layer *and* the application layer. Enum values must match the PRD's state names exactly (`awaiting_approval`, not `pending_approval` or any other synonym).
- Every table: `created_at`, `updated_at` as standard columns.
- No soft-delete-by-convention without an explicit column (`removed_at`, `revoked_at`) — don't silently repurpose a status field to mean "deleted."

---

## 4. API design rules

- RESTful, resource-oriented, versioned: `/api/v1/...`.
- Transition endpoints: `POST /{resource}/{id}/{verb}`, verb in kebab-case matching the PRD's lifecycle table (e.g. `submit-for-approval`, `request-changes`, `resolve-risk`, `waive`).
- Transition endpoints accept an **idempotency key** — a retried request must not double-fire a transition or a duplicate notification.
- List/report endpoints return the applied filters and a `generated_at` timestamp in the payload — an export must be reproducible from its own metadata (this is what QA-12 verifies).
- Every endpoint that implements an FR must reference that FR's ID in a code comment directly above the route definition:

```ts
// FR-052: Submitted versions are immutable; resubmission always creates a new version.
router.post('/submissions/:id/resubmit', ...)
```

---

## 5. Domain event rules

- Event names: `{entity}.{pastTenseVerb}` — always past tense, because an event describes something that already happened. Examples already defined in `architecture.md`: `milestone.overdue`, `activity.completed`, `blocker.created`, `certificate.issued`.
- A module **publishes** events about its own entity only. It never reaches into another module's tables directly — if Team needs to react to a Milestone event, Team subscribes to `milestone.overdue`; it does not query the milestones table itself.
- Every event handler that causes a state change must itself follow all the rules in §2 (validated transition, own audit entry) — an event-triggered transition is not exempt from the state machine just because a human didn't click a button.

---

## 6. Security rules

- TLS everywhere. No endpoint served over plain HTTP, including internal calls.
- Every file upload (submission, certificate attachment) is malware-scanned before being accepted.
- File access is always via a short-lived, scoped signed URL — never a permanently public object URL.
- Rate-limit auth endpoints and bulk-action endpoints (e.g. mentor bulk reminders) specifically — not just a global rate limit.
- No secrets, tokens, or credentials in code, commit history, or logs. Config via environment variables / secret manager only.
- MFA-capable path required for admin-role accounts, even if not enforced on day one.
- Self-declared (student-uploaded) certificates must be visibly and structurally distinct from platform-issued ones at every layer — the API response shape, the DB `type` column, and the UI label must all agree. Never let a self-declared certificate flow into an official export (FR-115).

---

## 7. Testing rules

- Every FR-XXX that has observable behavior gets at least one automated test. Reference the ID in the test name or a comment:

```ts
// FR-015: capacity checks and waitlist promotion update atomically
test('concurrent selection never oversells the last slot', async () => { ... })
```

- Every QA-XX Given/When/Then in the PRD becomes a real test case with that structure — `Given` as setup, `When` as the action under test, `Then` as the assertion.
- Every state machine gets both a positive test (valid transition succeeds) and a negative test (an invalid transition is rejected, not silently coerced).
- Every permission boundary gets an explicit negative test — "role X cannot reach endpoint Y" is a test, not just an assumption from the route middleware existing.
- Concurrency-sensitive logic (capacity, selection) gets a test that actually races two requests, not just a single-threaded happy path.

---

## 8. Naming conventions

| Thing | Convention | Example |
|---|---|---|
| DB tables | snake_case, plural | `team_membership`, `audit_events` |
| DB columns | snake_case | `due_date`, `issued_at` |
| Domain events | `entity.pastTenseVerb` | `activity.completed` |
| REST resources | plural, kebab where multi-word | `/applications`, `/certificates/self-reported` |
| Transition verbs | kebab-case, imperative | `request-changes`, `close-applications` |
| TS/JS variables, functions | camelCase | `getMentorWorkload()` |
| TS types/interfaces | PascalCase | `MilestoneStatus` |
| Enum values (in code) | match PRD state names exactly | `'changes_requested'` |

---

## 9. Folder structure

Mirrors the domain modules in `architecture.md` §3 — one folder per entity family, each owning its own routes, service logic, repository, and events.

```
src/
  modules/
    activity/        { routes, service, repository, events, tests }
    application/
    team/
    milestone/
    submission/
    certificate/
    messaging/
    notification/
    audit/
  events/
    bus.ts
  jobs/
    milestone-overdue-sweep.ts
    team-risk-sweep.ts
    archive-sweep.ts
  auth/
    jwt.ts
    oidc.ts
    rbac.ts
  db/
    schema.prisma
    migrations/
  api/
    router.ts
    middleware/
      auth.ts
      scope.ts
      idempotency.ts
```

A module never imports another module's `repository.ts` directly — cross-module reaction happens only through `events/bus.ts`.

---

## 10. Commit & PR conventions

- Commit message references the requirement it implements: `feat(milestone): FR-045 auto-escalate overdue milestones`
- A PR that implements a functional requirement links the FR-XXX (and QA-XX if a test was added for it) in the description.
- A PR that changes a state machine, an endpoint shape, or a data model field must update the PRD/architecture.md in the same PR, not "as a follow-up" — the docs and the code must never be allowed to drift apart silently.

---

## 11. Explicit anti-patterns — never do these

- ❌ Business logic in a database trigger or stored procedure.
- ❌ A `PATCH` endpoint that lets a client set an entity's status field directly.
- ❌ Trusting a JWT claim for role/scope without re-validating server-side on every request.
- ❌ Overwriting a submitted version instead of creating a new one.
- ❌ A module reading another module's table directly instead of subscribing to its event.
- ❌ Mixing self-declared and platform-issued certificates in the same list/export without a `type` discriminator.
- ❌ Storing file bytes in the database.
- ❌ Adding a new activity/application/milestone status that isn't in PRD §9's state tables without flagging it for a PRD update first.
- ❌ A background job that mutates state without emitting the same domain event a REST-triggered transition would emit.

---

## 12. When something is ambiguous

Don't guess silently. In order of preference:
1. Check `PRD.md` and `architecture.md` for an explicit answer.
2. If the PRD's Open Questions (§21) already flags it as unresolved, implement the smallest reasonable default and leave a `// TODO(open-question): ...` comment referencing the question.
3. If it's genuinely new ground neither document covers, stop and ask rather than inventing a convention that the next feature will have to either match or contradict.
