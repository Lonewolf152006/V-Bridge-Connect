// VBridgeConnect — Event Subscriber Registration
// Called once at app initialization to wire up all domain event subscribers.

import { auditService } from '@/lib/modules/audit/audit.service';
import { notificationService } from '@/lib/modules/notification/notification.service';
import { certificateService } from '@/lib/modules/certificate/certificate.service';

let registered = false;

export function registerAllSubscribers(): void {
  if (registered) return; // Prevent double-registration on hot-reload
  
  // Audit module — wildcard subscriber (listens to ALL events)
  auditService.registerSubscriber();

  // Notification module — specific event subscribers
  notificationService.registerSubscribers();

  // Certificate module — auto-issues platform certificates on activity completion (FR-110)
  certificateService.registerSubscribers();

  registered = true;
  console.log('[Events] All domain event subscribers registered');
}
