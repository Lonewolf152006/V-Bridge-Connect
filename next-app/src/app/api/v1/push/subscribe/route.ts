import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getOptionalSession } from '@/lib/auth/get-session';

// GET /api/v1/push/subscribe — Returns public VAPID key
export async function GET() {
  return NextResponse.json({
    success: true,
    publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
  });
}

// POST /api/v1/push/subscribe — Registers a new web push subscription for user
export async function POST(req: NextRequest) {
  try {
    const session = await getOptionalSession();
    if (!session?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required to subscribe to push notifications' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { subscription, userAgent } = body;

    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return NextResponse.json(
        { success: false, error: 'Invalid push subscription payload' },
        { status: 400 }
      );
    }

    const record = await prisma.pushSubscription.upsert({
      where: { endpoint: subscription.endpoint },
      update: {
        userId: session.id,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        userAgent: userAgent || null,
        updatedAt: new Date(),
      },
      create: {
        userId: session.id,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        userAgent: userAgent || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Push subscription registered successfully',
      subscriptionId: record.id,
    });
  } catch (error: any) {
    console.error('[Push Subscribe API Error]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to register push subscription' },
      { status: 500 }
    );
  }
}

// DELETE /api/v1/push/subscribe — Unsubscribes an endpoint
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { endpoint } = body;

    if (!endpoint) {
      return NextResponse.json({ success: false, error: 'Endpoint is required' }, { status: 400 });
    }

    await prisma.pushSubscription.deleteMany({
      where: { endpoint },
    });

    return NextResponse.json({
      success: true,
      message: 'Push subscription removed successfully',
    });
  } catch (error: any) {
    console.error('[Push Unsubscribe API Error]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to unsubscribe' },
      { status: 500 }
    );
  }
}
