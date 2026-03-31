import { Response } from 'express'
import pool from '../config/db.js'

const parsePositiveInt = (value: unknown): number | null => {
  const n = Number(value)
  if (!Number.isFinite(n)) return null
  const i = Math.trunc(n)
  if (i <= 0) return null
  return i
}

export const getMyFavorites = async (req: any, res: Response): Promise<void> => {
  try {
    const userId = req.user.id
    const [rows] = await pool.query(
      `
      SELECT m.*, 
        COALESCE(AVG(r.rating), 0) as average_rating,
        COUNT(r.id) as review_count,
        f.created_at as favorited_at
      FROM favorites f
      JOIN merchants m ON f.merchant_id = m.id
      LEFT JOIN reviews r ON m.id = r.merchant_id
      WHERE f.user_id = ?
      GROUP BY m.id
      ORDER BY f.created_at DESC
      `,
      [userId]
    )
    res.status(200).json({ success: true, data: rows })
  } catch (error) {
    console.error('Get favorites error:', error)
    res
      .status(500)
      .json({ success: false, message: 'Server error fetching favorites' })
  }
}

export const addFavorite = async (req: any, res: Response): Promise<void> => {
  try {
    const userId = req.user.id
    const merchantId = parsePositiveInt(req.body?.merchant_id)

    if (!merchantId) {
      res.status(400).json({ success: false, message: 'merchant_id is required' })
      return
    }

    const [merchantRows] = await pool.query(
      'SELECT id FROM merchants WHERE id = ? LIMIT 1',
      [merchantId],
    )

    if (!(merchantRows as any[]).length) {
      res.status(404).json({ success: false, message: 'Merchant not found' })
      return
    }

    await pool.query(
      'INSERT OR IGNORE INTO favorites (user_id, merchant_id) VALUES (?, ?)',
      [userId, merchantId],
    )

    res.status(200).json({ success: true })
  } catch (error) {
    console.error('Add favorite error:', error)
    res.status(500).json({ success: false, message: 'Server error adding favorite' })
  }
}

export const removeFavorite = async (req: any, res: Response): Promise<void> => {
  try {
    const userId = req.user.id
    const merchantId = parsePositiveInt(req.params?.merchantId)

    if (!merchantId) {
      res.status(400).json({ success: false, message: 'merchantId is required' })
      return
    }

    const [result] = await pool.query(
      'DELETE FROM favorites WHERE user_id = ? AND merchant_id = ?',
      [userId, merchantId],
    )

    res.status(200).json({ success: true, deleted: (result as any)?.affectedRows ?? 0 })
  } catch (error) {
    console.error('Remove favorite error:', error)
    res.status(500).json({ success: false, message: 'Server error removing favorite' })
  }
}

export const getMyReviews = async (req: any, res: Response): Promise<void> => {
  try {
    const userId = req.user.id
    const { page = 1, limit = 10 } = req.query
    const offset = (Number(page) - 1) * Number(limit)

    const [rows] = await pool.query(
      `
      SELECT r.*, m.name as merchant_name
      FROM reviews r
      JOIN merchants m ON r.merchant_id = m.id
      WHERE r.user_id = ?
      ORDER BY r.created_at DESC
      LIMIT ? OFFSET ?
      `,
      [userId, Number(limit), Number(offset)]
    )

    const [countRows] = await pool.query(
      'SELECT COUNT(id) as total FROM reviews WHERE user_id = ?',
      [userId],
    )
    const total = (countRows as any[])[0].total

    res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      }
    })
  } catch (error) {
    console.error('Get my reviews error:', error)
    res
      .status(500)
      .json({ success: false, message: 'Server error fetching my reviews' })
  }
}

