import { Router } from 'express';
import { uploadPhoto } from '../controllers/uploadController.js';
import { authenticateToken } from '../middlewares/auth.js';
import { upload } from '../middlewares/upload.js';

const router = Router();

// Single file upload route, expecting field name 'image'
router.post('/', authenticateToken, upload.single('image'), uploadPhoto);

export default router;
