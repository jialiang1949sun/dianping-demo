import { Request, Response } from 'express';
import pool from '../config/db.js';

export const getMerchants = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, keyword, page = 1, limit = 10 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const lat = req.query.lat !== undefined ? Number(req.query.lat) : null;
    const lon = req.query.lon !== undefined ? Number(req.query.lon) : null;
    const radiusKm = req.query.radiusKm !== undefined ? Number(req.query.radiusKm) : null;
    const sort = String(req.query.sort || 'recommended');
    const minRating = req.query.minRating !== undefined ? Number(req.query.minRating) : null;

    const hasGeo =
      lat !== null &&
      lon !== null &&
      Number.isFinite(lat) &&
      Number.isFinite(lon) &&
      ((Number.isFinite(radiusKm as any) && (radiusKm as number) > 0) || sort === 'distance');

    const haversineKm = (a: { lat: number; lon: number }, b: { lat: number; lon: number }) => {
      const R = 6371;
      const toRad = (v: number) => (v * Math.PI) / 180;
      const dLat = toRad(b.lat - a.lat);
      const dLon = toRad(b.lon - a.lon);
      const lat1 = toRad(a.lat);
      const lat2 = toRad(b.lat);
      const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
      return 2 * R * Math.asin(Math.sqrt(x));
    };
    
    let query = `
      SELECT m.*, 
        COALESCE(AVG(r.rating), 0) as average_rating,
        COUNT(r.id) as review_count
      FROM merchants m
      LEFT JOIN reviews r ON m.id = r.merchant_id
    `;
    const queryParams: any[] = [];
    
    const whereConditions = [];
    if (category) {
      whereConditions.push('m.category = ?');
      queryParams.push(category);
    }
    
    if (keyword) {
      whereConditions.push('(m.name LIKE ? OR m.address LIKE ?)');
      queryParams.push(`%${keyword}%`, `%${keyword}%`);
    }
    
    if (whereConditions.length > 0) {
      query += ` WHERE ${whereConditions.join(' AND ')}`;
    }
    
    if (!hasGeo) {
      query += ` GROUP BY m.id ORDER BY average_rating DESC LIMIT ? OFFSET ?`;
      queryParams.push(Number(limit), Number(offset));

      const [merchants] = await pool.query(query, queryParams);

      let countQuery = 'SELECT COUNT(m.id) as total FROM merchants m';
      if (whereConditions.length > 0) {
        countQuery += ` WHERE ${whereConditions.join(' AND ')}`;
      }
      const [countResult] = await pool.query(countQuery, queryParams.slice(0, -2));
      const total = (countResult as any[])[0].total;

      res.status(200).json({
        success: true,
        data: merchants,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit))
        }
      });
      return;
    }

    query += ` GROUP BY m.id`;
    const [rawMerchants] = await pool.query(query, queryParams);
    const list = (rawMerchants as any[]).map((m) => {
      const has = typeof m.latitude === 'number' && typeof m.longitude === 'number';
      const d = has ? haversineKm({ lat: lat as number, lon: lon as number }, { lat: m.latitude, lon: m.longitude }) : null;
      return { ...m, distance_km: d };
    });

    let filtered = list;
    if (Number.isFinite(minRating as any) && (minRating as number) > 0) {
      filtered = filtered.filter((m) => Number(m.average_rating) >= (minRating as number));
    }
    if (Number.isFinite(radiusKm as any) && (radiusKm as number) > 0) {
      filtered = filtered.filter((m) => typeof m.distance_km === 'number' && m.distance_km <= (radiusKm as number));
    }
    if (sort === 'distance') {
      filtered = filtered.sort((a, b) => {
        const ad = typeof a.distance_km === 'number' ? a.distance_km : Number.POSITIVE_INFINITY;
        const bd = typeof b.distance_km === 'number' ? b.distance_km : Number.POSITIVE_INFINITY;
        return ad - bd;
      });
    } else {
      filtered = filtered.sort((a, b) => Number(b.average_rating) - Number(a.average_rating));
    }

    const total = filtered.length;
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const start = (pageNum - 1) * limitNum;
    const data = filtered.slice(start, start + limitNum);

    res.status(200).json({
      success: true,
      data,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get merchants error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching merchants' });
  }
};

export const getMerchantById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const [merchants] = await pool.query(`
      SELECT m.*, 
        COALESCE(AVG(r.rating), 0) as average_rating,
        COUNT(r.id) as review_count
      FROM merchants m
      LEFT JOIN reviews r ON m.id = r.merchant_id
      WHERE m.id = ?
      GROUP BY m.id
    `, [id]);
    
    const merchantList = merchants as any[];
    if (merchantList.length === 0) {
      res.status(404).json({ success: false, message: 'Merchant not found' });
      return;
    }
    
    // Get merchant photos
    const [photos] = await pool.query('SELECT * FROM merchant_photos WHERE merchant_id = ?', [id]);
    
    const merchant = {
      ...merchantList[0],
      photos
    };
    
    res.status(200).json({
      success: true,
      data: merchant
    });
  } catch (error) {
    console.error('Get merchant details error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching merchant details' });
  }
};

