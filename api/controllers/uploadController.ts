import { Request, Response } from 'express';
import pool from '../config/db.js';

export const uploadPhoto = async (req: any, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'No file uploaded' });
      return;
    }

    const { merchant_id } = req.body;
    const user_id = req.user.id;
    
    // Check if merchant exists if provided
    if (merchant_id) {
      const [merchants] = await pool.query('SELECT id FROM merchants WHERE id = ?', [merchant_id]);
      if ((merchants as any[]).length === 0) {
        res.status(404).json({ success: false, message: 'Merchant not found' });
        return;
      }
    }

    // The file is saved in the 'uploads/' directory by multer
    // We construct the URL path to access it
    const photoUrl = `/uploads/${req.file.filename}`;

    // If merchant_id is provided, save it to merchant_photos table
    if (merchant_id) {
      await pool.query(
        'INSERT INTO merchant_photos (merchant_id, photo_url, uploaded_by) VALUES (?, ?, ?)',
        [merchant_id, photoUrl, user_id]
      );
    }

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      url: photoUrl
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, message: 'Server error during upload' });
  }
};
