// src/services/lecturePlayerService.ts
import axios from 'axios';
import { Step } from '../types/lecture';
import { AudioStreamPlayer } from '../types/player';

export class LecturePlayerService {
  private audioPlayer: AudioStreamPlayer;

  constructor() {
    this.audioPlayer = new AudioStreamPlayer();
  }

  async tellNarrative(narrative: string): Promise<void> {
    try {
      const response = await axios.post(
        import.meta.env.VITE_API_URL + 'api/tellNarrative',
        { narrative },
        { 
          responseType: 'blob',
          headers: {
            'Accept': 'audio/mpeg'
          }
        }
      );

      const audioUrl = URL.createObjectURL(response.data);
      await this.audioPlayer.playStream(audioUrl);

      // Clean up the URL after the audio is done
      this.audioPlayer.onEnded(() => {
        URL.revokeObjectURL(audioUrl);
      });

    } catch (error) {
      console.error('Error fetching narrative audio:', error);
      throw error;
    }
  }

  onNarrativeEnded(callback: () => void) {
    this.audioPlayer.onEnded(callback);
  }

  setMuted(muted: boolean) {
    this.audioPlayer.setMuted(muted);
  }

  stop() {
    this.audioPlayer.stop();
  }
}

export const lecturePlayerService = new LecturePlayerService();