// VBridgeConnect — Web Push Notification Dispatcher (VAPID)
// Strictly enforces PRD anti-spam rule: Push only for deadlines, decisions, blockers, and direct messages.

import webpush from 'web-push';
import prisma from '@/lib/db/prisma';

// Configure VAPID details
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:support@vbridge.edu.in';

let isVapidConfigured = false;
if (vapidPublicKey && vapidPrivateKey) {
  try {
    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
    isVapidConfigured = true;
  } catch (err) {
    console.warn('[WebPush] Error configuring VAPID details:', err);
  }
}

export type PushNotificationPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  category?: 'deadline' | 'decision' | 'blocker' | 'direct_message' | 'general';
};

/**
 * Checks whether an event qualifies for Web Push under the PRD Anti-Spam Policy.
 * Rule: Push only for deadlines, decisions, blockers, and direct messages.
 */
export function isPushAllowedByAntiSpamRule(
  eventType: string,
  metadata?: Record<string, any>
): boolean {
  const normalized = eventType.toLowerCase();

  // 1. Deadlines
  if (
    normalized.includes('milestone.overdue') ||
    normalized.includes('deadline') ||
    normalized.includes('overdue')
  ) {
    return true;
  }

  // 2. Decisions (Application outcomes, grading pass/fail)
  if (
    normalized.includes('application.selected') ||
    normalized.includes('application.rejected') ||
    normalized.includes('submission.graded') ||
    normalized.includes('evaluation.completed')
  ) {
    return true;
  }

  // 3. Blockers (Critical alerts, blockers flagged by mentor or student)
  if (
    normalized.includes('blocker') ||
    metadata?.riskStatus === 'blocker' ||
    metadata?.severity === 'urgent'
  ) {
    return true;
  }

  // 4. Direct Messages
  if (normalized.includes('message.sent') || normalized.includes('chat.message')) {
    return true;
  }

  // Any other category (e.g. routine roster sync, general info) is strictly in-app only
  return false;
}

/**
 * Send a web push notification to all active devices registered by a user.
 * Prunes expired or invalid subscriptions (HTTP 404/410) automatically.
 */
export async function sendWebPushToUser(
  userId: string,
  payload: PushNotificationPayload
): Promise<{ sent: number; failed: number }> {
  if (!isVapidConfigured) {
    console.log('[WebPush] VAPID not configured. Skipping push notification.');
    return { sent: 0, failed: 0 };
  }

  try {
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId },
    });

    if (subscriptions.length === 0) {
      return { sent: 0, failed: 0 };
    }

    const jsonPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      url: payload.url || '/dashboard',
      tag: payload.tag || 'vbridge-alert',
    });

    let sent = 0;
    let failed = 0;

    for (const sub of subscriptions) {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      };

      try {
        await webpush.sendNotification(pushSubscription, jsonPayload);
        sent++;
      } catch (err: any) {
        failed++;
        // If subscription is expired or unsubscribed, delete from DB
        if (err.statusCode === 404 || err.statusCode === 410) {
          console.log(`[WebPush] Removing expired subscription ${sub.id}`);
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => null);
        } else {
          console.warn(`[WebPush] Push failed for subscription ${sub.id}:`, err.message || err);
        }
      }
    }

    return { sent, failed };
  } catch (error) {
    console.error('[WebPush] Error dispatching push to user:', error);
    return { sent: 0, failed: 0 };
  }
}
