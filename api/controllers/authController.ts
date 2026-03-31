import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';
import crypto from 'crypto';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name, phone, role = 'user' } = req.body;

    if (!email || !password || !name) {
      res.status(400).json({ success: false, message: 'Please provide email, password and name' });
      return;
    }

    // Check if user already exists
    const [existingUsers] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (Array.isArray(existingUsers) && existingUsers.length > 0) {
      res.status(400).json({ success: false, message: 'User already exists with this email' });
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insert user
    const [result] = await pool.query(
      'INSERT INTO users (email, password_hash, name, phone, role) VALUES (?, ?, ?, ?, ?)',
      [email, passwordHash, name, phone, role]
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully'
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Server error during registration' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Please provide email and password' });
      return;
    }

    // Find user
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    const userList = users as any[];

    if (userList.length === 0) {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
      return;
    }

    const user = userList[0];

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
      return;
    }

    // Generate token
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || 'your_super_secret_key_change_in_production',
      { expiresIn: '24h' }
    );

    // Don't send password hash back
    const { password_hash, ...userWithoutPassword } = user;

    res.status(200).json({
      success: true,
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
};

export const getProfile = async (req: any, res: Response): Promise<void> => {
  try {
    const userId = req.user.id;
    const [users] = await pool.query('SELECT id, email, name, phone, role, created_at FROM users WHERE id = ?', [userId]);
    const userList = users as any[];

    if (userList.length === 0) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    res.status(200).json({
      success: true,
      user: userList[0]
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error getting profile' });
  }
};

export const updateProfile = async (req: any, res: Response): Promise<void> => {
  try {
    const userId = req.user.id;
    const { name, phone } = req.body;

    if (!name) {
      res.status(400).json({ success: false, message: 'name is required' });
      return;
    }

    await pool.query('UPDATE users SET name = ?, phone = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [
      name,
      phone || null,
      userId
    ]);

    const [users] = await pool.query('SELECT id, email, name, phone, role, created_at FROM users WHERE id = ?', [userId]);
    const userList = users as any[];
    res.status(200).json({ success: true, user: userList[0] });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'Server error updating profile' });
  }
};

export const requestOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone } = req.body;
    if (!phone) {
      res.status(400).json({ success: false, message: 'phone is required' });
      return;
    }
    const normalized = String(phone).trim();
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = Date.now() + 5 * 60 * 1000;

    await pool.query('DELETE FROM auth_otps WHERE phone = ?', [normalized]);
    await pool.query('INSERT INTO auth_otps (phone, code_hash, expires_at) VALUES (?, ?, ?)', [normalized, codeHash, expiresAt]);

    const isProd = (process.env.NODE_ENV || 'development') === 'production';
    res.status(200).json({
      success: true,
      message: 'OTP sent',
      ...(isProd ? {} : { code })
    });
  } catch (error) {
    console.error('Request OTP error:', error);
    res.status(500).json({ success: false, message: 'Server error requesting OTP' });
  }
};

export const loginWithOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone, code } = req.body;
    if (!phone || !code) {
      res.status(400).json({ success: false, message: 'phone and code are required' });
      return;
    }
    const normalized = String(phone).trim();
    const [rows] = await pool.query('SELECT * FROM auth_otps WHERE phone = ?', [normalized]);
    const list = rows as any[];
    if (list.length === 0) {
      res.status(400).json({ success: false, message: 'OTP not found, please request again' });
      return;
    }
    const otp = list[0];
    if (Number(otp.expires_at) < Date.now()) {
      await pool.query('DELETE FROM auth_otps WHERE phone = ?', [normalized]);
      res.status(400).json({ success: false, message: 'OTP expired, please request again' });
      return;
    }
    const ok = await bcrypt.compare(String(code), otp.code_hash);
    if (!ok) {
      res.status(400).json({ success: false, message: 'Invalid OTP code' });
      return;
    }
    await pool.query('DELETE FROM auth_otps WHERE phone = ?', [normalized]);

    const [usersByPhone] = await pool.query('SELECT * FROM users WHERE phone = ?', [normalized]);
    let user = (usersByPhone as any[])[0];
    if (!user) {
      const digits = normalized.replace(/[^0-9]/g, '');
      const suffix = digits.slice(-4) || crypto.randomBytes(2).toString('hex');
      const email = `otp_${digits || normalized.replace(/\W/g, '')}@local`; 
      const name = `用户${suffix}`;
      const passwordHash = await bcrypt.hash(crypto.randomBytes(12).toString('hex'), 10);
      await pool.query(
        'INSERT INTO users (email, password_hash, name, phone, role) VALUES (?, ?, ?, ?, ?)',
        [email, passwordHash, name, normalized, 'user']
      );
      const [created] = await pool.query('SELECT * FROM users WHERE phone = ? ORDER BY id DESC LIMIT 1', [normalized]);
      user = (created as any[])[0];
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || 'your_super_secret_key_change_in_production',
      { expiresIn: '24h' }
    );

    const { password_hash, ...userWithoutPassword } = user;
    res.status(200).json({ success: true, token, user: userWithoutPassword });
  } catch (error) {
    console.error('Login OTP error:', error);
    res.status(500).json({ success: false, message: 'Server error during OTP login' });
  }
};

export const updateAvatarUrl = async (req: any, res: Response): Promise<void> => {
  try {
    const userId = req.user.id;
    const { avatar_url } = req.body;
    if (!avatar_url) {
      res.status(400).json({ success: false, message: 'avatar_url is required' });
      return;
    }
    await pool.query('UPDATE users SET avatar_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [avatar_url, userId]);
    const [users] = await pool.query('SELECT id, email, name, phone, role, avatar_url, created_at FROM users WHERE id = ?', [userId]);
    res.status(200).json({ success: true, user: (users as any[])[0] });
  } catch (error) {
    console.error('Update avatar error:', error);
    res.status(500).json({ success: false, message: 'Server error updating avatar' });
  }
};
