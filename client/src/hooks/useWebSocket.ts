import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../_core/hooks/useAuth';

interface ScanLog {
  scanId: number;
  message: string;
  level: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
}

export function useWebSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [logs, setLogs] = useState<ScanLog[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    // Connect to WebSocket with or without user
    const socket = io(window.location.origin, {
      auth: user ? {
        userId: user.id,
        role: user.role,
      } : {},
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 10,
    });

    socket.on('connect', () => {
      console.log('[WebSocket] Connected successfully');
      setIsConnected(true);
    });

    socket.on('connect_error', (error) => {
      console.error('[WebSocket] Connection error:', error);
      setIsConnected(false);
    });

    socket.on('disconnect', (reason) => {
      console.log('[WebSocket] Disconnected:', reason);
      setIsConnected(false);
    });

    socket.on('scan:log', (log: ScanLog) => {
      console.log('[WebSocket] Received log:', log);
      setLogs((prev) => [...prev, log]);
    });

    socket.on('subscribed:scan', (data: any) => {
      console.log('[WebSocket] Subscribed to scan:', data);
    });

    socket.on('error', (error) => {
      console.error('[WebSocket] Socket error:', error);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, [user]);

  const subscribeScan = useCallback((scanId: number) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('subscribe:scan', scanId);
      setLogs([]); // Clear logs when subscribing to new scan
    }
  }, []);

  const unsubscribeScan = useCallback((scanId: number) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('unsubscribe:scan', scanId);
    }
  }, []);

  return {
    isConnected,
    logs,
    subscribeScan,
    unsubscribeScan,
    socket: socketRef.current,
  };
}
