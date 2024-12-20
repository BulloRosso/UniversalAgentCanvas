import React, { useState, useRef, useEffect } from 'react';
import { 
  IconButton, 
  CircularProgress, 
  Box,
  Typography
} from '@mui/material';
import { 
  PlayArrow, 
  Pause, 
  RestartAlt 
} from '@mui/icons-material';
import { EventBus, EVENTS, AudioPlaybackState } from '../../events/CustomEvents';
import { audioPlaybackService } from '../../services/audioPlaybackService';

export interface AudioPlayerProps {
  narrative: string | null;
  onComplete?: () => void;
  onPlaybackStart?: () => void;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ narrative, onComplete, onPlaybackStart }) => {
  const [playbackState, setPlaybackState] = useState<AudioPlaybackState>(AudioPlaybackState.IDLE);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef(new Audio());
  const currentNarrativeId = useRef<string | null>(null);
  const eventBus = EventBus.getInstance();

  useEffect(() => {
    if (!narrative || narrative === currentNarrativeId.current) {
      return;
    }

    // Reset error state when new narrative is received
    setError(null);
    setPlaybackState(AudioPlaybackState.LOADING);

    const narrativeId = audioPlaybackService.requestNarrative(narrative);
    currentNarrativeId.current = narrativeId;

    const unsubscribeReady = eventBus.subscribe(EVENTS.NARRATIVE_READY, (event: CustomEvent) => {
      if (event.detail.narrativeId === narrativeId) {
        setError(null); // Clear any previous errors
        setupAudioPlayback(event.detail.audioUrl);
      }
    });

    const unsubscribeState = eventBus.subscribe(EVENTS.PLAYBACK_STATE_CHANGE, (event: CustomEvent) => {
      if (event.detail.narrativeId === narrativeId) {
        setPlaybackState(event.detail.state);
        if (event.detail.error) {
          setError(event.detail.error);
        } else {
          setError(null); // Clear error when state changes successfully
        }
      }
    });

    return () => {
      unsubscribeReady();
      unsubscribeState();
      cleanup();
    };
  }, [narrative]);

  const cleanup = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      if (audioRef.current.src) {
        URL.revokeObjectURL(audioRef.current.src);
      }
      audioRef.current.src = '';
      setError(null); // Clear error state during cleanup
    }
  };

  const setupAudioPlayback = (audioUrl: string) => {
    cleanup();
    setError(null); // Clear any existing errors

    audioRef.current.src = audioUrl;

    audioRef.current.oncanplay = () => {
      setError(null); // Clear errors when audio can play
      audioRef.current.play()
        .catch(err => {
          console.error('Error starting playback:', err);
          setError('Error starting audio playback');
          setPlaybackState(AudioPlaybackState.ERROR);
        });
      setPlaybackState(AudioPlaybackState.PLAYING);
      if (onPlaybackStart) onPlaybackStart();
    };

    audioRef.current.onended = () => {
      setPlaybackState(AudioPlaybackState.COMPLETED);
      setError(null); // Clear any errors on successful completion
      if (onComplete) onComplete();
      URL.revokeObjectURL(audioUrl);
    };

    audioRef.current.onerror = (e) => {
      console.error('Audio playback error:', e);
      setPlaybackState(AudioPlaybackState.ERROR);
      setError('Error playing audio');
      URL.revokeObjectURL(audioUrl);
    };
  };

  const togglePlayPause = () => {
    if (playbackState === AudioPlaybackState.PLAYING) {
      audioRef.current.pause();
      setPlaybackState(AudioPlaybackState.PAUSED);
    } else if (playbackState === AudioPlaybackState.PAUSED) {
      audioRef.current.play()
        .catch(err => {
          console.error('Error resuming playback:', err);
          setError('Error resuming audio playback');
          setPlaybackState(AudioPlaybackState.ERROR);
        });
      setPlaybackState(AudioPlaybackState.PLAYING);
    }
  };

  const restart = () => {
    if (audioRef.current.src) {
      setError(null); // Clear errors when restarting
      audioRef.current.currentTime = 0;
      audioRef.current.play()
        .catch(err => {
          console.error('Error restarting playback:', err);
          setError('Error restarting audio playback');
          setPlaybackState(AudioPlaybackState.ERROR);
        });
      setPlaybackState(AudioPlaybackState.PLAYING);
    }
  };

  if (!narrative) {
    return null;
  }

  return (
    <Box sx={{ 
      width: '100%', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '60px'
    }}>
      <IconButton 
        onClick={togglePlayPause}
        disabled={playbackState === AudioPlaybackState.LOADING || playbackState === AudioPlaybackState.ERROR}
        color="primary"
        size="large"
      >
        {playbackState === AudioPlaybackState.LOADING ? (
          <CircularProgress size={24} />
        ) : playbackState === AudioPlaybackState.PLAYING ? (
          <Pause />
        ) : (
          <PlayArrow />
        )}
      </IconButton>

      <IconButton
        onClick={restart}
        disabled={!audioRef.current.src || playbackState === AudioPlaybackState.LOADING}
        color="secondary"
        size="large"
      >
        <RestartAlt />
      </IconButton>

      <Box sx={{ flexGrow: 1 }}>
        {playbackState === AudioPlaybackState.LOADING && (
          <Typography variant="body2" color="text.secondary">
            Loading audio...
          </Typography>
        )}
        {error && (
          <Typography variant="body2" color="error">
            {error}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default AudioPlayer;