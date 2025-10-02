import { Request, Response } from 'express';
import prisma from '../config/database';
import { logger } from '../config/logger';

export const searchMessages = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { query, channelId, workspaceId, limit = 50 } = req.query;

    if (!query || typeof query !== 'string' || query.trim().length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }

    const searchQuery = query.trim();

    // Build where clause
    const where: any = {
      content: {
        contains: searchQuery,
        mode: 'insensitive',
      },
    };

    // Filter by channel if specified
    if (channelId) {
      // Verify user has access to channel
      const channelMember = await prisma.channelMember.findUnique({
        where: {
          userId_channelId: {
            userId,
            channelId: channelId as string,
          },
        },
      });

      if (!channelMember) {
        return res.status(403).json({ error: 'You do not have access to this channel' });
      }

      where.channelId = channelId;
    } else if (workspaceId) {
      // Search across all channels in workspace
      const workspaceMember = await prisma.workspaceMember.findUnique({
        where: {
          userId_workspaceId: {
            userId,
            workspaceId: workspaceId as string,
          },
        },
      });

      if (!workspaceMember) {
        return res.status(403).json({ error: 'You are not a member of this workspace' });
      }

      // Get all channels user has access to in workspace
      const userChannels = await prisma.channelMember.findMany({
        where: {
          userId,
          channel: {
            workspaceId: workspaceId as string,
          },
        },
        select: {
          channelId: true,
        },
      });

      where.channelId = {
        in: userChannels.map((c) => c.channelId),
      };
    } else {
      // Search across all channels user has access to
      const userChannels = await prisma.channelMember.findMany({
        where: {
          userId,
        },
        select: {
          channelId: true,
        },
      });

      where.channelId = {
        in: userChannels.map((c) => c.channelId),
      };
    }

    const messages = await prisma.message.findMany({
      where,
      take: parseInt(limit as string),
      orderBy: {
        createdAt: 'desc',
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
        channel: {
          select: {
            id: true,
            name: true,
            workspaceId: true,
          },
        },
        _count: {
          select: {
            replies: true,
          },
        },
      },
    });

    res.json({ messages, count: messages.length });
  } catch (error) {
    logger.error('Search messages error:', error);
    res.status(500).json({ error: 'Failed to search messages' });
  }
};

export const searchDMs = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { query, conversationId, limit = 50 } = req.query;

    if (!query || typeof query !== 'string' || query.trim().length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }

    const searchQuery = query.trim();

    // Get all conversations user is part of
    const userConversations = await prisma.dMParticipant.findMany({
      where: {
        userId,
      },
      select: {
        conversationId: true,
      },
    });

    const where: any = {
      content: {
        contains: searchQuery,
        mode: 'insensitive',
      },
      conversationId: conversationId
        ? conversationId as string
        : {
            in: userConversations.map((c) => c.conversationId),
          },
    };

    const messages = await prisma.directMessage.findMany({
      where,
      take: parseInt(limit as string),
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        conversation: {
          select: {
            id: true,
            name: true,
            isGroup: true,
          },
        },
      },
    });

    res.json({ messages, count: messages.length });
  } catch (error) {
    logger.error('Search DMs error:', error);
    res.status(500).json({ error: 'Failed to search direct messages' });
  }
};
