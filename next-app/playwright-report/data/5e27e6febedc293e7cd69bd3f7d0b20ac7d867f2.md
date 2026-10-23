# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: vbridge-audit-bots.spec.ts >> VBridgeConnect Comprehensive Audit Bots Suite >> Bot 1: Role-Based Access Control (RBAC) & Data Scoping Verifier (FR-092) >> enforces route-level access control: redirects INDUSTRY_PARTNER away from restricted routes
- Location: tests\vbridge-audit-bots.spec.ts:75:9

# Error details

```
PrismaClientInitializationError: 
Invalid `prisma.user.findFirst()` invocation in
C:\Users\Vedant\Downloads\V - Bridge connect\next-app\tests\vbridge-audit-bots.spec.ts:20:37

  17 // Global seed check before running tests
  18 test.beforeAll(async () => {
  19   // Ensure baseline seed data exists
→ 20   const admin = await prisma.user.findFirst(
Can't reach database server at `aws-0-ap-south-1.pooler.supabase.com:6543`

Please make sure your database server is running at `aws-0-ap-south-1.pooler.supabase.com:6543`.
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | import prisma from '../src/lib/db/prisma';
  3   | 
  4   | /**
  5   |  * ============================================================================
  6   |  * VBridgeConnect Automated End-to-End Audit & RBAC Integrity Test Suite
  7   |  * ============================================================================
  8   |  * 4 Specialized Audit Bots:
  9   |  *  - Bot 1: Role-Based Access Control (RBAC) & Data Scoping Verifier (FR-092)
  10  |  *  - Bot 2: Database Immutability & Data-Flow Auditor (FR-052 & FR-114/115)
  11  |  *  - Bot 3: TE Review-2 Evaluation Schema & Math Verification Bot
  12  |  *  - Bot 4: Network Waterfall, Avatar & Bundle Hygiene Bot
  13  |  * ============================================================================
  14  |  */
  15  | 
  16  | test.describe('VBridgeConnect Comprehensive Audit Bots Suite', () => {
  17  |   // Global seed check before running tests
  18  |   test.beforeAll(async () => {
  19  |     // Ensure baseline seed data exists
> 20  |     const admin = await prisma.user.findFirst({ where: { email: 'admin@vbridge.com' } });
      |                                     ^ PrismaClientInitializationError: 
  21  |     if (!admin) {
  22  |       await prisma.user.create({
  23  |         data: {
  24  |           email: 'admin@vbridge.com',
  25  |           name: 'Super Admin',
  26  |           role: 'super_admin',
  27  |         },
  28  |       });
  29  |     }
  30  | 
  31  |     const coordinator = await prisma.user.findFirst({ where: { email: 'sheetal.patil@vit.edu.in' } });
  32  |     if (!coordinator) {
  33  |       await prisma.user.create({
  34  |         data: {
  35  |           email: 'sheetal.patil@vit.edu.in',
  36  |           name: 'Dr. Sheetal Patil',
  37  |           role: 'coordinator',
  38  |         },
  39  |       });
  40  |     }
  41  | 
  42  |     const student = await prisma.user.findFirst({ where: { email: 'vedant.nikumbh@vit.edu.in' } });
  43  |     if (!student) {
  44  |       await prisma.user.create({
  45  |         data: {
  46  |           email: 'vedant.nikumbh@vit.edu.in',
  47  |           name: 'Vedant Nikumbh',
  48  |           role: 'student',
  49  |           institutionalId: 'VIT-ECS-2026-001',
  50  |         },
  51  |       });
  52  |     }
  53  | 
  54  |     const partner = await prisma.user.findFirst({ where: { email: 'expert@industry.com' } });
  55  |     if (!partner) {
  56  |       await prisma.user.create({
  57  |         data: {
  58  |           email: 'expert@industry.com',
  59  |           name: 'Industry Partner',
  60  |           role: 'industry_partner',
  61  |         },
  62  |       });
  63  |     }
  64  |   });
  65  | 
  66  |   // --------------------------------------------------------------------------
  67  |   // BOT 1: Role-Based Access Control (RBAC) & Data Scoping Verifier (FR-092)
  68  |   // --------------------------------------------------------------------------
  69  |   test.describe('Bot 1: Role-Based Access Control (RBAC) & Data Scoping Verifier (FR-092)', () => {
  70  |     const industryUser = {
  71  |       email: 'expert@industry.com',
  72  |       role: 'INDUSTRY_PARTNER',
  73  |     };
  74  | 
  75  |     test('enforces route-level access control: redirects INDUSTRY_PARTNER away from restricted routes', async ({
  76  |       page,
  77  |       context,
  78  |     }) => {
  79  |       // 1. Authenticate as INDUSTRY_PARTNER via demo cookie
  80  |       await context.addCookies([
  81  |         {
  82  |           name: 'vbridge_demo_user',
  83  |           value: encodeURIComponent(JSON.stringify(industryUser)),
  84  |           domain: 'localhost',
  85  |           path: '/',
  86  |         },
  87  |       ]);
  88  | 
  89  |       // 2. Attempt to navigate to restricted routes
  90  |       const restrictedRoutes = [
  91  |         '/admin/reports',
  92  |         '/coordinator/roster-upload',
  93  |         '/mentor/dashboard',
  94  |       ];
  95  | 
  96  |       for (const route of restrictedRoutes) {
  97  |         await page.goto(route);
  98  |         await page.waitForLoadState('domcontentloaded');
  99  | 
  100 |         // Middleware must intercept and redirect away to /dashboard
  101 |         const currentUrl = page.url();
  102 |         expect(
  103 |           currentUrl,
  104 |           `INDUSTRY_PARTNER should be blocked from accessing ${route}`
  105 |         ).not.toContain(route);
  106 |         expect(
  107 |           currentUrl,
  108 |           `INDUSTRY_PARTNER should be redirected to /dashboard from ${route}`
  109 |         ).toContain('/dashboard');
  110 |       }
  111 |     });
  112 | 
  113 |     test('verifies data scoping: sensitive academic keys strictly absent in API and project payloads', async ({
  114 |       request,
  115 |     }) => {
  116 |       const authHeaders = {
  117 |         Cookie: `vbridge_demo_user=${encodeURIComponent(JSON.stringify(industryUser))}`,
  118 |       };
  119 | 
  120 |       // 1. Call GET /api/v1/evaluations/review-2
```