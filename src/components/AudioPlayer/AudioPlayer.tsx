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

export interface AudioPlayerProps {
  narrative: string | null;
  onComplete?: () => void;
  onPlaybackStart?: () => void;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ narrative, onComplete }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasAudio, setHasAudio] = useState(false);
  const audioRef = useRef(new Audio());
  const currentNarrativeRef = useRef<string | null>(null);
  const mediaSourceRef = useRef<MediaSource | null>(null);
  const sourceBufferRef = useRef<SourceBuffer | null>(null);

  
  // Safely cleanup MediaSource and SourceBuffer
  const cleanupMediaSource = () => {
    try {
      if (sourceBufferRef.current && mediaSourceRef.current) {
        // Only remove source buffer if MediaSource is still open
        if (mediaSourceRef.current.readyState === 'open') {
          // Only remove if the source buffer is actually attached to this MediaSource
          const sourceBuffers = mediaSourceRef.current.sourceBuffers;
          if (sourceBuffers.length > 0 && sourceBuffers[0] === sourceBufferRef.current) {
            mediaSourceRef.current.removeSourceBuffer(sourceBufferRef.current);
          }
        }
      }
    } catch (error) {
      console.warn('[AudioPlayer] MediaSource cleanup:', error);
    } finally {
      sourceBufferRef.current = null;
      mediaSourceRef.current = null;
    }
  };
  
  useEffect(() => {
    if (!narrative || narrative === currentNarrativeRef.current) return;

    // Cleanup previous MediaSource before creating new one
    cleanupMediaSource();
    
    currentNarrativeRef.current = narrative;
    setIsLoading(true);
    console.log('[AudioPlayer] Starting audio load for:', narrative);

    // Create new MediaSource
    const mediaSource = new MediaSource();
    mediaSourceRef.current = mediaSource;
    audioRef.current.src = URL.createObjectURL(mediaSource);

    mediaSource.addEventListener('sourceopen', async () => {
      try {
        // Create source buffer when MediaSource is ready
        sourceBufferRef.current = mediaSource.addSourceBuffer('audio/mpeg');

        const response = await fetch(import.meta.env.VITE_API_URL + 'api/narrative/tell/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'audio/mpeg',
          },
          body: JSON.stringify({ narrative })
        });

        if (!response.ok) throw new Error('Failed to fetch audio');
        if (!response.body) throw new Error('No response body');

        const reader = response.body.getReader();
        const appendChunks = async () => {
          while (true) {
            const { done, value } = await reader.read();

            if (done) {
              // End of stream
              if (mediaSourceRef.current?.readyState === 'open') {
                mediaSourceRef.current.endOfStream();
              }
              break;
            }

            // Wait if the buffer is updating
            if (sourceBufferRef.current?.updating) {
              await new Promise(resolve => {
                sourceBufferRef.current!.addEventListener('updateend', resolve, { once: true });
              });
            }

            // Append the chunk if the source buffer still exists
            if (sourceBufferRef.current) {
              try {
                sourceBufferRef.current.appendBuffer(value);
              } catch (error) {
                console.error('[AudioPlayer] Error appending buffer:', error);
                throw error;
              }
            }
          }
        };

        appendChunks().catch(error => {
          console.error('[AudioPlayer] Streaming error:', error);
          setError('Error streaming audio');
          setIsLoading(false);
        });

        // Set up audio element event handlers
        audioRef.current.oncanplay = () => {
          console.log('[AudioPlayer] Audio can play, starting playback');
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

      } catch (error) {
        console.error('[AudioPlayer] Setup error:', error);
        setError('Failed to setup audio streaming');
        setIsLoading(false);
      }
    });

    return () => {
      if (narrative) return;
      
      console.log('[AudioPlayer] Cleaning up');
      if (audioRef.current) {
        audioRef.current.pause();
        if (audioRef.current.src) {
          URL.revokeObjectURL(audioRef.current.src);
        }
        audioRef.current.src = '';
        audioRef.current.oncanplay = null;
        audioRef.current.onended = null;
        audioRef.current.onerror = null;
      }

      cleanupMediaSource();

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