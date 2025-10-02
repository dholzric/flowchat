import { Router } from 'express';
import {
  createChannel,
  createChannelValidation,
  getChannels,
  getChannel,
  updateChannel,
  joinChannel,
  leaveChannel,
} from '../controllers/channelController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post(
  '/workspace/:workspaceId',
  authenticate,
  createChannelValidation,
  createChannel
);
router.get('/workspace/:workspaceId', authenticate, getChannels);
router.get('/:channelId', authenticate, getChannel);
router.patch('/:channelId', authenticate, updateChannel);
router.post('/:channelId/join', authenticate, joinChannel);
router.delete('/:channelId/leave', authenticate, leaveChannel);

export default router;