export const getReviews = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    
    const [reviews] = await pool.query(`
      SELECT 
        r.*, 
        u.name as user_name,
        rr.reply_text as reply_text,
        rr.created_at as reply_created_at,
        rr.updated_at as reply_updated_at,
        ru.name as replied_by_name
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      LEFT JOIN review_replies rr ON rr.review_id = r.id
      LEFT JOIN users ru ON rr.replied_by = ru.id
      WHERE r.merchant_id = ?
      ORDER BY r.created_at DESC
      LIMIT ? OFFSET ?
    `, [id, Number(limit), Number(offset)]);
    
    const [countResult] = await pool.query('SELECT COUNT(id) as total FROM reviews WHERE merchant_id = ?', [id]);
    const total = (countResult as any[])[0].total;
    
    res.status(200).json({
      success: true,
      data: reviews,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching reviews' });
  }
};

export const replyToReview = async (req: any, res: Response): Promise<void> => {
  try {
    const { id: merchantId, reviewId } = req.params
    const userId = req.user.id
    const role = req.user.role
    const { reply_text } = req.body

    const text = String(reply_text || '').trim()
    if (!text) {
      res.status(400).json({ success: false, message: 'reply_text is required' })
      return
    }
    if (text.length > 200) {
      res
        .status(400)
        .json({ success: false, message: 'reply_text must be 200 characters or less' })
      return
    }

    const [merchantRows] = await pool.query(
      'SELECT id, owner_id FROM merchants WHERE id = ? LIMIT 1',
      [merchantId],
    )
    const merchant = (merchantRows as any[])[0]
    if (!merchant) {
      res.status(404).json({ success: false, message: 'Merchant not found' })
      return
    }

    if (role === 'merchant_admin' && merchant.owner_id !== userId) {
      res.status(403).json({ success: false, message: 'You are not the owner of this merchant' })
      return
    }

    const [reviewRows] = await pool.query(
      'SELECT id, merchant_id FROM reviews WHERE id = ? LIMIT 1',
      [reviewId],
    )
    const review = (reviewRows as any[])[0]
    if (!review || String(review.merchant_id) !== String(merchantId)) {
      res.status(404).json({ success: false, message: 'Review not found for this merchant' })
      return
    }

    await pool.query(
      `INSERT INTO review_replies (review_id, merchant_id, replied_by, reply_text)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(review_id) DO UPDATE SET
         reply_text = excluded.reply_text,
         replied_by = excluded.replied_by,
         merchant_id = excluded.merchant_id,
         updated_at = CURRENT_TIMESTAMP`,
      [Number(reviewId), Number(merchantId), userId, text],
    )

    res.status(200).json({ success: true })
  } catch (error) {
    console.error('Reply to review error:', error)
    res.status(500).json({ success: false, message: 'Server error replying to review' })
  }
}

export const createReview = async (req: any, res: Response): Promise<void> => {
  try {
    const { id: merchant_id } = req.params;
    const user_id = req.user.id;
    const { rating, comment } = req.body;
    
    if (!rating || !comment) {
      res.status(400).json({ success: false, message: 'Rating and comment are required' });
      return;
    }
    
    if (rating < 1 || rating > 5) {
      res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
      return;
    }
    
    if (comment.length > 200) {
      res.status(400).json({ success: false, message: 'Comment must be 200 characters or less' });
      return;
    }
    
    // Check if merchant exists
    const [merchants] = await pool.query('SELECT id FROM merchants WHERE id = ?', [merchant_id]);
    if ((merchants as any[]).length === 0) {
      res.status(404).json({ success: false, message: 'Merchant not found' });
      return;
    }
    
    // Check if user already reviewed this merchant
    const [existingReview] = await pool.query(
      'SELECT id FROM reviews WHERE user_id = ? AND merchant_id = ?', 
      [user_id, merchant_id]
    );
    
    if ((existingReview as any[]).length > 0) {
      res.status(400).json({ success: false, message: 'You have already reviewed this merchant' });
      return;
    }
    
    await pool.query(
      'INSERT INTO reviews (user_id, merchant_id, rating, comment) VALUES (?, ?, ?, ?)',
      [user_id, merchant_id, rating, comment]
    );
    
    res.status(201).json({
      success: true,
      message: 'Review created successfully'
    });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ success: false, message: 'Server error creating review' });
  }
};

export const getMyMerchants = async (req: any, res: Response): Promise<void> => {
  try {
    const ownerId = req.user.id;
    const [rows] = await pool.query(
      'SELECT * FROM merchants WHERE owner_id = ? ORDER BY updated_at DESC',
      [ownerId]
    );
    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error('Get my merchants error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching your merchants' });
  }
};

