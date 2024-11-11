// src/components/ControlPane/ControlPane.tsx
import React, { useState, useRef, useEffect } from 'react';
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
import AudioPlayer, { AudioPlayerProps } from '../AudioPlayer/AudioPlayer';  
import QRCode from '..//QRCode/QRCode';
import { EventBus, EVENTS, UIEventType, PlaybackStateChangeEvent, AudioPlaybackState } from '../../events/CustomEvents';
import { useStudent } from '../../context/StudentContext';

interface ControlPaneProps {
  onDisplayContent: (url: string, type: 'video' | 'iframe' | 'slide' | 'image', onComplete?: () => void) => void;
  onChatMessage: (chatmessage: ChatMessage) => void;
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
  const [stepDuration, setStepDuration] = useState(0);
  const [showDebugControls, setShowDebugControls] = useState(false);
  const [currentNarrative, setCurrentNarrative] = useState<string | null>(null);
  const [audioCompleteCallback, setAudioCompleteCallback] = useState<(() => void) | null>(null);
  const { setPreferredLanguage } = useStudent();
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false);
  const [currentStepTime, setCurrentStepTime] = useState(0);
  const eventBus = EventBus.getInstance();
  // Add a ref to track if we've already finished this lesson
  const lessonCompletionRef = useRef<string | null>(null);
  const completionInProgressRef = useRef(false);
  
  const [playbackState, setPlaybackState] = useState<PlaybackState>({
    isPlaying: false,
    currentStepIndex: -1,
    isMuted: false,
    currentLesson: null
  });

  const createChatMessage = (content: string, isUser: boolean): ChatMessage => {
    return {
      id: Date.now().toString(),
      content,
      timestamp: new Date(),
      isUser,
      isTyping: false
    };
  };

  useEffect(() => {
    // Listen for natural audio completion
    const unsubscribeComplete = eventBus.subscribe(
      EVENTS.PLAYBACK_STATE_CHANGE,
      (event: CustomEvent<PlaybackStateChangeEvent>) => {
        if (event.detail.state === AudioPlaybackState.COMPLETED) {
          console.log('[ControlPane] Audio completed naturally, triggering step completion');
          handleStepComplete();
        }
      }
    );

    // Listen for audio errors
    const unsubscribeError = eventBus.subscribe(
      EVENTS.AUDIO_PLAYBACK_ERROR,
      () => {
        console.log('[ControlPane] Audio error detected, moving to next step');
        handleStepComplete();
      }
    );

    return () => {
      unsubscribeComplete();
      unsubscribeError();
    };
  }, []);
  
  // Listen for narrative commands from EventBus
  useEffect(() => {
    const unsubscribe = EventBus.getInstance().subscribe(
      EVENTS.UI_COMMAND,
      (event: CustomEvent<UIEventType>) => {
        
        if (event.detail.cmd === 'ui_narrative' && event.detail.narrative) {
          console.log('[ControlPane] Received narrative from EventBus:', event.detail.narrative);
         
          // Only update if we're not already playing something
          //if (!selectedMessage && !currentNarrative) {
            console.log("Setting narrative from event now")
            setCurrentNarrative(event.detail.narrative);
            // If there's additional data like a tool_call_id, we can use it
            setAudioCompleteCallback(() => () => {
              console.log('[ControlPane] EventBus narrative complete:', event.detail.tool_call_id);
              setCurrentNarrative(null);
            });
         // }
        }
      }
    );

    return () => unsubscribe();
  }, [selectedMessage, currentNarrative]);

  const handleDisplay = (type: 'video' | 'iframe') => {
    if (url.trim()) {
      onDisplayContent(url.trim(), type, undefined);
      setUrl('');
    }
  };

  const handleLanguageChange = async (event: SelectChangeEvent<string>) => {
    const newLanguage = event.target.value;
    setLanguageMenuOpen(false); // Close dropdown immediately
    // Use setTimeout to change language after the dropdown closes
    setTimeout(() => {
      i18n.changeLanguage(newLanguage);
      setPreferredLanguage(newLanguage);
    }, 0);
  };

  const handleLessonChange = (event: SelectChangeEvent<string>) => {
    setSelectedLesson(event.target.value);
  };

  const playStep = async (step: Step) => {
    console.log('[ControlPane] Attempting to play step:', {
      stepNumber: step.stepNumber,
      type: step.type
    });

    // Guard against playing same step multiple times
    if (playbackState.isPlaying && 
        playbackState.currentStepIndex === step.stepNumber - 1) {
      console.log('[ControlPane] Step already playing, skipping');
      return;
    }

    try {
      // Update playback state first
      setPlaybackState(prevState => ({
        ...prevState,
        isPlaying: true,
        currentStepIndex: step.stepNumber - 1
      }));

      // Announce step transition
      eventBus.publish(EVENTS.STEP_TRANSITION, {
        from: playbackState.currentStepIndex,
        to: step.stepNumber - 1,
        lessonId: playbackState.currentLesson?.lessonId || ''
      });

      // Display content
      onDisplayContent(
        step.url, 
        step.type,
        step.type === 'video' ? () => {
          console.log('[ControlPane] Video content completed, triggering step completion');
          handleStepComplete();
        } : undefined
      );

      // For non-video content, set up narrative
      if (step.type !== 'video') {
        console.log('[ControlPane] Setting narrative for step:', step.stepNumber);
        setCurrentNarrative(step.narrative);
      }

    } catch (error) {
      console.error('[ControlPane] Error playing step:', error);
      handleStepComplete();
    }
  };

  const handleStepComplete = () => {
    // Guard against multiple simultaneous completions
    if (completionInProgressRef.current) {
      console.log('[ControlPane] Completion already in progress, skipping');
      return;
    }

    console.log('[ControlPane] Step complete called');
    completionInProgressRef.current = true;

    setPlaybackState(currentPlaybackState => {
      if (!currentPlaybackState.currentLesson) {
        console.log('[ControlPane] No current lesson found, stopping');
        completionInProgressRef.current = false;
        return currentPlaybackState;
      }

      const nextIndex = currentPlaybackState.currentStepIndex + 1;
      console.log('[ControlPane] Calculating next step:', {
        currentIndex: currentPlaybackState.currentStepIndex,
        nextIndex,
        totalSteps: currentPlaybackState.currentLesson.presentation.length
      });

      if (nextIndex < currentPlaybackState.currentLesson.presentation.length) {
        console.log('[ControlPane] Starting next step');
        const nextStep = currentPlaybackState.currentLesson.presentation[nextIndex];

        // Use setTimeout to ensure state updates have propagated
        setTimeout(() => {
          completionInProgressRef.current = false;
          playStep(nextStep);
        }, 100);

        return {
          ...currentPlaybackState,
          currentStepIndex: nextIndex,
          isPlaying: true
        };
      } else {
        console.log('[ControlPane] Lesson complete, checking if already finished');

        // Move this before the state update
        console.log('[ControlPane] Publishing LECTURE_PART_FINISHED event');
        eventBus.publish(
          EVENTS.LECTURE_PART_FINISHED, 
          currentPlaybackState.currentLesson
        );

        completionInProgressRef.current = false;
        return {
          isPlaying: false,
          currentStepIndex: -1,
          isMuted: false,
          currentLesson: null
        };
      }
    });
  };

  // Reset lesson completion ref when a new lesson starts
  const handlePlayLesson = async () => {
    if (!selectedLesson || !lecture) return;
    if (selectedLesson && lecture) {
      // Reset completion tracking for new lesson
      lessonCompletionRef.current = null;

      if (playbackState.isPlaying) {
        console.log('[ControlPane] Lesson already playing, skipping start');
        return;
      }

      const lesson = lecture.lessons.find(l => l.lessonId === selectedLesson);
      if (!lesson || lesson.presentation.length === 0) return;

      setStepDuration(lesson.presentation[0].duration);

      setPlaybackState({
        isPlaying: true,
        currentStepIndex: 0,
        isMuted: false,
        currentLesson: lesson
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      try {
        await playStep(lesson.presentation[0]);
      } catch (error) {
        console.error('[ControlPane] Error starting lesson:', error);
        setPlaybackState({
          isPlaying: false,
          currentStepIndex: -1,
          isMuted: false,
          currentLesson: null
        });
      }
    }
  };


  const StudentDashboard = () => {
    const student = useStudent();

    // Use useEffect to set the initial state only once
    useEffect(() => {
      student.setName('Ralph');
      student.setLocation('Berlin');
      student.setActiveLecture('OCR Foundations');
      student.setActiveLesson('OCR Input methods');
      student.addAnsweredQuestion({ questionId: 'Q1', score: 0 });
    }, []); // Empty dependency array means this runs only once on mount

    // Get status description with current date/time
    const status = student.getStatusDescription();

    return <div>{status}</div>;
  }
  
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
      }}
    >
      {/* Main Content */}
      <Box sx={{ flex: '1 1 auto' }}>
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          paddingLeft: '12px',
          paddingRight: '10px',
          paddingTop: '6px',
          paddingBottom: '6px',
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

      <Stack spacing={2} sx={{ padding: '16px' }}>
        <FormControl size="small">
          <InputLabel id="language-select-label">
            {t('selectLanguage')}
          </InputLabel>
          <Select
            labelId="language-select-label"
            value={i18n.language}
            label={t('selectLanguage')}
            onChange={handleLanguageChange}
            open={languageMenuOpen}
            onOpen={() => setLanguageMenuOpen(true)}
            onClose={() => setLanguageMenuOpen(false)}
            sx={{ minWidth: 200 }}
          >
            <MenuItem value="hy">Հայերեն</MenuItem>
            <MenuItem value="en">english</MenuItem>
            <MenuItem value="de">deutsch</MenuItem>
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
        narrative={currentNarrative || (selectedMessage?.content ?? null)}
        onComplete={() => {
          console.log('[ControlPane] AudioPlayer completed callback');
          if (selectedMessage) {
            onResetSelectedMessage();
          } else if (playbackState.currentLesson) {
            // Only call handleStepComplete for ongoing lessons
            handleStepComplete();
          }
        }}
        onPlaybackStart={() => {
          console.log('[ControlPane] AudioPlayer started playback');
          if (!selectedMessage) {
            onChatMessage(createChatMessage(currentNarrative, false));
          }
        }}
      />
      </Box> 
    </Box>
  );
};