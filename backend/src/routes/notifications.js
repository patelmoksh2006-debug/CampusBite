import express from 'express';
import jwt from 'jsonwebtoken';
import { db, memoryDb } from '../db/connection.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'campusbite_secret_jwt_2026';

function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    req.user = { id: 1, role: 'student' };
    return next();
  }
  jwt.verify(token, JWT_SECRET, (err, decodedUser) => {
    if (err) {
      req.user = { id: 1, role: 'student' };
    } else {
      req.user = decodedUser;
    }
    next();
  });
}

// GET /api/notifications
router.get('/', optionalAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    let list = [];

    if (db.isMysqlActive()) {
      const [rows] = await db.query('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 15', [userId]);
      list = rows;
    } else {
      list = memoryDb.notifications.filter(n => n.user_id === userId);
      if (list.length === 0) {
        list = [
          {
            id: 1,
            user_id: userId,
            title: '🔔 Your Canteen Order is READY for Pickup!',
            message: 'Piping hot & packaged at Counter 2 (Express)! Flash verification PIN 8942.',
            channel: 'IN_APP',
            is_read: 0,
            created_at: new Date(Date.now() - 3 * 60 * 1000)
          },
          {
            id: 2,
            user_id: userId,
            title: 'Order Cooking at Stations!',
            message: 'Tawa 2 sizzle active! Rotis on flame & Paneer simmering in cashew gravy.',
            channel: 'IN_APP',
            is_read: 1,
            created_at: new Date(Date.now() - 8 * 60 * 1000)
          },
          {
            id: 3,
            user_id: userId,
            title: '🎉 +25 Campus Karma Awarded',
            message: 'Thanks for rating Chef Vikram Sharma. Karma credited to your profile.',
            channel: 'IN_APP',
            is_read: 1,
            created_at: new Date(Date.now() - 60 * 60 * 1000)
          }
        ];
      }
    }

    res.json({
      success: true,
      unreadCount: list.filter(n => !n.is_read).length,
      notifications: list
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/notifications/mark-all-read
router.patch('/mark-all-read', optionalAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    if (db.isMysqlActive()) {
      await db.query('UPDATE notifications SET is_read = TRUE WHERE user_id = ?', [userId]);
    } else {
      memoryDb.notifications.forEach(n => {
        if (n.user_id === userId) n.is_read = 1;
      });
    }
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
