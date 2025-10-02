import { Router } from 'express';
import {
  register,
  registerValidation,
  login,
  loginValidation,
  getMe,
  updateProfile,
} from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.get('/me', authenticate, getMe);
router.patch('/me', authenticate, updateProfile);

export default router;
