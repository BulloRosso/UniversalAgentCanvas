import { EventBus, EVENTS, NarrativeRequestEvent, AudioPlaybackState } from '../events/CustomEvents';

class AudioPlaybackService {

  private static instance: AudioPlaybackService;
  private eventBus: EventBus;
  private activeNarrativeId: string | null = null;
  private audioQueue: NarrativeRequestEvent[] = [];
  private isProcessing = false;

  private constructor() {
    this.eventBus = EventBus.getInstance();
    this.setupEventListeners();
  }

  public static getInstance(): AudioPlaybackService {
    if (!AudioPlaybackService.instance) {
      AudioPlaybackService.instance = new AudioPlaybackService();
    }
    return AudioPlaybackService.instance;
  }

  private setupEventListeners(): void {
    this.eventBus.subscribe(EVENTS.NARRATIVE_REQUEST, async (event: CustomEvent) => {
      await this.handleNarrativeRequest(event.detail);
    });

    this.eventBus.subscribe(EVENTS.STEP_TRANSITION, () => {
      this.clearQueue();
    });
  }

  private async handleNarrativeRequest(request: NarrativeRequestEvent): Promise<void> {
    this.addToQueue(request);

    if (!this.isProcessing) {
      await this.processQueue();
    }
  }

  private addToQueue(request: NarrativeRequestEvent): void {
    const insertIndex = this.audioQueue.findIndex(item => item.priority > request.priority);
    if (insertIndex === -1) {
      this.audioQueue.push(request);
    } else {
      this.audioQueue.splice(insertIndex, 0, request);
    }
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.audioQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      while (this.audioQueue.length > 0) {
        const request = this.audioQueue[0];

        this.eventBus.publish(EVENTS.PLAYBACK_STATE_CHANGE, {
          state: AudioPlaybackState.LOADING,
          narrativeId: request.narrativeId,
          timestamp: Date.now()
        });

        try {
          const response = await fetch(`${import.meta.env.VITE_API_URL}api/narrative/tell/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'audio/mpeg',
            },
            body: JSON.stringify({ narrative: request.text })
          });

          if (!response.ok) throw new Error('Failed to fetch audio');

          const audioBlob = await response.blob();
          const audioUrl = URL.createObjectURL(audioBlob);

          this.eventBus.publish(EVENTS.NARRATIVE_READY, {
            narrativeId: request.narrativeId,
            audioUrl,
            duration: 0,
            timestamp: Date.now()
          });

        } catch (error) {
          this.eventBus.publish(EVENTS.PLAYBACK_STATE_CHANGE, {
            state: AudioPlaybackState.ERROR,
            narrativeId: request.narrativeId,
            timestamp: Date.now(),
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }

        this.audioQueue.shift();
      }
    } finally {
      this.isProcessing = false;
    }
  }

  private clearQueue(): void {
    this.audioQueue = [];
    this.isProcessing = false;
    if (this.activeNarrativeId) {
      this.eventBus.publish(EVENTS.PLAYBACK_STATE_CHANGE, {
        state: AudioPlaybackState.COMPLETED,
        narrativeId: this.activeNarrativeId,
        timestamp: Date.now()
      });
      this.activeNarrativeId = null;
    }
  }

  public requestNarrative(text: string, priority: number = 0): string {
    const narrativeId = `narrative-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    this.eventBus.publish(EVENTS.NARRATIVE_REQUEST, {
      narrativeId,
      text,
      priority,
      timestamp: Date.now()
    } as NarrativeRequestEvent);

    return narrativeId;
  }
}

export const audioPlaybackService = AudioPlaybackService.getInstance();