import React, { useState, useEffect } from 'react';
import {
  Drawer,
  IconButton,
  Box,
  Typography,
  useTheme
} from '@mui/material';
import Timeline from '@mui/lab/Timeline';
import TimelineItem from '@mui/lab/TimelineItem';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineContent from '@mui/lab/TimelineContent';
import TimelineOppositeContent from '@mui/lab/TimelineOppositeContent';
import TimelineDot from '@mui/lab/TimelineDot';
import { 
  LinearScale,
  Slideshow,
  AssignmentTurnedIn,
  ChatBubbleOutline,
  Close
} from '@mui/icons-material';
import { EventBus, EVENTS, UIEventType, AnswerEventType } from '../../events/CustomEvents';
import { useTranslation } from 'react-i18next';

interface TimelineEntry {
  timestamp: string;
  title: string;
  type: 'step' | 'answer' | 'discussion';
  id?: string;
}

export const LessonTimeline: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [timelineItems, setTimelineItems] = useState<TimelineEntry[]>([]);
  const theme = useTheme();
  const { t, i18n  } = useTranslation();
  
  useEffect(() => {
    const eventBus = EventBus.getInstance();

    // Listen for step transitions
    const unsubscribeStep = eventBus.subscribe(
      EVENTS.STEP_TRANSITION,
      (event: CustomEvent) => {
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        });
console.log('Received step transition event:', JSON.stringify(event));
        const newEntry: TimelineEntry = {
          timestamp: timeString,
          title: event.detail.title,
          type: 'step'
        };

        setTimelineItems(prev => [...prev, newEntry]);
      }
    );

    // Listen for answered questions
    const unsubscribeAnswer = eventBus.subscribe(
      EVENTS.ANSWER_EVENT,
      (event: CustomEvent<AnswerEventType>) => {
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        });

        const newEntry: TimelineEntry = {
          timestamp: timeString,
          title: `Question ${event.detail.questionId}`,
          type: 'answer',
          id: event.detail.questionId
        };

        setTimelineItems(prev => [...prev, newEntry]);
      }
    );

    // Listen for lecture part finished
    const unsubscribeDiscussion = eventBus.subscribe(
      EVENTS.LECTURE_PART_FINISHED,
      () => {
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        });

        const newEntry: TimelineEntry = {
          timestamp: timeString,
          title: t('discusion'),
          type: 'discussion'
        };

        setTimelineItems(prev => [...prev, newEntry]);
      }
    );

    // Reset timeline when play button is pressed
    const unsubscribePlay = eventBus.subscribe(
      EVENTS.UI_COMMAND,
      (event: CustomEvent<UIEventType>) => {
        if (event.detail.cmd === 'play_lesson') {
          setTimelineItems([]);
        }
      }
    );

    return () => {
      unsubscribeStep();
      unsubscribeAnswer();
      unsubscribeDiscussion();
      unsubscribePlay();
    };
  }, []);

  const getTimelineIcon = (type: TimelineEntry['type']) => {
    switch (type) {
      case 'step':
        return <Slideshow />;
      case 'answer':
        return <AssignmentTurnedIn />;
      case 'discussion':
        return <ChatBubbleOutline  />;
      default:
        return <Slideshow />;
    }
  };

  const getTimelineDotColor = (type: TimelineEntry['type']) => {
    switch (type) {
      case 'step':
        return 'primary';
      case 'answer':
        return 'secondary';
      case 'discussion':
        return 'success';
      default:
        return 'primary';
    }
  };

  return (
    <>
      <IconButton
        onClick={() => setIsOpen(true)}
        size="small"
        sx={{ transform: 'rotate(90deg)' }}
      >
        <LinearScale />
      </IconButton>

      <Drawer
        anchor="left"
        open={isOpen}
        onClose={() => setIsOpen(false)}
        sx={{
          '& .MuiDrawer-paper': {
            width: 420,
            boxSizing: 'border-box',
          },
          '& .MuiTimelineDot-root': {
            margin: '2px',
            padding: '7px',
            borderWidth: 0
          },
          '& .MuiTimelineConnector-root': {
            width: '2px'
          },
          '& .MuiTimelineSeparator-root': {
            width: 'auto'
          },
          '& .MuiTimelineContent-root': {
            paddingTop: '0px',
            paddingBottom: '20px'
          },
          '& .MuiTimelineOppositeContent-root': {
            paddingTop: '26px',
            paddingBottom: '20px'
          }
        }}
      >
        <Box sx={{ 
          p: 2, 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          borderBottom: 1,
          borderColor: 'divider'
        }}>
          <Typography variant="h6" component="h2">
            {t('ourLesson')}
          </Typography>
          <IconButton onClick={() => setIsOpen(false)} size="small">
            <Close />
          </IconButton>
        </Box>

        <Timeline>
          {timelineItems.map((item, index) => (
            <TimelineItem key={`${item.timestamp}-${index}`}>
              <TimelineOppositeContent
                sx={{ px: 2}}
                variant="body2"
                color="text.secondary"
              >
                {item.timestamp}
              </TimelineOppositeContent>
              <TimelineSeparator>
                <TimelineConnector />
                <TimelineDot color={getTimelineDotColor(item.type)}>
                  {getTimelineIcon(item.type)}
                </TimelineDot>
                <TimelineConnector />
              </TimelineSeparator>
              <TimelineContent sx={{ marginTop: '24px', px: 2 }}>
                <Typography variant="subtitle1">
                  {item.title}
                </Typography>
              </TimelineContent>
            </TimelineItem>
          ))}
        </Timeline>
      </Drawer>
    </>
  );
};

export default LessonTimeline;