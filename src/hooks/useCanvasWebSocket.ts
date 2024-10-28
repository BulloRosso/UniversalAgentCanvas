// src/hooks/useCanvasWebSocket.ts
import { useEffect, useRef, useState, useCallback } from 'react';
import { CanvasCommand } from '../types/canvas';

interface UseCanvasWebSocketProps {
  url: string;
  onCommand: (command: CanvasCommand) => void;
}

interface WebSocketState {
  isConnected: boolean;
  error: string | null;
}

export const useCanvasWebSocket = ({ url, onCommand }: UseCanvasWebSocketProps) => {
  const wsRef = useRef<WebSocket | null>(null);
  const [wsState, setWsState] = useState<WebSocketState>({
    isConnected: false,
    error: null
  });

  const connect = useCallback(() => {
    try {
      console.log('Attempting to connect to WebSocket:', url);
      const ws = new WebSocket(url);

      ws.onopen = () => {
        console.log('WebSocket connected successfully');
        setWsState({
          isConnected: true,
          error: null
        });
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'display-canvas') {
            onCommand(data);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setWsState(prev => ({
          ...prev,
          error: 'WebSocket connection error'
        }));
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected, attempting to reconnect...');
        setWsState(prev => ({
          ...prev,
          isConnected: false
        }));
        wsRef.current = null;  // Clear the reference when connection is closed
        // Attempt to reconnect after a delay
        setTimeout(connect, 5000);
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('WebSocket connection error:', error);
      setWsState({
        isConnected: false,
        error: 'Failed to create WebSocket connection'
      });
      wsRef.current = null;  // Clear the reference on error
    }
  }, [url, onCommand]);

  useEffect(() => {
    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;  // Clear the reference on cleanup
      }
    };
  }, [connect]);

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected. Message not sent:', message);
    }
  }, []);

  return {
    sendMessage,
    wsConnection: wsRef.current,  // This can be null
    isConnected: wsState.isConnected,
    error: wsState.error
  };
};