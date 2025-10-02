import { Router } from 'express';
import { searchMessages, searchDMs } from '../controllers/searchController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/messages', authenticate, searchMessages);
router.get('/dms', authenticate, searchDMs);

export default router;
