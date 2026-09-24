import { NextResponse } from 'next/server';
import { MOCK_ACTIVITIES } from '@/services/mockData';
import type { Activity } from '@/types';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const department = searchParams.get('department');
  const search = searchParams.get('search');

  let filtered = [...MOCK_ACTIVITIES];

  if (category && category !== 'ALL') {
    filtered = filtered.filter((a) => a.category === category);
  }

  if (department && department !== 'ALL') {
    filtered = filtered.filter((a) => a.department === department);
  }

  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (a) => a.title.toLowerCase().includes(q) || a.description.toLowerCase().includes(q)
    );
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

    const newActivity: Activity = {
      id: `act-${Date.now()}`,
      title: body.title || 'Untitled Opportunity',
      description: body.description || '',
      category: body.category || 'CAPSTONE',
      status: 'OPEN_FOR_APPLICATIONS',
      department: body.department || 'Computer Science & AI',
      capacity: body.capacity || 20,
      filledSeats: 0,
      teamSizeMin: body.minTeamSize || 3,
      teamSizeMax: body.maxTeamSize || 5,
      applicationDeadline: new Date(Date.now() + 30 * 86400000).toISOString(),
      prerequisites: body.prerequisites || ['Python', 'Git'],
      supervisorId: body.supervisorId || 'user-mentor-001',
      milestones: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      message: 'Opportunity registered with institutional audit hash',
      data: newActivity,
      auditHash: `sha256_${Date.now()}`,
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to create academic opportunity' },
      { status: 400 }
    );
  }
}
