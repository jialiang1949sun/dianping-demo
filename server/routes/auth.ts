import { Router } from 'express';
import { register, login, getProfile, updateProfile, requestOtp, loginWithOtp, updateAvatarUrl } from '../controllers/authController.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/request-otp', requestOtp);
router.post('/login-otp', loginWithOtp);
router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, updateProfile);
router.put('/avatar', authenticateToken, updateAvatarUrl);

export default router;

