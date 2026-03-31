import { Router } from 'express'
import { authenticateToken } from '../middlewares/auth.js'
import {
  addFavorite,
  getMyFavorites,
  getMyReviews,
  removeFavorite,
} from '../controllers/userController.js'

const router = Router()

router.get('/me/favorites', authenticateToken, getMyFavorites)
router.post('/me/favorites', authenticateToken, addFavorite)
router.delete('/me/favorites/:merchantId', authenticateToken, removeFavorite)

router.get('/me/reviews', authenticateToken, getMyReviews)

export default router

