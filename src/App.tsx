// src/App.tsx
import React, { useCallback, useState } from 'react';
import { Box, ThemeProvider, createTheme } from '@mui/material';
import { Canvas } from './components/Canvas/Canvas';
import { Chat } from './components/Chat/Chat';
import { ControlPane } from './components/ControlPane/ControlPane';
import './i18n/i18n';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n/i18n';
import { LectureProvider } from './context/LectureContext';
import { ChatMessage } from './types/message';
import profImage from './assets/robo-prof.png';
import defaultUserIcon from './assets/user-icon.png'; // You'll need to add this image

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
    url: string;
    type: 'video' | 'iframe';
  } | null>(null);

  
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [currentStepHandler, setCurrentStepHandler] = React.useState<(() => void) | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<ChatMessage | null>(null);

  const handleMessageClick = useCallback((message: ChatMessage) => {
    if (!message.isUser) {  // Only handle assistant messages
      setSelectedMessage(message);
    }
  }, []);
  
  const handleDisplayContent = (url: string, type: 'video' | 'iframe', onComplete?: () => void) => {
    console.log('Setting content request:', { url, type });
    setContentRequest({ url, type });
    setCurrentStepHandler(() => onComplete);
  };

  const handleVideoComplete = useCallback(() => {
    console.log('Video completed, calling step handler');
    if (currentStepHandler) {
      currentStepHandler();
    }
  }, [currentStepHandler]);

 
  const handleChatMessage = useCallback((content: string, isUser: boolean = false) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      content,
      timestamp: new Date(),
      isUser,
    };
    setMessages(prev => [...prev, newMessage]);
  }, []);

  const handleMessagesUpdate = useCallback((newMessages: ChatMessage[]) => {
    console.log('App: Updating messages:', newMessages);
    setMessages(newMessages);
  }, []);
  
  return (
    <I18nextProvider i18n={i18n}>
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
                sx={{ 
                  height: '60%', 
                  backgroundColor: 'white', 
                  borderRadius: 2, 
                  boxShadow: 1, 
                  overflow: 'hidden', 
                  marginBottom: 2 
                }}
              >
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
                  onChatMessage={handleChatMessage}
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
    </I18nextProvider>
  );
};

export default App;