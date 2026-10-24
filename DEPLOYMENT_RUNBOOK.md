# VBridgeConnect — Production Deployment & Operational Runbook

**System Version:** 1.0.0  
**Target Environment:** Vercel (Edge & Node.js Serverless) + Supabase PostgreSQL (ap-south-1, Mumbai)  
**Security Level:** Enterprise Academic & Industry Governance  

---

## 1. System Architecture & Cloud Topology

```mermaid
graph TD
    Client[Browser / Mobile PWA / Android TWA]
    Cloudflare[Vercel Global Edge CDN]
    EdgeRoutes[Next.js Middleware & Edge Handlers]
    NodeLambda[Next.js Serverless Lambdas - bom1 Mumbai]
    Supavisor[Supabase Transaction Pooler - Port 6543]
    Postgres[(PostgreSQL Database - ap-south-1 Mumbai)]
    Realtime[Supabase Realtime WebSocket Engine]
    S3[AWS S3 Bucket - Deliverables & Assets]

    Client -->|HTTPS / TLS 1.3| Cloudflare
    Cloudflare -->|Route & Cache| EdgeRoutes
    EdgeRoutes -->|Server Actions / API| NodeLambda
    NodeLambda -->|Prisma via Supavisor| Supavisor
    Supavisor -->|Managed Pool - Max 200| Postgres
    Client -.->|WSS Max 2 Ch/Client| Realtime
    Realtime -.->|WAL Replication| Postgres
    NodeLambda -->|Presigned URL 15m| S3
    Client -->|Direct Upload <=10MB| S3
```

### Co-Location Performance Policy
To eliminate inter-region network latency penalties:
- **Compute Region:** Vercel serverless functions MUST be configured in **Mumbai (`bom1`)**.
- **Database Region:** Supabase PostgreSQL instance MUST reside in **AWS Asia Pacific Mumbai (`ap-south-1`)**.
- Round-trip ping between Vercel `bom1` and Supabase Mumbai is **< 8 ms**.

---

## 2. Environment Variables & Secret Configuration

Configure all variables in the Vercel Project Settings under **Settings $\to$ Environment Variables** for `Production` and `Preview`.

| Environment Variable | Description | Security Level | Example / Target Value |
|---|---|---|---|
| `DATABASE_URL` | Supabase Supavisor pooler connection string (Port 6543). MUST include `?pgbouncer=true&connection_limit=10&pool_timeout=15` | Critical | `postgresql://postgres.[REF]:[PASS]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=10&pool_timeout=15` |
| `DIRECT_URL` | Direct Supabase connection (Port 5432). Used exclusively for migrations. | Critical | `postgresql://postgres.[REF]:[PASS]@aws-0-ap-south-1.pooler.supabase.com:5432/postgres` |
| `NEXTAUTH_SECRET` | 32-byte cryptographically secure random string | Critical | Generated via `openssl rand -base64 32` |
| `JWT_SECRET` | Secret for custom JWT signing and bearer validation | Critical | Generated via `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Fully qualified production domain | Public | `https://vbridgeconnect.vercel.app` |
| `AUTH_TRUST_HOST` | Set to `"true"` to enable dynamic host resolution across Vercel deployments | Configuration | `true` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project API gateway | Public | `https://[PROJECT_REF].supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key for client-side Realtime connection | Public / Safe | `eyJhbGci...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase elevated admin key (server-side only) | Critical | `eyJhbGci...` |
| `CRON_SECRET` | Secret bearer token required by Vercel Cron endpoints | Critical | Generated via `openssl rand -hex 24` |
| `AWS_REGION` | AWS S3 storage region | Configuration | `ap-south-1` |
| `AWS_S3_BUCKET` | Dedicated deliverable S3 storage bucket | Configuration | `vbridgeconnect-production-deliverables` |
| `AWS_ACCESS_KEY_ID` | IAM credential with scoped PutObject / GetObject rights | Critical | `AKIA...` |
| `AWS_SECRET_ACCESS_KEY` | IAM credential secret | Critical | `wJalrXUt...` |
| `TWA_PACKAGE_NAME` | Android Trusted Web Activity bundle ID | Public | `in.edu.vit.vbridgeconnect` |
| `TWA_SHA256_FINGERPRINT` | Android app signing SHA256 fingerprint for Asset Links | Public | `14:6D:E9:17:...` |

