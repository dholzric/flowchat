import { Request, Response } from 'express';
import prisma from '../config/database';
import { logger } from '../config/logger';

export const getConversations = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    const conversations = await prisma.dMConversation.findMany({
      where: {
        participants: {
          some: {
            userId,
          },
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                avatar: true,
                status: true,
              },
            },
          },
        },
        messages: {
          take: 1,
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
          },
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    res.json({ conversations });
  } catch (error) {
    logger.error('Get conversations error:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
};

export const createConversation = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { participantIds, isGroup, name } = req.body;

    if (!participantIds || participantIds.length === 0) {
      return res.status(400).json({ error: 'At least one participant is required' });
    }

    // Check if 1-on-1 conversation already exists
    if (!isGroup && participantIds.length === 1) {
      const existingConversation = await prisma.dMConversation.findFirst({
        where: {
          isGroup: false,
          AND: [
            {
              participants: {
                some: {
                  userId,
                },
              },
            },
            {
              participants: {
                some: {
                  userId: participantIds[0],
                },
              },
            },
          ],
        },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  firstName: true,
                  lastName: true,
                  avatar: true,
                  status: true,
                },
              },
            },
          },
        },
      });

      if (existingConversation) {
        return res.json({ conversation: existingConversation });
      }
    }

    // Create conversation
    const allParticipantIds = [userId, ...participantIds];
    const conversation = await prisma.dMConversation.create({
      data: {
        isGroup: isGroup || false,
        name: name || null,
        participants: {
          create: allParticipantIds.map((id) => ({
            userId: id,
          })),
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                avatar: true,
                status: true,
              },
            },
          },
        },
      },
    });

    res.status(201).json({ conversation });
  } catch (error) {
    logger.error('Create conversation error:', error);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
};

export const getConversation = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { conversationId } = req.params;

    const conversation = await prisma.dMConversation.findFirst({
      where: {
        id: conversationId,
        participants: {
          some: {
            userId,
          },
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                avatar: true,
                status: true,
              },
            },
          },
        },
      },
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    res.json({ conversation });
  } catch (error) {
    logger.error('Get conversation error:', error);
    res.status(500).json({ error: 'Failed to fetch conversation' });
  }
};

export const getDMMessages = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { conversationId } = req.params;
    const { limit = 50, before } = req.query;

    // Check if user is participant
    const participant = await prisma.dMParticipant.findFirst({
      where: {
        conversationId,
        userId,
      },
    });

    if (!participant) {
      return res.status(403).json({ error: 'You do not have access to this conversation' });
    }

    const where: any = { conversationId };
    if (before) {
      where.createdAt = { lt: new Date(before as string) };
    }

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
      },
    });

    // Update last read timestamp
    await prisma.dMParticipant.update({
      where: {
        userId_conversationId: {
          userId,
          conversationId,
        },
      },
      data: {
        lastReadAt: new Date(),
      },
    });

    res.json({ messages: messages.reverse() });
  } catch (error) {
    logger.error('Get DM messages error:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
};

export const sendDMMessage = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { conversationId } = req.params;
    const { content, attachments } = req.body;

    // Check if user is participant
    const participant = await prisma.dMParticipant.findFirst({
      where: {
        conversationId,
        userId,
      },
    });

    if (!participant) {
      return res.status(403).json({ error: 'You do not have access to this conversation' });
    }

    const message = await prisma.directMessage.create({
      data: {
        content,
        senderId: userId,
        conversationId,
        attachments: attachments || null,
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
      },
    });

    // Update conversation updatedAt
    await prisma.dMConversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    res.status(201).json({ message });
  } catch (error) {
    logger.error('Send DM message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
};

export const updateDMMessage = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { messageId } = req.params;
    const { content } = req.body;

    const message = await prisma.directMessage.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (message.senderId !== userId) {
      return res.status(403).json({ error: 'You can only edit your own messages' });
    }

    const updatedMessage = await prisma.directMessage.update({
      where: { id: messageId },
      data: {
        content,
        edited: true,
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
      },
    });

    res.json({ message: updatedMessage });
  } catch (error) {
    logger.error('Update DM message error:', error);
    res.status(500).json({ error: 'Failed to update message' });
  }
};

export const deleteDMMessage = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { messageId } = req.params;

    const message = await prisma.directMessage.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (message.senderId !== userId) {
      return res.status(403).json({ error: 'You can only delete your own messages' });
    }

    await prisma.directMessage.delete({
      where: { id: messageId },
    });

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    logger.error('Delete DM message error:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
};
