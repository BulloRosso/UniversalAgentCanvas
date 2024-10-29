// src/components/ControlPane/ControlPane.tsx
import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  Button,
  Stack,
  Divider,
  FormHelperText,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  IconButton,
  SelectChangeEvent,
  LinearProgress
} from '@mui/material';
import { 
  Language, 
  VideoLibrary,
  PlayArrow,
  VolumeOff,
  VolumeUp,
  Settings
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { isYouTubeUrl } from '../../utils/youtube';
import { useLecture } from '../../context/LectureContext';
import { Lesson, Step } from '../../types/lecture';
import { ChatMessage } from '../../types/message';
import { lecturePlayerService } from '../../services/lecturePlayerService';
import AudioPlayer from '../AudioPlayer/AudioPlayer';
import QRCode from '..//QRCode/QRCode';

interface ControlPaneProps {
  onDisplayContent: (url: string, type: 'video' | 'iframe' | 'slide', onComplete?: () => void) => void;
  onChatMessage: (message: ChatMessage) => void;
  selectedMessage: ChatMessage | null;
  onResetSelectedMessage: () => void;
}

interface PlaybackState {
  isPlaying: boolean;
  currentStepIndex: number;
  isMuted: boolean;
  currentLesson: Lesson | null;
}

export const ControlPane: React.FC<ControlPaneProps> = ({ 
  onDisplayContent,
  onChatMessage,
  selectedMessage,
  onResetSelectedMessage
}) => {
  const [url, setUrl] = useState('');
  const [selectedLesson, setSelectedLesson] = useState<string>('');
  const { t, i18n } = useTranslation();
  const { lecture, loading, error } = useLecture();
  const [currentStepTime, setCurrentStepTime] = useState(0);
  const [totalLessonTime, setTotalLessonTime] = useState(0);
  const [stepDuration, setStepDuration] = useState(0);
  const [showDebugControls, setShowDebugControls] = useState(false);
  const [currentNarrative, setCurrentNarrative] = useState<string | null>(null);
  const [audioCompleteCallback, setAudioCompleteCallback] = useState<(() => void) | null>(null);

  const [playbackState, setPlaybackState] = useState<PlaybackState>({
    isPlaying: false,
    currentStepIndex: -1,
    isMuted: false,
    currentLesson: null
  });

  useEffect(() => {
    let timerId: number;

    if (playbackState.isPlaying) {
      timerId = window.setInterval(() => {
        setCurrentStepTime(prev => {
          if (prev >= stepDuration) {
            clearInterval(timerId);
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    }

    return () => {
      if (timerId) {
        clearInterval(timerId);
      }
    };
  }, [playbackState.isPlaying, stepDuration]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleDisplay = (type: 'video' | 'iframe') => {
    if (url.trim()) {
      onDisplayContent(url.trim(), type, undefined);
      setUrl('');
    }
  };

  const handleLanguageChange = (event: SelectChangeEvent<string>) => {
    i18n.changeLanguage(event.target.value);
  };

  const handleLessonChange = (event: SelectChangeEvent<string>) => {
    setSelectedLesson(event.target.value);
  };

  const playStep = async (step: Step) => {
      console.log('[ControlPane] Playing step:', {
          stepNumber: step.stepNumber,
          title: step.title,
          type: step.type
      });

      try {

          // Add a guard to prevent multiple executions
          if (playbackState.isPlaying && playbackState.currentStepIndex === step.stepNumber - 1) {
            console.log('[ControlPane] Step already playing, skipping');
            return;
          }
        
        
           // 1. Display content in canvas first
           onDisplayContent(
             step.url, 
             step.type,
             step.type === 'video' ? () => handleStepComplete() : undefined
           );

           // 2. Add narrative to chat
           onChatMessage(step.narrative, false);

           // 3. Update timers
           setCurrentStepTime(0);
           setStepDuration(step.duration);

           // 4. For non-video content, play audio narration
            if (step.type !== 'video') {
                try {
                    setCurrentNarrative(step.narrative);

                    // Wait for audio completion
                    await new Promise<void>((resolve) => {
                        const onAudioComplete = () => {
                            console.log('[ControlPane] Audio narration complete');
                            setCurrentNarrative(null);
                            setTimeout(() => {
                                resolve();
                                handleStepComplete();
                            }, 1000);  // Reduced delay for better UX
                        };
                        setAudioCompleteCallback(() => onAudioComplete);
                    });
                } catch (error) {
                    console.error('[ControlPane] Error playing narrative:', error);
                    setCurrentNarrative(null);
                    handleStepComplete();  // Still move to next step even if there's an error
                }
            }
        } catch (error) {
            console.error('[ControlPane] Error playing step:', error);
            handleStepComplete();  // Ensure we still move forward even if there's an error
        }
  };

  const handlePlayLesson = async () => {
    if (!selectedLesson || !lecture) return;
    if (selectedLesson && lecture) {

      // Add a guard to prevent multiple starts
      if (playbackState.isPlaying) {
        console.log('[ControlPane] Lesson already playing, skipping start');
        return;
      }
      
      const lesson = lecture.lessons.find(l => l.lessonId === selectedLesson);
      if (!lesson || lesson.presentation.length === 0) return;

      
      const totalTime = lesson.presentation.reduce((sum, step) => sum + step.duration, 0);
      setTotalLessonTime(totalTime);
      setStepDuration(lesson.presentation[0].duration);
      setCurrentStepTime(0);

      setPlaybackState({
        isPlaying: true,
        currentStepIndex: 0,
        isMuted: false,
        currentLesson: lesson
      });

      // Add a small delay before starting the first step
      await new Promise(resolve => setTimeout(resolve, 100));

      try {
        await playStep(lesson.presentation[0]);
      } catch (error) {
        console.error('[ControlPane] Error starting lesson:', error);
        // Reset state on error
        setPlaybackState({
          isPlaying: false,
          currentStepIndex: -1,
          isMuted: false,
          currentLesson: null
        });
      }
      
    }
  };

  const handleStepComplete = () => {
      console.log('[ControlPane] Step complete called');

      setPlaybackState(currentPlaybackState => {
          if (!currentPlaybackState.currentLesson) {
              console.log('[ControlPane] No current lesson found, stopping');
              return currentPlaybackState;
          }

          const nextIndex = currentPlaybackState.currentStepIndex + 1;
          console.log('[ControlPane] Current state:', {
              currentIndex: currentPlaybackState.currentStepIndex,
              nextIndex,
              totalSteps: currentPlaybackState.currentLesson.presentation.length
          });

          if (nextIndex < currentPlaybackState.currentLesson.presentation.length) {
              console.log('[ControlPane] Starting next step');
              const nextStep = currentPlaybackState.currentLesson.presentation[nextIndex];

              // Schedule next step immediately
              playStep(nextStep);

              return {
                  ...currentPlaybackState,
                  currentStepIndex: nextIndex
              };
          } else {
              console.log('[ControlPane] Lesson complete, stopping playback');
              setCurrentStepTime(0);
              return {
                  isPlaying: false,
                  currentStepIndex: -1,
                  isMuted: false,
                  currentLesson: null
              };
          }
      });
  };
  const handleToggleMute = () => {
    setPlaybackState(prev => ({
      ...prev,
      isMuted: !prev.isMuted
    }));
    lecturePlayerService.setMuted(!playbackState.isMuted);
  };

  const isYouTube = url.trim() && isYouTubeUrl(url);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: 2,
      }}
    >
      {/* Main Content */}
      <Box sx={{ flex: '1 1 auto' }}>
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 2
        }}
      >
        <Typography variant="h6" component="h2">
          {lecture?.title || t('controlPanel')}
        </Typography>
        <IconButton
          onClick={() => setShowDebugControls(prev => !prev)}
          size="small"
        >
          <Settings />
        </IconButton>
      </Box>

      <Divider sx={{ mb: 2 }} />

      <Stack spacing={2}>
        <FormControl size="small">
          <InputLabel id="language-select-label">
            {t('selectLanguage')}
          </InputLabel>
          <Select
            labelId="language-select-label"
            value={i18n.language}
            label={t('selectLanguage')}
            onChange={handleLanguageChange}
            sx={{ minWidth: 200 }}
          >
            <MenuItem value="hy">{t('armenian')}</MenuItem>
            <MenuItem value="en">{t('english')}</MenuItem>
            <MenuItem value="de">{t('german')}</MenuItem>
          </Select>
        </FormControl>

        {lecture && (
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
            <FormControl size="small" sx={{ flex: 1 }}>
              <InputLabel id="lesson-select-label">
                {t('selectLesson')}
              </InputLabel>
              <Select
                labelId="lesson-select-label"
                value={selectedLesson}
                label={t('selectLesson')}
                onChange={handleLessonChange}
                sx={{ width: '100%' }}
              >
                {lecture.lessons.map((lesson) => (
                  <MenuItem key={lesson.lessonId} value={lesson.lessonId}>
                    {lesson.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <IconButton 
              color="primary"
              onClick={handlePlayLesson}
              disabled={!selectedLesson}
              sx={{ 
                mt: 0.5,
                backgroundColor: 'primary.main',
                color: 'white',
                position: 'relative',
                top:'-4px',
                '&:hover': {
                  backgroundColor: 'primary.dark',
                },
                '&.Mui-disabled': {
                  backgroundColor: 'action.disabledBackground',
                  color: 'action.disabled',
                }
              }}
            >
              <PlayArrow />
            </IconButton>
          </Box>
        )}
        
        {/* Debug Controls */}
        {showDebugControls && (
          <>
        <Box>
          <TextField
            fullWidth
            label={t('enterUrl')}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://youtube.com/watch?v=... or https://example.com"
            variant="outlined"
            size="small"
          />
          <FormHelperText>
            {isYouTube ? 
              t('youtubeUrlDetected') : 
              t('pasteYoutubeUrl')}
          </FormHelperText>
        </Box>

        <Stack 
          direction="row" 
          spacing={2}
          sx={{ width: '100%' }}
        >
          <Button
            variant="contained"
            startIcon={<VideoLibrary />}
            onClick={() => handleDisplay('video')}
            disabled={!url.trim()}
            fullWidth
          >
            {t('displayAsVideo')}
          </Button>

          <Button
            variant="contained"
            startIcon={<Language />}
            onClick={() => handleDisplay('iframe')}
            disabled={!url.trim()}
            fullWidth
          >
            {t('displayAsWebpage')}
          </Button>
        </Stack>
        </>
      )}
      </Stack>
      </Box>
      {selectedLesson && lecture && (
      <Box sx={{ 
          display: 'flex', 
          flexDirection: 'row',
          alignItems: 'center',  
          justifyContent: 'start', 
          flex: 1,
          gap: 2  // Adds spacing between the QR code and text
        }}>
        <Box sx={{ mt:2 }}>
          <QRCode encodeText={selectedLesson} />
        </Box>
        <Typography>{t('homework')}</Typography>
      </Box>
      )}
      <Box>
      <AudioPlayer 
        onComplete={() => {
          if (selectedMessage) {
            onResetSelectedMessage();
          } else if (audioCompleteCallback) {
            audioCompleteCallback();
            setAudioCompleteCallback(null);
          }
        }}
        onPlaybackStart={() => {
          if (!selectedMessage) {  // Only emit chat message during normal playback
            onChatMessage(currentNarrative ?? '', false);
          }
        }}
        narrative={currentNarrative || (selectedMessage?.content ?? null)}
      />
      </Box>  
    </Box>
  );
};