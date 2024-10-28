// src/context/WebSocketContext.tsx
import React, { createContext, useContext, useCallback, useEffect, useState, useRef } from 'react';
import { ChatMessage } from '../types/message';

interface WebSocketContextType {
  isConnected: boolean;
  threadId?: string;
  sendMessage: (content: string, attachments?: File[]) => Promise<void>;
}

interface WebSocketProviderProps {
  children: React.ReactNode;
  onMessage: (message: any) => void;  // Keep this as any to pass through raw message
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export function WebSocketProvider({ children, onMessage }: WebSocketProviderProps) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [threadId, setThreadId] = useState<string>();

  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  const connectWebSocket = useCallback(async (tid: string) => {
    try {
      const wsUrl = `wss://dee09cc9-22ed-465f-8839-fe8c5be2f694-00-hm6w1lz6dlro.riker.replit.dev/socket?threadId=${tid}`;
      console.log('Connecting to WebSocket with URL:', wsUrl);

      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('WebSocket Connected Successfully with threadId:', tid);
        setIsConnected(true);
        reconnectAttempts.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          console.log('Raw WebSocket message received:', event.data);
          const data = JSON.parse(event.data);
          console.log('Parsed WebSocket message:', data);

          // Pass the raw parsed data to the handler
          onMessage(data);
        } catch (error) {
          console.error('Error processing message:', error);
        }
      };

      ws.onclose = (event) => {
        console.log('WebSocket Disconnected:', event.code, event.reason);
        setIsConnected(false);
        setSocket(null);

        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }

        if (event.code !== 1000) {
          const backoffTime = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 10000);
          console.log(`Attempting to reconnect in ${backoffTime}ms (attempt ${reconnectAttempts.current + 1}/${maxReconnectAttempts})`);

          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current += 1;
            if (tid) connectWebSocket(tid);
          }, backoffTime);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket Error:', error);
      };

      setSocket(ws);
    } catch (error) {
      console.error('Error creating WebSocket:', error);
    }
  }, [onMessage]);

  const sendMessage = useCallback(async (content: string, attachments?: File[]) => {
    try {
      const response = await fetch('https://dee09cc9-22ed-465f-8839-fe8c5be2f694-00-hm6w1lz6dlro.riker.replit.dev/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userMessage: content,
          thread_id: threadId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Message sent successfully, response:', data);

      if (data.threadId && (!threadId || data.threadId !== threadId)) {
        setThreadId(data.threadId);
        await connectWebSocket(data.threadId);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }, [threadId, connectWebSocket]);

  useEffect(() => {
    return () => {
      console.log('Cleaning up WebSocket connection...');
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socket?.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, [socket]);

  return (
    <WebSocketContext.Provider value={{ isConnected, threadId, sendMessage }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};