export const createMerchant = async (req: any, res: Response): Promise<void> => {
  try {
    const ownerId = req.user.id;
    const { name, address, phone, category, business_hours, latitude, longitude, cover_image_url, description } = req.body;

    if (!name || !address || !category) {
      res.status(400).json({ success: false, message: 'name, address, category are required' });
      return;
    }

    const [result] = await pool.query(
      `INSERT INTO merchants (name, address, phone, category, business_hours, latitude, longitude, cover_image_url, description, owner_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      , [
        name,
        address,
        phone || null,
        category,
        business_hours || null,
        typeof latitude === 'number' ? latitude : (latitude ? Number(latitude) : null),
        typeof longitude === 'number' ? longitude : (longitude ? Number(longitude) : null),
        cover_image_url || null,
        description || null,
        ownerId
      ]
    );

    res.status(201).json({ success: true, message: 'Merchant created', data: result });
  } catch (error) {
    console.error('Create merchant error:', error);
    res.status(500).json({ success: false, message: 'Server error creating merchant' });
  }
};

export const updateMerchant = async (req: any, res: Response): Promise<void> => {
  try {
    const ownerId = req.user.id;
    const role = req.user.role;
    const { id } = req.params;
    const { name, address, phone, category, business_hours, latitude, longitude, cover_image_url, description } = req.body;

    const [rows] = await pool.query('SELECT id, owner_id FROM merchants WHERE id = ?', [id]);
    const list = rows as any[];
    if (list.length === 0) {
      res.status(404).json({ success: false, message: 'Merchant not found' });
      return;
    }
    if (role !== 'admin' && list[0].owner_id !== ownerId) {
      res.status(403).json({ success: false, message: 'You are not the owner of this merchant' });
      return;
    }

    await pool.query(
      `UPDATE merchants SET
        name = COALESCE(?, name),
        address = COALESCE(?, address),
        phone = COALESCE(?, phone),
        category = COALESCE(?, category),
        business_hours = COALESCE(?, business_hours),
        latitude = COALESCE(?, latitude),
        longitude = COALESCE(?, longitude),
        cover_image_url = COALESCE(?, cover_image_url),
        description = COALESCE(?, description),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        name || null,
        address || null,
        phone || null,
        category || null,
        business_hours || null,
        latitude === undefined ? null : (latitude === null ? null : Number(latitude)),
        longitude === undefined ? null : (longitude === null ? null : Number(longitude)),
        cover_image_url || null,
        description || null,
        id
      ]
    );

    res.status(200).json({ success: true, message: 'Merchant updated' });
  } catch (error) {
    console.error('Update merchant error:', error);
    res.status(500).json({ success: false, message: 'Server error updating merchant' });
  }
};

export const addMerchantPhoto = async (req: any, res: Response): Promise<void> => {
  try {
    const userId = req.user.id
    const role = req.user.role
    const { id: merchantId } = req.params
    const { photo_url } = req.body

    const url = String(photo_url || '').trim()
    if (!url) {
      res.status(400).json({ success: false, message: 'photo_url is required' })
      return
    }

    const [rows] = await pool.query('SELECT id, owner_id FROM merchants WHERE id = ?', [merchantId])
    const list = rows as any[]
    if (list.length === 0) {
      res.status(404).json({ success: false, message: 'Merchant not found' })
      return
    }
    if (role !== 'admin' && list[0].owner_id !== userId) {
      res.status(403).json({ success: false, message: 'You are not the owner of this merchant' })
      return
    }

    const [result] = await pool.query(
      'INSERT INTO merchant_photos (merchant_id, photo_url, uploaded_by) VALUES (?, ?, ?)',
      [Number(merchantId), url, userId],
    )

    res.status(201).json({ success: true, id: (result as any)?.insertId })
  } catch (error) {
    console.error('Add merchant photo error:', error)
    res.status(500).json({ success: false, message: 'Server error adding photo' })
  }
}

export const deleteMerchantPhoto = async (req: any, res: Response): Promise<void> => {
  try {
    const userId = req.user.id
    const role = req.user.role
    const { id: merchantId, photoId } = req.params

    const [rows] = await pool.query('SELECT id, owner_id FROM merchants WHERE id = ?', [merchantId])
    const list = rows as any[]
    if (list.length === 0) {
      res.status(404).json({ success: false, message: 'Merchant not found' })
      return
    }
    if (role !== 'admin' && list[0].owner_id !== userId) {
      res.status(403).json({ success: false, message: 'You are not the owner of this merchant' })
      return
    }

    const [photoRows] = await pool.query(
      'SELECT id FROM merchant_photos WHERE id = ? AND merchant_id = ? LIMIT 1',
      [photoId, merchantId],
    )
    if (!(photoRows as any[]).length) {
      res.status(404).json({ success: false, message: 'Photo not found' })
      return
    }

    const [result] = await pool.query(
      'DELETE FROM merchant_photos WHERE id = ? AND merchant_id = ?',
      [photoId, merchantId],
    )

    res.status(200).json({ success: true, deleted: (result as any)?.affectedRows ?? 0 })
  } catch (error) {
    console.error('Delete merchant photo error:', error)
    res.status(500).json({ success: false, message: 'Server error deleting photo' })
  }
}
