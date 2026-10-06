// VBridgeConnect — In-Process Domain Event Bus
// architecture.md §3: In-process pub/sub. Named events + wildcard channel.
// Event names follow rules.md §5: {entity}.{pastTenseVerb} — always past tense.
//
// The Audit module subscribes to the wildcard channel ('*') and writes an
// immutable record for every event. No other module needs to know Audit exists.

export interface DomainEvent {
  type: string;           // e.g. 'activity.published', 'milestone.overdue'
  entityType: string;     // e.g. 'activity', 'milestone'
  entityId: string;
  action: string;         // e.g. 'published', 'overdue'
  actorId: string | null; // null = system-originated (e.g. overdue sweep)
  priorValue?: unknown;
  newValue?: unknown;
  reason?: string;
  metadata?: Record<string, unknown>;
  timestamp: Date;
}

type EventHandler = (event: DomainEvent) => void | Promise<void>;

class EventBus {
  private handlers: Map<string, EventHandler[]> = new Map();
  private wildcardHandlers: EventHandler[] = [];

  /**
   * Subscribe to a specific event type (e.g. 'activity.published')
   * or to ALL events by passing '*'.
   */
  subscribe(eventType: string, handler: EventHandler): () => void {
    if (eventType === '*') {
      this.wildcardHandlers.push(handler);
      return () => {
        this.wildcardHandlers = this.wildcardHandlers.filter((h) => h !== handler);
      };
    }

    const existing = this.handlers.get(eventType) || [];
    existing.push(handler);
    this.handlers.set(eventType, existing);

    // Return unsubscribe function
    return () => {
      const handlers = this.handlers.get(eventType) || [];
      this.handlers.set(
        eventType,
        handlers.filter((h) => h !== handler)
      );
    };
  }

  /**
   * Publish a domain event. Notifies specific subscribers first,
   * then wildcard subscribers (Audit, etc.).
   * All handlers run synchronously in the same process — this is
   * intentional per architecture.md §5 (in-process event bus).
   */
  async publish(event: DomainEvent): Promise<void> {
    const specificHandlers = this.handlers.get(event.type) || [];
    const allHandlers = [...specificHandlers, ...this.wildcardHandlers];

    for (const handler of allHandlers) {
      try {
        await handler(event);
      } catch (error) {
        // Log but don't let one handler's failure prevent others from running
        console.error(
          `[EventBus] Handler error for event "${event.type}":`,
          error
        );
      }
    }
  }

  /** Clear all handlers — used in tests */
  clearAll(): void {
    this.handlers.clear();
    this.wildcardHandlers = [];
  }
}

// Singleton — one event bus for the entire process
export const eventBus = new EventBus();
export default eventBus;
