import { Server, Socket } from 'socket.io';
import { verifyToken } from '../utils/jwt';
import prisma from '../config/database';
import redisClient from '../config/redis';
import { logger } from '../config/logger';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

export const initializeSocket = (io: Server) => {
  // Authentication middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = verifyToken(token);
      socket.userId = decoded.userId;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket: AuthenticatedSocket) => {
    const userId = socket.userId!;
    logger.info(`User connected: ${userId}`);

    // Update user status to online
    await prisma.user.update({
      where: { id: userId },
      data: { status: 'ONLINE', lastSeenAt: new Date() },
    });

    // Store socket ID in Redis
    await redisClient.set(`user:${userId}:socketId`, socket.id, {
      EX: 86400, // 24 hours
    });

    // Join user's workspaces
    const workspaces = await prisma.workspace.findMany({
      where: {
        members: {
          some: {
            userId,
          },
        },
      },
      include: {
        channels: {
          where: {
            members: {
              some: {
                userId,
              },
            },
          },
        },
      },
    });

    workspaces.forEach((workspace) => {
      socket.join(`workspace:${workspace.id}`);
      workspace.channels.forEach((channel) => {
        socket.join(`channel:${channel.id}`);
      });
    });

    // Broadcast user online status
    workspaces.forEach((workspace) => {
      socket.to(`workspace:${workspace.id}`).emit('user:status', {
        userId,
        status: 'ONLINE',
      });
    });

    // Handle sending messages
    socket.on('message:send', async (data) => {
      try {
        const { channelId, content, parentId } = data;

        // Verify user has access to channel
        const member = await prisma.channelMember.findFirst({
          where: {
            channelId,
            userId,
          },
        });

        if (!member) {
          socket.emit('error', { message: 'No access to this channel' });
          return;
        }

        // Create message
        const message = await prisma.message.create({
          data: {
            content,
            authorId: userId,
            channelId,
            parentId: parentId || null,
          },
          include: {
            author: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
            reactions: true,
          },
        });

        // Emit to channel
        io.to(`channel:${channelId}`).emit('message:new', message);

        logger.info(`Message sent: ${message.id} in channel ${channelId}`);
      } catch (error) {
        logger.error('Socket message:send error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle typing indicator
    socket.on('typing:start', async (data) => {
      const { channelId } = data;
      socket.to(`channel:${channelId}`).emit('typing:user', {
        userId,
        channelId,
        typing: true,
      });
    });

    socket.on('typing:stop', async (data) => {
      const { channelId } = data;
      socket.to(`channel:${channelId}`).emit('typing:user', {
        userId,
        channelId,
        typing: false,
      });
    });

    // Handle message updates
    socket.on('message:update', async (data) => {
      try {
        const { messageId, content } = data;

        const message = await prisma.message.findUnique({
          where: { id: messageId },
        });

        if (!message || message.authorId !== userId) {
          socket.emit('error', { message: 'Cannot edit this message' });
          return;
        }

        const updatedMessage = await prisma.message.update({
          where: { id: messageId },
          data: { content, edited: true },
          include: {
            author: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
            reactions: {
              include: {
                user: {
                  select: {
                    id: true,
                    username: true,
                  },
                },
              },
            },
          },
        });

        io.to(`channel:${message.channelId}`).emit('message:updated', updatedMessage);
      } catch (error) {
        logger.error('Socket message:update error:', error);
        socket.emit('error', { message: 'Failed to update message' });
      }
    });

    // Handle message deletion
    socket.on('message:delete', async (data) => {
      try {
        const { messageId } = data;

        const message = await prisma.message.findUnique({
          where: { id: messageId },
        });

        if (!message || message.authorId !== userId) {
          socket.emit('error', { message: 'Cannot delete this message' });
          return;
        }

        await prisma.message.delete({
          where: { id: messageId },
        });

        io.to(`channel:${message.channelId}`).emit('message:deleted', {
          messageId,
          channelId: message.channelId,
        });
      } catch (error) {
        logger.error('Socket message:delete error:', error);
        socket.emit('error', { message: 'Failed to delete message' });
      }
    });

    // Handle reactions
    socket.on('reaction:add', async (data) => {
      try {
        const { messageId, emoji } = data;

        const reaction = await prisma.reaction.create({
          data: {
            userId,
            messageId,
            emoji,
          },
          include: {
            user: {
              select: {
                id: true,
                username: true,
              },
            },
            message: {
              select: {
                channelId: true,
              },
            },
          },
        });

        io.to(`channel:${reaction.message.channelId}`).emit('reaction:added', {
          messageId,
          reaction,
        });
      } catch (error) {
        logger.error('Socket reaction:add error:', error);
      }
    });

    socket.on('reaction:remove', async (data) => {
      try {
        const { messageId, emoji } = data;

        const reaction = await prisma.reaction.findUnique({
          where: {
            userId_messageId_emoji: {
              userId,
              messageId,
              emoji,
            },
          },
          include: {
            message: {
              select: {
                channelId: true,
              },
            },
          },
        });

        if (reaction) {
          await prisma.reaction.delete({
            where: {
              userId_messageId_emoji: {
                userId,
                messageId,
                emoji,
              },
            },
          });

          io.to(`channel:${reaction.message.channelId}`).emit('reaction:removed', {
            messageId,
            userId,
            emoji,
          });
        }
      } catch (error) {
        logger.error('Socket reaction:remove error:', error);
      }
    });

    // Handle joining channels
    socket.on('channel:join', async (data) => {
      const { channelId } = data;
      socket.join(`channel:${channelId}`);
      logger.info(`User ${userId} joined channel ${channelId}`);
    });

    socket.on('channel:leave', async (data) => {
      const { channelId } = data;
      socket.leave(`channel:${channelId}`);
      logger.info(`User ${userId} left channel ${channelId}`);
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
      logger.info(`User disconnected: ${userId}`);

      // Update user status
      await prisma.user.update({
        where: { id: userId },
        data: { status: 'OFFLINE', lastSeenAt: new Date() },
      });

      // Remove socket ID from Redis
      await redisClient.del(`user:${userId}:socketId`);

      // Broadcast user offline status
      workspaces.forEach((workspace) => {
        socket.to(`workspace:${workspace.id}`).emit('user:status', {
          userId,
          status: 'OFFLINE',
        });
      });
    });
  });

  return io;
};
