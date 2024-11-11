// src/App.tsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Box, ThemeProvider, createTheme } from '@mui/material';
import { Canvas } from './components/Canvas/Canvas';
import { Chat } from './components/Chat/Chat';
import { ControlPane } from './components/ControlPane/ControlPane';
import './i18n/i18n';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n/i18n';
import { LectureProvider } from './context/LectureContext';
import { StudentProvider } from './context/StudentContext';
import { ChatMessage } from './types/message';
import { Lesson } from './types/lecture';
import profImage from './assets/robo-prof.png';
import defaultUserIcon from './assets/user-icon.png';
import { EventBus, EVENTS, UIEventType } from './events/CustomEvents';
import { WebSocketProvider, useWebSocket } from './context/WebSocketContext';

const theme = createTheme({
  typography: {
    fontFamily: 'Roboto, sans-serif',
  },
});

const defaultConfig = {
  backgroundColor: '#f5f5f5',
  title: 'Chat Assistant',
  avatar: profImage,
  chatBackgroundColor: '#ffffff',
  chatUserIcon: defaultUserIcon,
  chatAgentIcon: profImage,
};

// Inner component that has access to WebSocket context
const AppContent: React.FC = () => {
  const [contentRequest, setContentRequest] = React.useState<{
    title: string;
    url: string;
    type: 'video' | 'iframe' | 'slide' | 'image';
  } | null>(null);

  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [currentStepHandler, setCurrentStepHandler] = React.useState<(() => void) | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<ChatMessage | null>(null);
  const { sendMessage } = useWebSocket();
  const [lastProcessedLessonId, setLastProcessedLessonId] = useState<string | null>(null);
  const processedEventsRef = useRef(new Set<string>());
  
  const handleMessageClick = useCallback((message: ChatMessage) => {
    if (!message.isUser) {
      setSelectedMessage(message);
    }
  }, []);

  const handleDisplayContent = (url: string, type: 'video' | 'iframe' | 'slide' | 'image', onComplete?: () => void) => {
    console.log('Setting content request:', { url, type });
    setContentRequest({ 
      title: type === 'video' ? 'Video' : type === 'image' ? 'Image' : 'Content',
      url, 
      type 
    });
    setCurrentStepHandler(() => onComplete);
  };

  const handleVideoComplete = useCallback(() => {
    console.log('Video completed, calling step handler');
    if (currentStepHandler) {
      currentStepHandler();
    }
  }, [currentStepHandler]);

  const initializeDiscussion = useCallback(async (subsystemPrompt: string, prompt: string) => {
    
    try {
      // First, trigger the audio narration
      EventBus.getInstance().publish(EVENTS.UI_COMMAND, {
        cmd: 'ui_narrative',
        narrative: prompt,
        tool_call_id: `narrative-${Date.now()}`,
        title: '',  // Required by the type but not used for narrative
        url: ''     // Required by the type but not used for narrative
      });

      // Then send the prompt via WebSocket
      console.log('Sending initial prompt to backend:', subsystemPrompt);
      await sendMessage(subsystemPrompt);
    } catch (error) {
      console.error('Error in discussion initialization:', error);
    }
  }, []);

  useEffect(() => {
    console.log('[App] Setting up LECTURE_PART_FINISHED listener');

    const unsubscribe = EventBus.getInstance().subscribe(
      EVENTS.LECTURE_PART_FINISHED,
      (event: CustomEvent<UIEventType>) => {
        const lecture = event.detail as unknown as Lesson;
        console.log('[App] Received LECTURE_PART_FINISHED event:', {
          lessonId: lecture.lessonId,
          title: lecture.title,
          alreadyProcessed: processedEventsRef.current.has(lecture.lessonId)
        });

        // Guard against duplicate events
        if (processedEventsRef.current.has(lecture.lessonId)) {
          console.log('[App] Already processed lesson:', lecture.lessonId);
          return;
        }

        console.log('[App] Processing lecture completion:', lecture.lessonId);
        processedEventsRef.current.add(lecture.lessonId);

        console.log('[App] Starting interactive part of the lecture:', lecture.discussion.prompt);

        const subsystemPrompt = `We are now starting the interactive part of the lecture "${lecture.title}". The question to the students was 
        ----------------
        ${lecture.discussion.prompt}
        ----------------
        Please guide the students through the lecture by answering questions and providing examples.
        DO NOT show slides or ask questions in the response to this prompt!
        `;

        // Wrap in setTimeout to ensure state updates have completed
        setTimeout(() => {
          initializeDiscussion(subsystemPrompt, lecture.discussion.prompt);
        }, 0);
      }
    );

    return () => {
      console.log('[App] Cleaning up LECTURE_PART_FINISHED listener');
      unsubscribe();
      processedEventsRef.current.clear();
    };
  }, [initializeDiscussion]);

  const onPlayLesson = useCallback((lessonId: string) => {
    console.log('[App] Clearing processed events for new lesson:', lessonId);
    processedEventsRef.current.clear();
  }, []);
  
  const handleChatMessage = useCallback((content: string, isUser: boolean = false) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      content,
      timestamp: new Date(),
      isUser,
      isTyping: false
    };
    setMessages(prev => [...prev, newMessage]);
  }, []);

  const handlePlayLesson = useCallback((lessonId: string) => {
    processedEventsRef.current.clear();
  }, []);
  
  const handleMessagesUpdate = useCallback((newMessages: ChatMessage[]) => {
    setMessages(newMessages);
  }, []);

  return (
    <Box
      sx={{
        display: 'flex',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        backgroundColor: '#f0f0f0',
      }}
    >
      <Box 
        sx={{ 
          width: '60%', 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column', 
          padding: 2 
        }}
      >
        <Box 
          className="canvas-container"
          sx={{ 
            height: '60%', 
            backgroundColor: 'white', 
            borderRadius: 2, 
            boxShadow: 1, 
            overflow: 'hidden', 
            marginBottom: 2,
            '&:fullscreen': {
              height: '100vh',
              width: '100vw',
              borderRadius: 0,
              padding: 0,
              backgroundColor: 'black'
            },
            '&::-webkit-full-screen': {
              height: '100vh',
              width: '100vw',
              borderRadius: 0,
              padding: 0,
              backgroundColor: 'black'
            }
          }}>
          <Canvas 
            contentRequest={contentRequest} 
            onVideoComplete={handleVideoComplete}
          />
        </Box>
        <Box 
          sx={{ 
            flex: 1, 
            backgroundColor: 'white', 
            borderRadius: 2, 
            boxShadow: 1, 
            overflow: 'hidden' 
          }}
        >
          <ControlPane 
            onDisplayContent={handleDisplayContent}
            onChatMessage={(message: ChatMessage) => setMessages(prev => [...prev, message])}
            selectedMessage={selectedMessage}  
            onResetSelectedMessage={() => setSelectedMessage(null)}  
          />
        </Box>
      </Box>
      <Box 
        sx={{ 
          width: '40%', 
          height: '100%', 
          padding: 2, 
          paddingLeft: 0 
        }}
      >
        <Box 
          sx={{ 
            height: '100%', 
            backgroundColor: 'white', 
            borderRadius: 2, 
            boxShadow: 1, 
            overflow: 'hidden' 
          }}
        >
          <Chat 
            config={defaultConfig}
            messages={messages}
            onMessageUpdate={handleMessagesUpdate}
            onMessageClick={handleMessageClick}  
          />
        </Box>
      </Box>
    </Box>
  );
};

// Main App component
export const App: React.FC = () => {
  const handleWebSocketMessage = useCallback((wsMessage: any) => {
    console.log('WebSocket response to initial prompt:', wsMessage);
  }, []);

  return (
    <I18nextProvider i18n={i18n}>
      <StudentProvider>
        <LectureProvider>
          <ThemeProvider theme={theme}>
            <WebSocketProvider onMessage={handleWebSocketMessage}>
              <AppContent />
            </WebSocketProvider>
          </ThemeProvider>
        </LectureProvider>
      </StudentProvider>
    </I18nextProvider>
  );
};

export default App;