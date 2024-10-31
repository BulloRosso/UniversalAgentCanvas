// src/services/stepPlayerService.ts
import axios from 'axios';
import { Step } from '../types/lecture';

const API_URL = 'https://dee09cc9-22ed-465f-8839-fe8c5be2f694-00-hm6w1lz6dlro.riker.replit.dev/api';

export class StepPlayerService {
  private audioElement: HTMLAudioElement | null = null;
  private onComplete: (() => void) | null = null;

  async tellNarrative(narrative: string): Promise<HTMLAudioElement> {
    try {
      const response = await axios.post(
        `${API_URL}/tellNarrative`,
        { narrative },
        { responseType: 'blob' }
      );

      const audioBlob = new Blob([response.data], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);

      if (this.audioElement) {
        this.audioElement.src = audioUrl;
      } else {
        this.audioElement = new Audio(audioUrl);
      }

      return this.audioElement;
    } catch (error) {
      console.error('Error fetching narrative audio:', error);
      throw error;
    }
  }

  setOnComplete(callback: () => void) {
    this.onComplete = callback;
    if (this.audioElement) {
      this.audioElement.onended = callback;
    }
  }

  mute(muted: boolean) {
    if (this.audioElement) {
      this.audioElement.muted = muted;
    }
  }

  stop() {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
    }
  }
}

export const stepPlayerService = new StepPlayerService();