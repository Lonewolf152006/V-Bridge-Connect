// DELETE & PATCH /api/v1/milestones/[id]
// Allows faculty guides to delete or edit scheduled milestones.

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getOptionalSession } from '@/lib/auth/get-session';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionUser = await getOptionalSession();
    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (sessionUser.role !== 'coordinator' && sessionUser.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Only faculty guides can delete milestones' },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Check if milestone has existing submissions
    const submissionCount = await prisma.submission.count({
      where: { milestoneId: id },
    });
    if (submissionCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete milestone that already has student submissions' },
        { status: 400 }
      );
    }

    await prisma.milestone.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Milestone removed successfully' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete milestone' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionUser = await getOptionalSession();
    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (sessionUser.role !== 'coordinator' && sessionUser.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Only faculty guides can edit milestones' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    const data: any = {};
    if (body.title !== undefined) data.title = body.title.trim();
    if (body.description !== undefined) data.description = body.description.trim();
    if (body.stageNumber !== undefined) data.stageNumber = parseInt(body.stageNumber, 10);
    if (body.dueDate !== undefined) data.dueDate = new Date(body.dueDate);
    if (body.weightage !== undefined) data.weightage = parseInt(body.weightage, 10);
    if (body.deliverableType !== undefined) data.deliverableType = body.deliverableType;
    if (body.status !== undefined) data.status = body.status;

    const updated = await prisma.milestone.update({
      where: { id },
      data,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update milestone' },
      { status: 500 }
    );
  }
}
