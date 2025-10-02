import { Router } from 'express';
import {
  createWorkspace,
  createWorkspaceValidation,
  getWorkspaces,
  getWorkspace,
  updateWorkspace,
  inviteToWorkspace,
} from '../controllers/workspaceController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/', authenticate, createWorkspaceValidation, createWorkspace);
router.get('/', authenticate, getWorkspaces);
router.get('/:workspaceId', authenticate, getWorkspace);
router.patch('/:workspaceId', authenticate, updateWorkspace);
router.post('/:workspaceId/invite', authenticate, inviteToWorkspace);

export default router;
