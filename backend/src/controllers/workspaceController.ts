import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../config/database';
import { logger } from '../config/logger';

export const createWorkspaceValidation = [
  body('name')
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be between 1 and 100 characters'),
  body('slug')
    .matches(/^[a-z0-9-]+$/)
    .withMessage('Slug can only contain lowercase letters, numbers, and hyphens'),
  body('description').optional().trim(),
];

export const createWorkspace = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = (req as any).userId;
    const { name, slug, description, inviteOnly } = req.body;

    // Check if slug already exists
    const existingWorkspace = await prisma.workspace.findUnique({
      where: { slug },
    });

    if (existingWorkspace) {
      return res.status(400).json({ error: 'Workspace slug already taken' });
    }

    // Create workspace and add creator as owner
    const workspace = await prisma.workspace.create({
      data: {
        name,
        slug,
        description,
        inviteOnly: inviteOnly || false,
        members: {
          create: {
            userId,
            role: 'OWNER',
          },
        },
        channels: {
          create: {
            name: 'general',
            description: 'General discussion',
            isPrivate: false,
            members: {
              create: {
                userId,
                role: 'ADMIN',
              },
            },
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
        channels: true,
      },
    });

    logger.info(`Workspace created: ${workspace.slug} by user ${userId}`);

    res.status(201).json({ workspace });
  } catch (error) {
    logger.error('Create workspace error:', error);
    res.status(500).json({ error: 'Failed to create workspace' });
  }
};

export const getWorkspaces = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    const workspaces = await prisma.workspace.findMany({
      where: {
        members: {
          some: {
            userId,
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
        channels: {
          where: {
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
        },
      },
    });

    res.json({ workspaces });
  } catch (error) {
    logger.error('Get workspaces error:', error);
    res.status(500).json({ error: 'Failed to fetch workspaces' });
  }
};

export const getWorkspace = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { workspaceId } = req.params;

    const workspace = await prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        members: {
          some: {
            userId,
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
                status: true,
              },
            },
          },
        },
        channels: {
          where: {
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
        },
      },
    });

    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    res.json({ workspace });
  } catch (error) {
    logger.error('Get workspace error:', error);
    res.status(500).json({ error: 'Failed to fetch workspace' });
  }
};

export const updateWorkspace = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { workspaceId } = req.params;
    const { name, description, avatar, inviteOnly } = req.body;

    // Check if user is admin or owner
    const member = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        userId,
        role: {
          in: ['ADMIN', 'OWNER'],
        },
      },
    });

    if (!member) {
      return res
        .status(403)
        .json({ error: 'Only admins and owners can update workspace' });
    }

    const workspace = await prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        name: name !== undefined ? name : undefined,
        description: description !== undefined ? description : undefined,
        avatar: avatar !== undefined ? avatar : undefined,
        inviteOnly: inviteOnly !== undefined ? inviteOnly : undefined,
      },
    });

    res.json({ workspace });
  } catch (error) {
    logger.error('Update workspace error:', error);
    res.status(500).json({ error: 'Failed to update workspace' });
  }
};

export const inviteToWorkspace = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { workspaceId } = req.params;
    const { userEmail, role } = req.body;

    // Check if requester is admin or owner
    const requester = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        userId,
        role: {
          in: ['ADMIN', 'OWNER'],
        },
      },
    });

    if (!requester) {
      return res.status(403).json({ error: 'Only admins can invite users' });
    }

    // Find user to invite
    const invitedUser = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!invitedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if already a member
    const existingMember = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: invitedUser.id,
          workspaceId,
        },
      },
    });

    if (existingMember) {
      return res.status(400).json({ error: 'User is already a member' });
    }

    // Add user to workspace
    const member = await prisma.workspaceMember.create({
      data: {
        userId: invitedUser.id,
        workspaceId,
        role: role || 'MEMBER',
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

    // Add user to general channel
    const generalChannel = await prisma.channel.findFirst({
      where: {
        workspaceId,
        name: 'general',
      },
    });

    if (generalChannel) {
      await prisma.channelMember.create({
        data: {
          userId: invitedUser.id,
          channelId: generalChannel.id,
          role: 'MEMBER',
        },
      });
    }

    res.status(201).json({ member });
  } catch (error) {
    logger.error('Invite to workspace error:', error);
    res.status(500).json({ error: 'Failed to invite user' });
  }
};
