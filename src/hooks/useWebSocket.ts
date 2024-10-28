// src/hooks/useWebSocket.ts
import { useEffect, useRef, useState, useCallback } from 'react';

interface WebSocketState {
  isConnected: boolean;
  error: string | null;
}

export const useWebSocket = (url: string) => {
  const wsRef = useRef<WebSocket | null>(null);
  const [wsState, setWsState] = useState<WebSocketState>({
    isConnected: false,
    error: null
  });

  const connect = useCallback(() => {
    try {
      console.log('Chat WebSocket: Attempting to connect to:', url);
      const ws = new WebSocket(url);

      ws.onopen = () => {
        console.log('Chat WebSocket: Connected successfully');
        setWsState({
          isConnected: true,
          error: null
        });
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          // Handle received messages here
          console.log('Chat WebSocket: Received message:', data);
        } catch (error) {
          console.error('Chat WebSocket: Error parsing message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('Chat WebSocket: Error:', error);
        setWsState(prev => ({
          ...prev,
          error: 'WebSocket connection error'
        }));
      };

      ws.onclose = () => {
        console.log('Chat WebSocket: Disconnected, attempting to reconnect...');
        setWsState(prev => ({
          ...prev,
          isConnected: false
        }));
        wsRef.current = null;
        setTimeout(connect, 5000);
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('Chat WebSocket: Connection error:', error);
      setWsState({
        isConnected: false,
        error: 'Failed to create WebSocket connection'
      });
    }
  }, [url]);

  useEffect(() => {
    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect]);

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('Chat WebSocket: Not connected. Message not sent:', message);
    }
  }, []);

  return {
    sendMessage,
    isConnected: wsState.isConnected,
    error: wsState.error
  };
};