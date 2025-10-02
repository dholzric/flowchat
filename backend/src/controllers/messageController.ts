import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../config/database';
import { logger } from '../config/logger';

export const sendMessageValidation = [
  body('content')
    .isLength({ min: 1, max: 4000 })
    .withMessage('Message must be between 1 and 4000 characters'),
  body('parentId').optional().isString(),
];

export const getMessages = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { channelId } = req.params;
    const { limit = 50, before, after } = req.query;

    // Check if user has access to channel
    const member = await prisma.channelMember.findFirst({
      where: {
        channelId,
        userId,
      },
    });

    if (!member) {
      return res.status(403).json({ error: 'You do not have access to this channel' });
    }

    // Build where clause
    const where: any = {
      channelId,
      parentId: null, // Only top-level messages
    };

    if (before) {
      where.createdAt = { lt: new Date(before as string) };
    } else if (after) {
      where.createdAt = { gt: new Date(after as string) };
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
        replies: {
          take: 3,
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
          },
        },
        _count: {
          select: {
            replies: true,
          },
        },
      },
    });

    // Update last read timestamp
    await prisma.channelMember.update({
      where: {
        userId_channelId: {
          userId,
          channelId,
        },
      },
      data: {
        lastReadAt: new Date(),
      },
    });

    res.json({ messages: messages.reverse() });
  } catch (error) {
    logger.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
};

export const getThreadReplies = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { messageId } = req.params;

    const parentMessage = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        channel: true,
      },
    });

    if (!parentMessage) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Check if user has access to channel
    const member = await prisma.channelMember.findFirst({
      where: {
        channelId: parentMessage.channelId,
        userId,
      },
    });

    if (!member) {
      return res.status(403).json({ error: 'You do not have access to this channel' });
    }

    const replies = await prisma.message.findMany({
      where: {
        parentId: messageId,
      },
      orderBy: {
        createdAt: 'asc',
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

    res.json({ replies });
  } catch (error) {
    logger.error('Get thread replies error:', error);
    res.status(500).json({ error: 'Failed to fetch replies' });
  }
};

export const updateMessage = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { messageId } = req.params;
    const { content } = req.body;

    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (message.authorId !== userId) {
      return res.status(403).json({ error: 'You can only edit your own messages' });
    }

    const updatedMessage = await prisma.message.update({
      where: { id: messageId },
      data: {
        content,
        edited: true,
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

    res.json({ message: updatedMessage });
  } catch (error) {
    logger.error('Update message error:', error);
    res.status(500).json({ error: 'Failed to update message' });
  }
};

export const deleteMessage = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { messageId } = req.params;

    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (message.authorId !== userId) {
      return res.status(403).json({ error: 'You can only delete your own messages' });
    }

    await prisma.message.delete({
      where: { id: messageId },
    });

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    logger.error('Delete message error:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
};

export const addReaction = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { messageId } = req.params;
    const { emoji } = req.body;

    if (!emoji) {
      return res.status(400).json({ error: 'Emoji is required' });
    }

    // Check if reaction already exists
    const existingReaction = await prisma.reaction.findUnique({
      where: {
        userId_messageId_emoji: {
          userId,
          messageId,
          emoji,
        },
      },
    });

    if (existingReaction) {
      return res.status(400).json({ error: 'Reaction already exists' });
    }

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
      },
    });

    res.status(201).json({ reaction });
  } catch (error) {
    logger.error('Add reaction error:', error);
    res.status(500).json({ error: 'Failed to add reaction' });
  }
};

export const removeReaction = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { messageId } = req.params;
    const { emoji } = req.body;

    await prisma.reaction.delete({
      where: {
        userId_messageId_emoji: {
          userId,
          messageId,
          emoji,
        },
      },
    });

    res.json({ message: 'Reaction removed successfully' });
  } catch (error) {
    logger.error('Remove reaction error:', error);
    res.status(500).json({ error: 'Failed to remove reaction' });
  }
};

export const searchMessages = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { workspaceId } = req.params;
    const { query, limit = 50 } = req.query;

    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    // Get user's channels in workspace
    const userChannels = await prisma.channel.findMany({
      where: {
        workspaceId,
        members: {
          some: {
            userId,
          },
        },
      },
      select: {
        id: true,
      },
    });

    const channelIds = userChannels.map((c) => c.id);

    const messages = await prisma.message.findMany({
      where: {
        channelId: {
          in: channelIds,
        },
        content: {
          contains: query as string,
          mode: 'insensitive',
        },
      },
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
      },
    });

    res.json({ messages });
  } catch (error) {
    logger.error('Search messages error:', error);
    res.status(500).json({ error: 'Failed to search messages' });
  }
};
