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

interface AudioPlayerProps {
  narrative: string | null;
  onComplete?: () => void;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ narrative, onComplete }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasAudio, setHasAudio] = useState(false);
  const audioRef = useRef(new Audio());
  const currentNarrativeRef = useRef<string | null>(null);
  
  useEffect(() => {
    if (!narrative || narrative === currentNarrativeRef.current) return;
    // Update current narrative
      currentNarrativeRef.current = narrative;

    setIsLoading(true);
    console.log('[AudioPlayer] Starting audio load for:', narrative);

    fetch('https://dee09cc9-22ed-465f-8839-fe8c5be2f694-00-hm6w1lz6dlro.riker.replit.dev/api/narrative/tell/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg',
      },
      body: JSON.stringify({ narrative })
    })
    .then(response => {
      if (!response.ok) throw new Error('Failed to fetch audio');
      return response.blob();
    })
    .then(blob => {
      // Clean up previous audio URL if it exists
      if (audioRef.current.src) {
        URL.revokeObjectURL(audioRef.current.src);
      }

      const url = URL.createObjectURL(blob);
      audioRef.current.src = url;

      audioRef.current.onloadedmetadata = () => {
        console.log('[AudioPlayer] Audio loaded, starting playback');
        setIsLoading(false);
        setHasAudio(true);
        audioRef.current.play();
        setIsPlaying(true);
      };

      audioRef.current.onended = () => {
        console.log('[AudioPlayer] Playback completed');
        setIsPlaying(false);
        setHasAudio(false);
        if (onComplete) {
          onComplete();
        }
      };

      audioRef.current.onerror = () => {
        console.error('[AudioPlayer] Playback error');
        setError('Error playing audio');
        setIsPlaying(false);
        setHasAudio(false);
        setIsLoading(false);
      };
    })
    .catch(error => {
      console.error('[AudioPlayer] Error:', error);
      setError('Failed to load audio');
      setIsLoading(false);
    });

    return () => {
      console.log('[AudioPlayer] Cleaning up');
      if (audioRef.current) {
        audioRef.current.pause();
        if (audioRef.current.src) {
          URL.revokeObjectURL(audioRef.current.src);
        }
        audioRef.current.src = '';
        audioRef.current.onloadedmetadata = null;
        audioRef.current.onended = null;
        audioRef.current.onerror = null;
      }
      setIsPlaying(false);
      setHasAudio(false);
      setIsLoading(false);
      setError(null);
    };
  }, [narrative, onComplete]);

  const togglePlayPause = () => {
    if (audioRef.current.src) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const restart = () => {
    if (audioRef.current.src) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  if (!narrative || (!isLoading && !hasAudio)) {
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
        disabled={isLoading}
        color="primary"
        size="large"
      >
        {isLoading ? (
          <CircularProgress size={24} />
        ) : isPlaying ? (
          <Pause />
        ) : (
          <PlayArrow />
        )}
      </IconButton>
      <IconButton
        onClick={restart}
        disabled={isLoading || !audioRef.current.src}
        color="secondary"
        size="large"
      >
        <RestartAlt />
      </IconButton>
      <Box sx={{ flexGrow: 1 }}>
        {isLoading && (
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