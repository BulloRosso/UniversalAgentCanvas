// src/components/Chat/Chat.tsx
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Box } from '@mui/material';
import { ChatHeader } from './ChatHeader';
import { ChatOutputPane } from './ChatOutputPane';
import { ChatInputPane } from './ChatInputPane';
import { ChatConfig } from '../../types/config';
import { ChatMessage } from '../../types/message';
import { WebSocketProvider, useWebSocket } from '../../context/WebSocketContext';
import { useTranslation } from 'react-i18next';

interface ChatProps {
  config: ChatConfig;
  messages: ChatMessage[];
  onMessageUpdate: (messages: ChatMessage[]) => void;
  onMessageClick?: (message: ChatMessage) => void; 
}

interface WebSocketMessage {
  type: string;
  message: string;
}

// Changed to named export
export const Chat: React.FC<ChatProps> = ({ config, messages, onMessageUpdate, onMessageClick }) => {
  const { t } = useTranslation();
  const typingMessageIdRef = useRef<string | null>(null);
  const messagesRef = useRef(messages);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleToggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
  }, []);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const cleanMessageContent = (content: string): string => {
    // Remove source markers like 【4:0†source】 or similar variations
    return content.replace(/【\d+:\d+†source】/g, '')
                 .replace(/\s+$/, ''); // Also remove trailing whitespace
  };
  
  const handleWebSocketMessage = useCallback((wsMessage: WebSocketMessage) => {
    console.log('WebSocket received message:', wsMessage);
    console.log('Current messages in handler:', messagesRef.current);

    if (wsMessage.type === 'ASSISTANT_RESPONSE' && typingMessageIdRef.current) {
      const currentMessages = messagesRef.current;
      const typingIndex = currentMessages.findIndex(msg => msg.id === typingMessageIdRef.current);

      console.log('Found typing message at index:', typingIndex);
      console.log('Typing message ID:', typingMessageIdRef.current);

      if (typingIndex !== -1) {
        const updatedMessages = currentMessages.map(msg => 
          msg.id === typingMessageIdRef.current
            ? {
                ...msg,
                content: cleanMessageContent(wsMessage.message),
                isTyping: false,
                timestamp: new Date()
              }
            : msg
        );

        console.log('Updating messages with response:', updatedMessages);
        typingMessageIdRef.current = null;
        onMessageUpdate(updatedMessages);
      }
    } else {
      console.log('Received UI COMMAND', JSON.stringify(wsMessage));
    }
  }, [onMessageUpdate]);

  const ChatContent = () => {
    const { sendMessage } = useWebSocket();

    const handleSend = async (content: string, attachments?: File[]) => {
      try {
        const typingId = `typing-${Date.now()}`;
        typingMessageIdRef.current = typingId;

        console.log('Sending message:', content);
        console.log('Current messages before update:', messages);

        const userMessage: ChatMessage = {
          id: `user-${Date.now()}`,
          content,
          timestamp: new Date(),
          isUser: true,
        };

        const typingMessage: ChatMessage = {
          id: typingId,
          content: '',
          timestamp: new Date(),
          isUser: false,
          isTyping: true,
        };

        const newMessages = [...messages, userMessage, typingMessage];
        console.log('Updating messages with typing indicator:', newMessages);
        onMessageUpdate(newMessages);

        await sendMessage(content, attachments);
      } catch (error) {
        console.error('Error sending message:', error);
        if (typingMessageIdRef.current) {
          const filteredMessages = messages.filter(msg => msg.id !== typingMessageIdRef.current);
          onMessageUpdate(filteredMessages);
          typingMessageIdRef.current = null;
        }
      }
    };

    return (
      <Box   sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          height: '100%', 
          width: '100%',
          position: isFullscreen ? 'fixed' : 'relative',
          top: isFullscreen ? 0 : 'auto',
          left: isFullscreen ? 0 : 'auto',
          right: isFullscreen ? 0 : 'auto',
          bottom: isFullscreen ? 0 : 'auto',
          zIndex: isFullscreen ? 1300 : 'auto',
          bgcolor: 'background.paper'
        }}>
        <ChatHeader
          title={t('tutor')}
          onToggleFullscreen={handleToggleFullscreen}
          isFullscreen={isFullscreen}
        />
        <ChatOutputPane
          messages={messages}
          backgroundColor={config.chatBackgroundColor}
          userIcon={config.chatUserIcon}
          agentIcon={config.chatAgentIcon}
          onMessageClick={onMessageClick} 
        />
        <ChatInputPane
          onSendMessage={handleSend}
          disabled={false}
          speechRecognitionLang="hy-AR"
        />
      </Box>
    );
  };

  return (
    <WebSocketProvider onMessage={handleWebSocketMessage}>
      <ChatContent />
    </WebSocketProvider>
  );
};

// Optional: Add a default export as well if needed
export default Chat;