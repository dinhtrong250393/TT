import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db';

import { syncAccountsFromGoogleSheets } from '../services/googleSheets';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-for-dev';

// Sync accounts from Google Sheets
router.post('/sync', async (req, res) => {
  const result = await syncAccountsFromGoogleSheets();
  if (result.success) {
    res.json({ message: `Đồng bộ thành công ${result.count} tài khoản` });
  } else {
    res.status(500).json({ error: 'Lỗi đồng bộ dữ liệu' });
  }
});

// Login route
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  try {
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any;

    if (!user) {
      return res.status(401).json({ error: 'Tài khoản không tồn tại' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ error: 'Tài khoản đã bị khóa' });
    }

    const validPassword = bcrypt.compareSync(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Mật khẩu không đúng' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, fullName: user.full_name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.full_name,
        role: user.role,
        class: user.class
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống' });
  }
});

// Get current user
router.get('/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = db.prepare('SELECT id, username, full_name, role, class, status FROM users WHERE id = ?').get(decoded.id) as any;
    
    if (!user || user.status !== 'active') {
      return res.status(401).json({ error: 'User not found or inactive' });
    }

    res.json({ user });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;
