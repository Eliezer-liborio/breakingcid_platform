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
    if (!user) return;

    // Connect to WebSocket using relative URL
    const socket = io({
      auth: {
        userId: user.id,
        role: user.role,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 10,
      secure: true,
      rejectUnauthorized: false,
    });

    socket.on('connect', () => {
      console.log('[WebSocket] Connected');
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('[WebSocket] Disconnected');
      setIsConnected(false);
    });

    socket.on('scan:log', (log: ScanLog) => {
      console.log('[WebSocket] Received log:', log);
      setLogs((prev) => [...prev, log]);
    });

    socket.on('error', (error) => {
      console.error('[WebSocket] Error:', error);
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
