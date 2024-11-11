import React, { useEffect, useRef } from 'react';
import { Box, Avatar } from '@mui/material';
import { marked } from 'marked';
import profIcon from '../../assets/robo-prof-icon.png';
import { TypingIndicator } from './TypingIndicator';
import { ChatMessage } from '../../types/message';

interface ChatOutputPaneProps {
  messages: ChatMessage[];
  backgroundColor: string;
  userIcon: string;
  agentIcon: string;
  onMessageClick?: (message: ChatMessage) => void;  
}

export const ChatOutputPane: React.FC<ChatOutputPaneProps> = ({
  messages,
  backgroundColor,
  userIcon,
  agentIcon,
  onMessageClick
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldScrollRef = useRef(true);

  const scrollToBottom = () => {
    if (!shouldScrollRef.current) return;

    // Use requestAnimationFrame to ensure DOM updates are complete
    requestAnimationFrame(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
      }
    });
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollHeight, scrollTop, clientHeight } = container;
      // Consider user "near bottom" if within 100px of bottom
      const isNearBottom = scrollHeight - (scrollTop + clientHeight) < 100;
      shouldScrollRef.current = isNearBottom;
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Separate effect for initial scroll
  useEffect(() => {
    scrollToBottom();
  }, []);

  // Effect for handling new messages
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  const renderMessageContent = (message: ChatMessage) => {
    if (message.isTyping) {
      return <TypingIndicator />;
    }

    return (
      <div 
        onClick={() => onMessageClick?.(message)}
        className="markdown-content"
      >
        <div dangerouslySetInnerHTML={{ __html: marked(message.content) }} />
      </div>
    );
  };

  return (
    <Box
      ref={containerRef}
      sx={{
        flex: 1,
        backgroundColor,
        overflowY: 'auto',
        padding: 2,
        '&::-webkit-scrollbar': {
          width: '8px',
        },
        '&::-webkit-scrollbar-track': {
          backgroundColor: 'transparent',
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: 'rgba(0,0,0,0.2)',
          borderRadius: '4px',
          '&:hover': {
            backgroundColor: 'rgba(0,0,0,0.3)',
          },
        },
      }}
    >
      <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
        {messages.map((message) => (
          <Box
            key={message.id}
            sx={{
              display: 'flex',
              justifyContent: message.isUser ? 'flex-end' : 'flex-start',
              marginBottom: 2,
            }}
          >
            {!message.isUser && (
              <Avatar
                src={profIcon}
                sx={{ 
                  width: 45, 
                  height: 45, 
                  marginRight: 1,
                  flexShrink: 0
                }}
              />
            )}
            <Box
              sx={{
                backgroundColor: message.isUser ? '#cfeeff' : '#ffefc5',
                cursor: !message.isUser ? 'pointer' : '',
                padding: '10px',
                borderRadius: '10px',
                maxWidth: '70%',
                wordBreak: 'break-word',
                boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                minHeight: message.isTyping ? '32px' : 'auto',
                display: 'flex',
                alignItems: 'flex-start',
                '& .markdown-content': {
                  width: '100%',
                  overflow: 'hidden',
                  fontSize: '18px',
                  '& h1, & h2, & h3, & h4, & h5, & h6': {
                    margin: '0.5em 0',
                    fontWeight: 'bold',
                    lineHeight: 1.2,
                  },
                  '& h1': { fontSize: '1.5em' },
                  '& h2': { fontSize: '1.3em' },
                  '& h3': { fontSize: '1.2em' },
                  '& p': { 
                    margin: '0.5em 0',
                    overflow: 'hidden',
                  },
                  '& ul, & ol': {
                    marginTop: '0.5em',
                    marginBottom: '0.5em',
                    paddingLeft: '1.5em',
                    listStylePosition: 'outside',
                  },
                  '& li': {
                    marginBottom: '0.2em',
                    paddingLeft: '0.5em',
                  },
                  '& code': {
                    backgroundColor: 'rgba(0,0,0,0.05)',
                    padding: '2px 4px',
                    borderRadius: 4,
                    fontSize: '0.9em',
                  },
                  '& pre': {
                    backgroundColor: 'rgba(0,0,0,0.05)',
                    padding: '0.5em',
                    borderRadius: 4,
                    overflowX: 'auto',
                    margin: '0.5em 0',
                    '& code': {
                      backgroundColor: 'transparent',
                      padding: 0,
                    },
                  },
                  '& blockquote': {
                    borderLeft: '3px solid #ccc',
                    margin: '0.5em 0',
                    paddingLeft: '1em',
                    color: '#666',
                  },
                  '& img': {
                    maxWidth: '100%',
                    height: 'auto',
                    borderRadius: '4px',
                    margin: '0.5em 0',
                  },
                },
              }}
            >
              {renderMessageContent(message)}
            </Box>
            {message.isUser && (
              <Avatar
                src={userIcon}
                sx={{ 
                  width: 50, 
                  height: 50, 
                  marginLeft: 1,
                  flexShrink: 0
                }}
              />
            )}
          </Box>
        ))}
        <div ref={messagesEndRef} />
      </div>
    </Box>
  );
};