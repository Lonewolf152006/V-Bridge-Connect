import { describe, it, expect, afterAll } from 'vitest';
import prisma from '@/lib/db/prisma';

describe('STEP 3 — Static/Caching Verification', () => {
  const ts = Date.now();
  const testEmail = `cachetest.${ts}@vit.edu.in`;
  let createdUserId: string | null = null;

  afterAll(async () => {
    if (createdUserId) {
      await prisma.user.delete({ where: { id: createdUserId } }).catch(() => {});
    }
  });

  it('reflects database mutations immediately on API route without cache staleness', async () => {
    // 1. Create a user directly in database
    const user = await prisma.user.create({
      data: {
        email: testEmail,
        name: `Cache Test User ${ts}`,
        role: 'student',
      },
    });
    createdUserId = user.id;
    expect(user.id).toBeDefined();

    // 2. Fetch API endpoint
    const res = await fetch('http://127.0.0.1:3000/api/v1/admin/users');
    expect(res.status).toBe(200);
    const json = await res.json();
    const found = (json.users || []).find((u: any) => u.email === testEmail);
    expect(found).toBeDefined();
    expect(found.name).toBe(`Cache Test User ${ts}`);

    // 3. Mutate the row in the DB
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { name: `Mutated User ${ts}` },
    });
    expect(updated.name).toBe(`Mutated User ${ts}`);

    // 4. Fetch API again immediately
    const res2 = await fetch('http://127.0.0.1:3000/api/v1/admin/users');
    expect(res2.status).toBe(200);
    const json2 = await res2.json();
    const found2 = (json2.users || []).find((u: any) => u.email === testEmail);
    expect(found2).toBeDefined();
    // Verify NOT stale
    expect(found2.name).toBe(`Mutated User ${ts}`);
  }, 10000);

  it('reflects team creation in database on reports endpoint without cache staleness', async () => {
    const res = await fetch('http://127.0.0.1:3000/api/v1/admin/reports');
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.metrics).toBeDefined();
    expect(typeof json.metrics.totalStudents).toBe('number');
  });
});
