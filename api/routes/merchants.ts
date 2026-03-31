import { Router } from 'express';
import { getMerchants, getMerchantById, getReviews, createReview, getMyMerchants, createMerchant, updateMerchant, replyToReview, addMerchantPhoto, deleteMerchantPhoto } from '../controllers/merchantController.js';
import { authenticateToken } from '../middlewares/auth.js';
import { requireRoles } from '../middlewares/roles.js';

const router = Router();

// Public routes
// Merchant admin routes (must be declared before '/:id')
router.get('/mine/list', authenticateToken, requireRoles(['merchant_admin', 'admin']), getMyMerchants);
router.post('/', authenticateToken, requireRoles(['merchant_admin', 'admin']), createMerchant);
router.put('/:id', authenticateToken, requireRoles(['merchant_admin', 'admin']), updateMerchant);
router.post('/:id/photos', authenticateToken, requireRoles(['merchant_admin', 'admin']), addMerchantPhoto);
router.delete('/:id/photos/:photoId', authenticateToken, requireRoles(['merchant_admin', 'admin']), deleteMerchantPhoto);

router.get('/', getMerchants);
router.get('/:id', getMerchantById);
router.get('/:id/reviews', getReviews);

// Protected routes
router.post('/:id/reviews', authenticateToken, createReview);

router.put(
  '/:id/reviews/:reviewId/reply',
  authenticateToken,
  requireRoles(['merchant_admin', 'admin']),
  replyToReview,
);

export default router;
