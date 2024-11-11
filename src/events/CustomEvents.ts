// src/events/CustomEvents.ts
export enum AudioPlaybackState {
  IDLE = 'idle',
  LOADING = 'loading',
  PLAYING = 'playing',
  PAUSED = 'paused',
  ERROR = 'error',
  COMPLETED = 'completed'
}

export enum StepPlaybackState {
  IDLE = 'idle',
  PREPARING = 'preparing',
  IN_PROGRESS = 'in_progress',
  TRANSITIONING = 'transitioning',
  COMPLETED = 'completed',
  ERROR = 'error'
}

export const EVENTS = {
  UI_COMMAND: 'ui-command',
  ANSWER_EVENT: 'answer-event',
  LECTURE_PART_FINISHED: 'lecture-part-finished',
  PLAYBACK_STATE_CHANGE: 'playback-state-change',
  STEP_STATE_CHANGE: 'step-state-change',
  NARRATIVE_REQUEST: 'narrative-request',
  NARRATIVE_READY: 'narrative-ready',
  STEP_TRANSITION: 'step-transition',
  AUDIO_PLAYBACK_ERROR: 'audio-playback-error'
} as const;


interface Question {
  id: string;
  question: string;
  type: 'single-choice' | 'multiple-choice' | 'drag-and-drop';
  choices: Choice[];
  answerId: number[];
  points: number;
  placeholders?: string[];
}

interface Choice {
  id: number;
  text: string;
}

export type UIEventType = {
  cmd: string;
  title: string;
  url: string;
  narrative?: string;
  tool_call_id: string;
  type?: 'video' | 'iframe' | 'slide' | 'image' | 'question';
  question?: Question; // Add this for ui_askQuestion command
  questionId?: string; // Add this as an alternative to question object
};

export type AnswerEventType = {
  questionId: string;
  points: number;
  responseText: string;
};

export type PlaybackStateChangeEvent = {
  state: AudioPlaybackState;
  narrativeId: string;
  timestamp: number;
  error?: string;
};

export type StepStateChangeEvent = {
  state: StepPlaybackState;
  stepNumber: number;
  lessonId: string;
  timestamp: number;
  error?: string;
};

export type NarrativeRequestEvent = {
  narrativeId: string;
  text: string;
  priority: number;
  timestamp: number;
};

export type NarrativeReadyEvent = {
  narrativeId: string;
  audioUrl: string;
  duration: number;
  timestamp: number;
};

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

