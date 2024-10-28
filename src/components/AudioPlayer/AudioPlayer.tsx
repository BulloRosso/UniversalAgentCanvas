import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  IconButton, 
  CircularProgress, 
  Box,
  Paper,
  Typography
} from '@mui/material';
import { 
  PlayArrow, 
  Pause, 
  RestartAlt 
} from '@mui/icons-material';

interface AudioPlayerProps {
  narrative: string;
  onComplete?: () => void;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ narrative, onComplete }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasAudio, setHasAudio] = useState(false);  // New state to track if we have audio
  const audioRef = useRef(new Audio());
 
  const playNarrative = useCallback(async () => {
    try {
        setIsLoading(true);
        setError(null);

        console.log('[AudioPlayer] Fetching narrative audio');
        const response = await fetch('https://dee09cc9-22ed-465f-8839-fe8c5be2f694-00-hm6w1lz6dlro.riker.replit.dev/api/narrative/tell/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'audio/mpeg',
            },
            body: JSON.stringify({ narrative }),
        });

        if (!response.ok) {
            throw new Error('Failed to fetch audio');
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        audioRef.current.src = url;

        audioRef.current.onloadedmetadata = () => {
            console.log('[AudioPlayer] Audio loaded, starting playback');
            setIsLoading(false);
            setHasAudio(true);  // Set hasAudio when loaded
            audioRef.current.play();
            setIsPlaying(true);
        };

        audioRef.current.onended = () => {
            console.log('[AudioPlayer] Playback completed');
            setIsPlaying(false);
            setHasAudio(false);  // Reset hasAudio when done
            if (onComplete) {
                onComplete();
            }
        };

        audioRef.current.onerror = (e) => {
            console.error('[AudioPlayer] Playback error:', e);
            setError('Error playing audio');
            setIsPlaying(false);
            setHasAudio(false);  // Reset hasAudio on error
            setIsLoading(false);
        };
    } catch (error) {
        console.error('[AudioPlayer] Error in playNarrative:', error);
        setError('Failed to load audio');
        setIsLoading(false);
        setHasAudio(false);  // Reset hasAudio on error
    }
  }, [narrative, onComplete]);

  // Only start playing if we have a narrative
  useEffect(() => {
      if (narrative) {
          console.log('[AudioPlayer] Starting playback automatically');
          playNarrative();
      }
  }, [narrative, playNarrative]);
  
  const togglePlayPause = useCallback(() => {
    if (audioRef.current.src) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    } else {
      playNarrative();
    }
  }, [isPlaying, playNarrative]);

  const restart = useCallback(() => {
    if (audioRef.current.src) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
      setIsPlaying(true);
    }
  }, []);

  // Cleanup when unmounting
  useEffect(() => {
    return () => {
        console.log('[AudioPlayer] Cleaning up');
        if (audioRef.current.src) {
            URL.revokeObjectURL(audioRef.current.src);
            audioRef.current.src = '';
        }
    };
  }, []);

  // Only render if we're loading or have active audio
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