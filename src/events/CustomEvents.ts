// src/events/CustomEvents.ts
export type UIEventType = {
  cmd: string;
  title: string;
  url: string;
  narrative?: string;
  tool_call_id: string;
  type?: 'video' | 'iframe' | 'slide' | 'image';
};

export const EVENTS = {
  UI_COMMAND: 'ui-command'
} as const;

export class EventBus {
  private static instance: EventBus;
  private eventTarget: EventTarget;

  private constructor() {
    this.eventTarget = new EventTarget();
  }

  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  public publish(eventName: string, data: any): void {
    console.debug("Published: " + eventName, data)
    const event = new CustomEvent(eventName, { detail: data });
    this.eventTarget.dispatchEvent(event);
  }

  public subscribe(eventName: string, callback: (event: CustomEvent) => void): () => void {
    const handler = (e: Event) => callback(e as CustomEvent);
    this.eventTarget.addEventListener(eventName, handler);
    return () => this.eventTarget.removeEventListener(eventName, handler);
  }
}

