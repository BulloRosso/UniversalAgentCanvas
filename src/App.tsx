// src/App.tsx
import React, { useCallback, useEffect, useState } from 'react';
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
import defaultUserIcon from './assets/user-icon.png'; // You'll need to add this image
import { EventBus, EVENTS, UIEventType } from './events/CustomEvents';

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

export const App: React.FC = () => {
  const [contentRequest, setContentRequest] = React.useState<{
    title: string;
    url: string;
    type: 'video' | 'iframe' | 'slide' | 'image';
  } | null>(null);

  
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [currentStepHandler, setCurrentStepHandler] = React.useState<(() => void) | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<ChatMessage | null>(null);

  const handleMessageClick = useCallback((message: ChatMessage) => {
    if (!message.isUser) {  // Only handle assistant messages
      setSelectedMessage(message);
    }
  }, []);
  
  const handleDisplayContent = (url: string, type: 'video' | 'iframe' | 'slide' | 'image', onComplete?: () => void) => {
    console.log('Setting content request:', { url, type });
    setContentRequest({ 
       title: type === 'video' ? 'Video' : type === 'image' ? 'Image' : 'Content',
      url, 
      type });
    setCurrentStepHandler(() => onComplete);
  };

  const handleVideoComplete = useCallback(() => {
    console.log('Video completed, calling step handler');
    if (currentStepHandler) {
      currentStepHandler();
    }
  }, [currentStepHandler]);

  useEffect(() => {
    // Subscribe to UI commands
    const unsubscribe = EventBus.getInstance().subscribe(
      EVENTS.LECTURE_PART_FINISHED,
      (event: CustomEvent<UIEventType>) => {
        const lecture = event.detail as unknown as Lesson;
        console.log('Starting interactive part of the lecture:', lecture.discussion.prompt);

        // TODO inital prompt to set the stage - should emit chat inviting student(s) to participate
      }
    );

    // Cleanup subscription
    return () => unsubscribe();
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

  const handleMessagesUpdate = useCallback((newMessages: ChatMessage[]) => {
    // console.log('App: Updating messages:', newMessages);
    setMessages(newMessages);
  }, []);
  
  return (
    <I18nextProvider i18n={i18n}>
      <StudentProvider>
      <LectureProvider>
        <ThemeProvider theme={theme}>
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
        </ThemeProvider>
      </LectureProvider>
      </StudentProvider>
    </I18nextProvider>
  );
};

export default App;