import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

let io;

export const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true,
    },
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.userId = user._id.toString();
      socket.user = user;
      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`✅ User connected: ${socket.userId}`);

    // Join user's personal room
    socket.join(socket.userId);

    // Update user online status
    updateUserStatus(socket.userId, true);

    // Notify contacts that user is online
    socket.broadcast.emit('user:online', { userId: socket.userId });

    // ==================== CHAT EVENTS ====================
    
    // Join conversation room
    socket.on('chat:join', (conversationId) => {
      socket.join(`conversation:${conversationId}`);
      console.log(`User ${socket.userId} joined conversation ${conversationId}`);
    });

    // Leave conversation room
    socket.on('chat:leave', (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
      console.log(`User ${socket.userId} left conversation ${conversationId}`);
    });

    // Send message
    socket.on('chat:message', async (data) => {
      const { conversationId, message, type, replyTo } = data;

      // Broadcast to conversation room
      io.to(`conversation:${conversationId}`).emit('chat:message', {
        conversationId,
        message: {
          _id: message._id,
          senderId: socket.userId,
          message: message.message,
          type: type || 'text',
          replyTo,
          createdAt: new Date(),
          delivered: false,
          read: false,
        },
      });
    });

    // Typing indicator
    socket.on('chat:typing', ({ conversationId, isTyping }) => {
      socket.to(`conversation:${conversationId}`).emit('chat:typing', {
        conversationId,
        userId: socket.userId,
        userName: socket.user.name,
        isTyping,
      });
    });

    // Message delivered
    socket.on('chat:delivered', ({ messageId, conversationId }) => {
      io.to(`conversation:${conversationId}`).emit('chat:delivered', {
        messageId,
        conversationId,
      });
    });

    // Message read
    socket.on('chat:read', ({ messageId, conversationId }) => {
      io.to(`conversation:${conversationId}`).emit('chat:read', {
        messageId,
        conversationId,
      });
    });

    // ==================== VIDEO CALL EVENTS ====================
    
    // Initiate call
    socket.on('call:initiate', ({ to, roomName, isVideo }) => {
      io.to(to).emit('call:incoming', {
        from: socket.userId,
        fromName: socket.user.name,
        roomName,
        isVideo,
      });
    });

    // Accept call
    socket.on('call:accept', ({ to, roomName }) => {
      io.to(to).emit('call:accepted', {
        from: socket.userId,
        roomName,
      });
    });

    // Reject call
    socket.on('call:reject', ({ to }) => {
      io.to(to).emit('call:rejected', {
        from: socket.userId,
      });
    });

    // End call
    socket.on('call:end', ({ to }) => {
      io.to(to).emit('call:ended', {
        from: socket.userId,
      });
    });

    // ==================== NOTIFICATION EVENTS ====================
    
    socket.on('notification:read', ({ notificationId }) => {
      console.log(`Notification ${notificationId} marked as read by ${socket.userId}`);
    });

    // ==================== PRESENCE EVENTS ====================
    
    socket.on('presence:update', ({ status }) => {
      socket.broadcast.emit('presence:update', {
        userId: socket.userId,
        status,
      });
    });

    // ==================== DISCONNECT ====================
    
    socket.on('disconnect', () => {
      console.log(`❌ User disconnected: ${socket.userId}`);
      
      // Update user online status
      updateUserStatus(socket.userId, false);
      
      // Notify contacts that user is offline
      socket.broadcast.emit('user:offline', {
        userId: socket.userId,
        lastSeen: new Date(),
      });
    });
  });

  return io;
};

// Helper functions
async function updateUserStatus(userId, isOnline) {
  try {
    await User.findByIdAndUpdate(userId, {
      isOnline,
      lastSeen: isOnline ? undefined : new Date(),
    });
  } catch (error) {
    console.error('Error updating user status:', error);
  }
}

// Emit notification to specific user
export const emitNotification = (userId, notification) => {
  if (io) {
    io.to(userId).emit('notification:new', notification);
  }
};

// Emit to specific room
export const emitToRoom = (room, event, data) => {
  if (io) {
    io.to(room).emit(event, data);
  }
};

// Broadcast to all users
export const broadcast = (event, data) => {
  if (io) {
    io.emit(event, data);
  }
};

export const getIO = () => io;