---

## 3. Database Migration & Pool Management

### Prisma Connection Architecture
1. **Runtime Queries (`DATABASE_URL`):** Connects through the Supavisor connection pooler on port **6543** in transaction pooling mode. This prevents connection exhaustion when 100+ serverless functions scale up concurrently.
2. **Schema Migrations (`DIRECT_URL`):** Connects directly to PostgreSQL on port **5432**. Transaction poolers cannot handle PostgreSQL transaction locks or session variables used by migration scripts.

### Running Migrations in Production
Execute migrations from a secure CI runner or trusted workstation:
```bash
# Verify schema against direct connection
npx prisma migrate status

# Apply pending migrations safely
npx prisma migrate deploy
```

### Emergency Database Pool Flush
If connection exhaustion occurs due to dangling connections:
1. Open the **Supabase Dashboard** $\to$ **Database** $\to$ **Connection Pooling**.
2. Click **Restart Pooler** to gracefully drop idle client connections while maintaining database state.

---

## 4. Scheduled Cron Jobs & Maintenance Sweeps

Vercel Cron is declared in `vercel.json` and runs automatic maintenance:

```json
{
  "crons": [
    {
      "path": "/api/cron/overdue-milestones",
      "schedule": "0 0 * * *"
    },
    {
      "path": "/api/cron/inactivity-check",
      "schedule": "0 1 * * *"
    }
  ]
}
```

### Security Verification
All cron routes validate the incoming request header:
```
Authorization: Bearer <CRON_SECRET>
```
If invoked manually for verification or testing:
```bash
curl -X POST https://vbridgeconnect.vercel.app/api/cron/overdue-milestones \
  -H "Authorization: Bearer replace-with-a-secure-cron-secret-token"
```

### Cron Sweeps Functionality:
1. **`/api/cron/overdue-milestones`:** Scans all milestones where `status = 'pending'` and `dueDate < NOW()`. Transitions them to `'overdue'` and dispatches audit events. (100% Idempotent).
2. **`/api/cron/inactivity-check`:** Identifies teams with no milestone submissions for > 14 days, flags them as `'at_risk'`, and notifies coordinators.
3. **`/api/cron/cleanup`:** Sweeps expired rate limit tokens and idempotency records older than 24 hours to prevent table bloat.

---

## 5. Health Monitoring & SLA Verification

### System Healthcheck Endpoint
- **URL:** `GET /api/health`
- **Authentication:** Public / Unauthenticated (Whitelisted in Edge Middleware)
- **Monitoring Setup:** Configure in Datadog, Better Uptime, or AWS Route53 Health Checks every 60 seconds.

**Healthy Response (HTTP 200):**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "uptime": 14205,
  "timestamp": "2026-10-22T18:45:00.000Z",
  "database": {
    "status": "connected",
    "latencyMs": 4
  },
  "environment": "production"
}
```

---

## 6. Pre-Launch CI/CD Verification Gates

Before promoting any release to production, the continuous integration runner must execute all six verification stages:

```bash
# 1. Zero-Mock Token Gating
npm run check:no-mocks

# 2. Phase B: REST Contracts & Error Envelope
npm run test:contracts

# 3. Phase C: Speed & Performance Benchmarks
npm run test:perf

# 4. Phase D: Scale Safety & Pool Audit
npm run test:scale

# 5. Phase E: Security & RBAC Compliance
npm run test:security

# 6. Phase F: End-to-End User Journeys
npm run test:journeys

# 7. Production Build Validation
npm run build
```

---

## 7. Zero-Downtime Rollout & Instant Rollback Playbook

### Standard Deployment
1. Merge reviewed pull request to `main`.
2. Vercel automatically creates a preview deployment and runs build checks.
3. Vercel routes traffic smoothly to the new deployment with 0 dropped HTTP connections.

### Instant Rollback Playbook
If critical defects or anomalies are detected post-deployment:
1. **Vercel Dashboard:** Go to **Deployments** $\to$ locate the previous known-healthy deployment $\to$ click the three dots $\to$ select **Instant Rollback**.
2. **Vercel CLI alternative:**
   ```bash
   vercel rollback <deployment-url-or-id>
   ```
3. Database changes that are backwards-compatible (expand-and-contract model) will continue serving the previous build without requiring immediate schema reversion.
