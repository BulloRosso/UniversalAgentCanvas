// src/types/player.ts
export class AudioStreamPlayer {
  private audio: HTMLAudioElement;
  private endedCallback: (() => void) | null = null;

  constructor() {
    this.audio = new Audio();
    this.audio.addEventListener('ended', () => {
      if (this.endedCallback) {
        this.endedCallback();
      }
    });
  }

  async playStream(url: string): Promise<void> {
    this.audio.src = url;
    try {
      await this.audio.play();
    } catch (error) {
      console.error('Error playing audio:', error);
      throw error;
    }
  }

  onEnded(callback: () => void) {
    this.endedCallback = callback;
  }

  setMuted(muted: boolean) {
    this.audio.muted = muted;
  }

  stop() {
    this.audio.pause();
    this.audio.currentTime = 0;
    this.audio.src = '';
  }
}

// Also include Step and Lesson interfaces if they're needed in lecturePlayerService
export interface Step {
  stepNumber: number;
  title: string;
  type: 'video' | 'iframe' | 'slide' | 'image';
  url: string;
  narrative: string;
  duration: number;
}

export interface Lesson {
  lessonId: string;
  title: string;
  presentation: Step[];
}