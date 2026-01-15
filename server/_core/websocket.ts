import { Server as SocketIOServer } from "socket.io";
import { Server as HTTPServer } from "http";
import type { Socket } from "socket.io";

interface ClientData {
  userId: string;
  scanId?: number;
  role?: string;
}

const clientMap = new Map<string, ClientData>();

export function setupWebSocket(httpServer: HTTPServer) {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: true,
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
    pingInterval: 25000,
    pingTimeout: 60000,
  });

  // Middleware for authentication
  io.use((socket, next) => {
    const userId = socket.handshake.auth.userId;
    const role = socket.handshake.auth.role;

    // Allow connection even without userId, but mark as unauthenticated
    socket.data.userId = userId || `anonymous-${socket.id}`;
    socket.data.role = role || "user";
    socket.data.authenticated = !!userId;
    next();
  });

  // Connection handler
  io.on("connection", (socket: Socket) => {
    const userId = socket.data.userId;
    console.log(`[WebSocket] User ${userId} connected: ${socket.id}`);

    // Store client info
    clientMap.set(socket.id, {
      userId,
      role: socket.data.role,
    });

    // Subscribe to scan logs
    socket.on("subscribe:scan", (scanId: number) => {
      const room = `scan:${scanId}`;
      socket.join(room);
      const currentData = clientMap.get(socket.id) || { userId, role: socket.data.role };
      clientMap.set(socket.id, {
        ...currentData,
        scanId,
      });
      console.log(`[WebSocket] User ${userId} subscribed to scan ${scanId}`);
      socket.emit('subscribed:scan', { scanId, success: true });
    });

    // Unsubscribe from scan logs
    socket.on("unsubscribe:scan", (scanId: number) => {
      const room = `scan:${scanId}`;
      socket.leave(room);
      console.log(`[WebSocket] User ${userId} unsubscribed from scan ${scanId}`);
    });

    // Disconnect handler
    socket.on("disconnect", () => {
      clientMap.delete(socket.id);
      console.log(`[WebSocket] User ${userId} disconnected: ${socket.id}`);
    });

    // Error handler
    socket.on("error", (error) => {
      console.error(`[WebSocket] Error for user ${userId}:`, error);
    });
  });

  return io;
}

export function emitScanLog(scanId: number, message: string, level: "info" | "success" | "warning" | "error" = "info") {
  // This will be called from the backend to emit logs to connected clients
  // Implementation in main server file
  return { scanId, message, level, timestamp: new Date() };
}

export function getConnectedClients(): Map<string, ClientData> {
  return clientMap;
}

export function getClientsByScanId(scanId: number): string[] {
  const clients: string[] = [];
  clientMap.forEach((data, socketId) => {
    if (data.scanId === scanId) {
      clients.push(socketId);
    }
  });
  return clients;
}
