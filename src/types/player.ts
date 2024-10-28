// src/types/player.ts
export interface PlaybackState {
  isPlaying: boolean;
  currentStepIndex: number;
  isMuted: boolean;
  currentLesson: Lesson | null;
}

export class AudioStreamPlayer {
  private audioContext: AudioContext;
  private audioSource: MediaElementAudioSourceNode | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private onEndedCallback: (() => void) | null = null;

  constructor() {
    this.audioContext = new AudioContext();
  }

  async playStream(streamUrl: string): Promise<void> {
    try {
      if (this.audioElement) {
        this.audioElement.pause();
      }

      this.audioElement = new Audio();
      this.audioElement.src = streamUrl;

      if (this.onEndedCallback) {
        this.audioElement.onended = this.onEndedCallback;
      }

      this.audioSource = this.audioContext.createMediaElementSource(this.audioElement);
      this.audioSource.connect(this.audioContext.destination);

      await this.audioElement.play();
    } catch (error) {
      console.error('Error playing audio stream:', error);
      throw error;
    }
  }

  setMuted(muted: boolean) {
    if (this.audioElement) {
      this.audioElement.muted = muted;
    }
  }

  stop() {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.src = '';
    }
  }

  onEnded(callback: () => void) {
    this.onEndedCallback = callback;
    if (this.audioElement) {
      this.audioElement.onended = callback;
    }
  }
}