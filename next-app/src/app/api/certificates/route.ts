import { NextResponse } from 'next/server';
import { MOCK_CERTIFICATES } from '@/services/mockData';
import type { Certificate } from '@/types';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');

  let filtered = [...MOCK_CERTIFICATES];

  if (type === 'OFFICIAL') {
    filtered = filtered.filter((c) => c.type === 'PLATFORM_ISSUED');
  } else if (type === 'SELF_REPORTED') {
    filtered = filtered.filter((c) => c.type === 'SELF_REPORTED');
  }

  return NextResponse.json({
    success: true,
    total: filtered.length,
    data: filtered,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const newCert: Certificate = {
      id: `cert-${Date.now()}`,
      studentId: body.studentId || body.userId || 'user-student-001',
      activityId: body.activityId || 'act-external',
      activityTitle: body.activityTitle || 'External Accreditation',
      type: 'SELF_REPORTED',
      issueDate: new Date().toISOString(),
      externalProvider: body.externalProvider || 'Coursera / AWS',
      disclaimer: 'UNVERIFIED STUDENT SELF-REPORT: Excluded from official university transcripts and ABET/NAAC audit submissions (FR-115).',
    };

    return NextResponse.json({
      success: true,
      message: 'External credential recorded under segregated self-reported ledger (FR-115)',
      data: newCert,
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to record external certificate' },
      { status: 400 }
    );
  }
}
