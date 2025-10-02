import { Router } from 'express';
import { uploadFile, uploadMultipleFiles } from '../controllers/uploadController';
import { authenticate } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

router.post('/', authenticate, upload.single('file'), uploadFile);
router.post('/multiple', authenticate, upload.array('files', 10), uploadMultipleFiles);

export default router;
