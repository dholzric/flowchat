import { Router } from 'express';
import { searchUsers, getUsers } from '../controllers/userController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/search', authenticate, searchUsers);
router.get('/', authenticate, getUsers);

export default router;
