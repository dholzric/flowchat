import { Router } from 'express';
import {
  getMessages,
  getThreadReplies,
  updateMessage,
  deleteMessage,
  addReaction,
  removeReaction,
  searchMessages,
} from '../controllers/messageController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/channel/:channelId', authenticate, getMessages);
router.get('/:messageId/replies', authenticate, getThreadReplies);
router.patch('/:messageId', authenticate, updateMessage);
router.delete('/:messageId', authenticate, deleteMessage);
router.post('/:messageId/reactions', authenticate, addReaction);
router.delete('/:messageId/reactions', authenticate, removeReaction);
router.get('/workspace/:workspaceId/search', authenticate, searchMessages);

export default router;
