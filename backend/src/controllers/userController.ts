import { Request, Response } from 'express';
import prisma from '../config/database';
import { logger } from '../config/logger';

export const searchUsers = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { query, workspaceId } = req.query;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const where: any = {
      OR: [
        { username: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
        { firstName: { contains: query, mode: 'insensitive' } },
        { lastName: { contains: query, mode: 'insensitive' } },
      ],
      id: { not: userId }, // Exclude current user
    };

    // If workspace specified, only search within workspace members
    if (workspaceId) {
      where.workspaceMembers = {
        some: {
          workspaceId: workspaceId as string,
        },
      };
    }

    const users = await prisma.user.findMany({
      where,
      take: 10,
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        status: true,
      },
    });

    res.json({ users });
  } catch (error) {
    logger.error('Search users error:', error);
    res.status(500).json({ error: 'Failed to search users' });
  }
};

export const getUsers = async (req: Request, res: Response) => {
  try {
    const { workspaceId } = req.query;

    if (!workspaceId) {
      return res.status(400).json({ error: 'Workspace ID is required' });
    }

    const users = await prisma.user.findMany({
      where: {
        workspaceMembers: {
          some: {
            workspaceId: workspaceId as string,
          },
        },
      },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        status: true,
      },
    });

    res.json({ users });
  } catch (error) {
    logger.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};
