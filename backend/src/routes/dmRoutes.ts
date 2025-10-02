import { Router } from 'express';
import {
  getConversations,
  createConversation,
  getConversation,
  getDMMessages,
  updateDMMessage,
  deleteDMMessage,
} from '../controllers/dmController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getConversations);
router.post('/', authenticate, createConversation);
router.get('/:conversationId', authenticate, getConversation);
router.get('/:conversationId/messages', authenticate, getDMMessages);
router.patch('/messages/:messageId', authenticate, updateDMMessage);
router.delete('/messages/:messageId', authenticate, deleteDMMessage);

export default router;
