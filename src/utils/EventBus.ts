import type { EventName, EventPayloadMap } from '@/types'

type Handler<T extends EventName> = (payload: EventPayloadMap[T]) => void

class EventBus {
  private handlers: Map<EventName, Set<Handler<EventName>>> = new Map()

  on<T extends EventName>(event: T, handler: Handler<T>): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set())
    }
    this.handlers.get(event)!.add(handler as Handler<EventName>)
    return () => this.off(event, handler)
  }

  off<T extends EventName>(event: T, handler: Handler<T>): void {
    this.handlers.get(event)?.delete(handler as Handler<EventName>)
  }

  emit<T extends EventName>(event: T, payload: EventPayloadMap[T]): void {
    const handlers = this.handlers.get(event)
    if (!handlers) return
    handlers.forEach((handler) => {
      try {
        handler(payload)
      } catch (err) {
        console.error(`[EventBus] Handler error for "${event}":`, err)
      }
    })
  }

  clear(): void {
    this.handlers.clear()
  }

  listenerCount(event: EventName): number {
    return this.handlers.get(event)?.size ?? 0
  }
}

export const eventBus = new EventBus()
export default eventBus
