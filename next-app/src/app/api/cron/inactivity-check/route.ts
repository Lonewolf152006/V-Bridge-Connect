// POST/GET /api/cron/inactivity-check — Evaluates team inactivity and milestone risk SLA
// TASK-BE-016 & FR-070 to FR-075: Flag team as at_risk when overdue > 48 hours
// Secured by CRON_SECRET bearer token. Fully idempotent background sweeper.

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import eventBus from '@/lib/events/bus';
import { validateCronSecret } from '@/lib/api/cron-auth';

export async function GET(request: NextRequest) {
  return handleInactivityCheck(request);
}

export async function POST(request: NextRequest) {
  return handleInactivityCheck(request);
}

async function handleInactivityCheck(request: NextRequest): Promise<NextResponse> {
  const authError = validateCronSecret(request);
  if (authError) return authError;

  const now = new Date();
  const startTime = performance.now();
  const threshold48HoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

  try {
    // 1. Find teams currently considered on_track or watch that have milestones overdue past 48 hours
    const candidateTeams = await prisma.team.findMany({
      where: {
        riskStatus: { in: ['on_track', 'watch'] },
        milestones: {
          some: {
            status: 'overdue',
            dueDate: { lt: threshold48HoursAgo },
          },
        },
      },
      select: {
        id: true,
        name: true,
        riskStatus: true,
        activityId: true,
      },
      take: 100,
    });

    const escalatedTeamIds: string[] = [];

    // 2. Idempotently escalate team risk status to 'at_risk'
    for (const team of candidateTeams) {
      await prisma.team.update({
        where: { id: team.id },
        data: { riskStatus: 'at_risk' },
      });

      escalatedTeamIds.push(team.id);

      // Emit domain event for audit ledger and notification alerting
      await eventBus.publish({
        type: 'team.risk_escalated',
        entityType: 'team',
        entityId: team.id,
        action: 'risk_escalated',
        actorId: null, // System automated sweep
        priorValue: { riskStatus: team.riskStatus },
        newValue: { riskStatus: 'at_risk' },
        reason: 'Automated background cron detected milestone overdue beyond 48-hour SLA grace period.',
        timestamp: new Date(),
      });
    }

    const durationMs = Number((performance.now() - startTime).toFixed(2));

    return NextResponse.json({
      success: true,
      job: 'inactivity-check',
      evaluatedCount: candidateTeams.length,
      escalatedCount: escalatedTeamIds.length,
      escalatedTeamIds,
      timestamp: now.toISOString(),
      durationMs,
    });
  } catch (error: any) {
    console.error('[Cron:InactivityCheck] Execution error:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to complete inactivity cron sweep.',
          details: [{ message: error.message || 'Unknown database error' }],
          requestId: crypto.randomUUID(),
        },
      },
      { status: 500 }
    );
  }
}
