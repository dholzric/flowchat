import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../config/database';
import { logger } from '../config/logger';

export const createChannelValidation = [
  body('name')
    .isLength({ min: 1, max: 80 })
    .withMessage('Name must be between 1 and 80 characters')
    .matches(/^[a-z0-9-_]+$/)
    .withMessage('Name can only contain lowercase letters, numbers, hyphens, and underscores'),
  body('description').optional().trim(),
  body('isPrivate').optional().isBoolean(),
];

export const createChannel = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = (req as any).userId;
    const { workspaceId } = req.params;
    const { name, description, isPrivate } = req.body;

    // Check if user is member of workspace
    const member = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        userId,
      },
    });

    if (!member) {
      return res.status(403).json({ error: 'You are not a member of this workspace' });
    }

    // Check if channel name already exists in workspace
    const existingChannel = await prisma.channel.findFirst({
      where: {
        workspaceId,
        name,
      },
    });

    if (existingChannel) {
      return res.status(400).json({ error: 'Channel name already exists' });
    }

    // Create channel
    const channel = await prisma.channel.create({
      data: {
        name,
        description,
        isPrivate: isPrivate || false,
        workspaceId,
        members: {
          create: {
            userId,
            role: 'ADMIN',
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
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
      },
    });

    logger.info(`Channel created: ${channel.name} in workspace ${workspaceId}`);

    res.status(201).json({ channel });
  } catch (error) {
    logger.error('Create channel error:', error);
    res.status(500).json({ error: 'Failed to create channel' });
  }
};

export const getChannels = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { workspaceId } = req.params;

    // Check if user is member of workspace
    const member = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        userId,
      },
    });

    if (!member) {
      return res.status(403).json({ error: 'You are not a member of this workspace' });
    }

    const channels = await prisma.channel.findMany({
      where: {
        workspaceId,
        OR: [
          { isPrivate: false },
          {
            members: {
              some: {
                userId,
              },
            },
          },
        ],
        archived: false,
      },
      include: {
        members: {
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
        _count: {
          select: {
            messages: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    res.json({ channels });
  } catch (error) {
    logger.error('Get channels error:', error);
    res.status(500).json({ error: 'Failed to fetch channels' });
  }
};

export const getChannel = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { channelId } = req.params;

    const channel = await prisma.channel.findFirst({
      where: {
        id: channelId,
        OR: [
          { isPrivate: false },
          {
            members: {
              some: {
                userId,
              },
            },
          },
        ],
      },
      include: {
        workspace: true,
        members: {
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

    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }

    res.json({ channel });
  } catch (error) {
    logger.error('Get channel error:', error);
    res.status(500).json({ error: 'Failed to fetch channel' });
  }
};

export const updateChannel = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { channelId } = req.params;
    const { name, description, archived } = req.body;

    // Check if user is channel admin
    const member = await prisma.channelMember.findFirst({
      where: {
        channelId,
        userId,
        role: 'ADMIN',
      },
    });

    if (!member) {
      return res.status(403).json({ error: 'Only channel admins can update channel' });
    }

    const channel = await prisma.channel.update({
      where: { id: channelId },
      data: {
        name: name !== undefined ? name : undefined,
        description: description !== undefined ? description : undefined,
        archived: archived !== undefined ? archived : undefined,
      },
    });

    res.json({ channel });
  } catch (error) {
    logger.error('Update channel error:', error);
    res.status(500).json({ error: 'Failed to update channel' });
  }
};

export const joinChannel = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { channelId } = req.params;

    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
      include: {
        workspace: true,
      },
    });

    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }

    // Check if user is member of workspace
    const workspaceMember = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId: channel.workspaceId,
        userId,
      },
    });

    if (!workspaceMember) {
      return res.status(403).json({ error: 'You are not a member of this workspace' });
    }

    // Check if already a member
    const existingMember = await prisma.channelMember.findUnique({
      where: {
        userId_channelId: {
          userId,
          channelId,
        },
      },
    });

    if (existingMember) {
      return res.status(400).json({ error: 'Already a member of this channel' });
    }

    // Add user to channel
    const member = await prisma.channelMember.create({
      data: {
        userId,
        channelId,
        role: 'MEMBER',
      },
      include: {
        user: {
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

    res.status(201).json({ member });
  } catch (error) {
    logger.error('Join channel error:', error);
    res.status(500).json({ error: 'Failed to join channel' });
  }
};

export const leaveChannel = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { channelId } = req.params;

    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
    });

    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }

    // Can't leave general channel
    if (channel.name === 'general') {
      return res.status(400).json({ error: 'Cannot leave general channel' });
    }

    await prisma.channelMember.delete({
      where: {
        userId_channelId: {
          userId,
          channelId,
        },
      },
    });

    res.json({ message: 'Left channel successfully' });
  } catch (error) {
    logger.error('Leave channel error:', error);
    res.status(500).json({ error: 'Failed to leave channel' });
  }
};
