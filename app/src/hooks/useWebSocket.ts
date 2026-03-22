import { useState, useEffect, useRef, useCallback } from 'react';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001/ws';
const MAX_RECONNECT_DELAY = 30000; // Cap reconnect delay at 30s

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<Record<string, unknown> | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const unmountedRef = useRef(false);

  const clearReconnectTimeout = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    if (unmountedRef.current) return;
    if (wsRef.current?.readyState === WebSocket.OPEN || wsRef.current?.readyState === WebSocket.CONNECTING) return;

    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        if (unmountedRef.current) return;
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;
      };

      ws.onclose = () => {
        if (unmountedRef.current) return;
        setIsConnected(false);

        // Exponential backoff capped at MAX_RECONNECT_DELAY
        const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), MAX_RECONNECT_DELAY);
        reconnectAttemptsRef.current++;

        reconnectTimeoutRef.current = setTimeout(() => {
          if (!unmountedRef.current) connect();
        }, delay);
      };

      ws.onmessage = (event) => {
        if (unmountedRef.current) return;
        try {
          const data = JSON.parse(event.data);
          setLastMessage(data);
        } catch {
          // Ignore malformed messages
        }
      };

      ws.onerror = () => {
        // onerror always fires before onclose — let onclose handle reconnect
        // Don't log — this fires constantly when backend is down and is noisy
      };
    } catch {
      // If WebSocket constructor fails, schedule reconnect
      if (!unmountedRef.current) {
        const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), MAX_RECONNECT_DELAY);
        reconnectAttemptsRef.current++;
        reconnectTimeoutRef.current = setTimeout(() => {
          if (!unmountedRef.current) connect();
        }, delay);
      }
    }
  }, []);

  const disconnect = useCallback(() => {
    clearReconnectTimeout();
    if (wsRef.current) {
      wsRef.current.onclose = null; // Prevent reconnect on manual disconnect
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  }, [clearReconnectTimeout]);

  const sendMessage = useCallback((message: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  const subscribe = useCallback((channel: string) => {
    sendMessage({ action: 'subscribe', payload: { channel } });
  }, [sendMessage]);

  const unsubscribe = useCallback((channel: string) => {
    sendMessage({ action: 'unsubscribe', payload: { channel } });
  }, [sendMessage]);

  useEffect(() => {
    unmountedRef.current = false;
    connect();
    return () => {
      unmountedRef.current = true;
      disconnect();
    };
  }, [connect, disconnect]);

  return { isConnected, lastMessage, sendMessage, subscribe, unsubscribe, connect, disconnect };
}
