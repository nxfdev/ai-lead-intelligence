/**
 * Event Bus — WebSocket broadcast system
 * 
 * Manages WebSocket connections and broadcasts events to connected clients.
 * In Next.js, this module acts as a simple in-memory event emitter.
 */

import type { WSEvent } from "@/lib/types";

type EventHandler = (event: WSEvent) => void;

// In-memory subscriber list
const subscribers: Set<EventHandler> = new Set();

/**
 * Subscribe to events
 */
export function subscribe(handler: EventHandler): () => void {
  subscribers.add(handler);
  return () => {
    subscribers.delete(handler);
  };
}

/**
 * Broadcast an event to all subscribers
 */
export function broadcastEvent(event: WSEvent): void {
  for (const handler of subscribers) {
    try {
      handler(event);
    } catch (error) {
      console.error("Event handler error:", error);
    }
  }
}

/**
 * Get the current subscriber count
 */
export function getSubscriberCount(): number {
  return subscribers.size;
}
