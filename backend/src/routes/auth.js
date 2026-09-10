import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db, memoryDb, getNextId } from '../db/connection.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'campusbite_secret_jwt_2026';

// Middleware to verify JWT token
export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, decodedUser) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Invalid or expired token' });
    }
    req.user = decodedUser;
    next();
  });
}

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    let user = null;
    let studentProfile = null;

    if (db.isMysqlActive()) {
      const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
      if (users.length > 0) {
        user = users[0];
        const [profiles] = await db.query('SELECT * FROM student_profiles WHERE user_id = ?', [user.id]);
        if (profiles.length > 0) studentProfile = profiles[0];
      }
    } else {
      user = memoryDb.users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (user) {
        studentProfile = memoryDb.student_profiles.find(p => p.user_id === user.id) || null;
      }
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid institutional credentials' });
    }

    // Check password (allow 'password123' directly or bcrypt compare)
    const isPasswordValid = password === 'password123' || bcrypt.compareSync(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Invalid institutional credentials' });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        full_name: user.full_name
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      message: 'Authentication successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        full_name: user.full_name,
        phone: user.phone
      },
      student_profile: studentProfile
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Internal server error during login' });
  }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, full_name, phone, roll_number, department, hostel_block, room_number } = req.body;

    if (!email || !password || !full_name || !roll_number) {
      return res.status(400).json({ success: false, message: 'Email, password, full name and roll number are required' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    if (db.isMysqlActive()) {
      const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
      if (existing.length > 0) {
        return res.status(400).json({ success: false, message: 'Institutional email already registered' });
      }

      const [userResult] = await db.query(
        'INSERT INTO users (email, password_hash, role, full_name, phone) VALUES (?, ?, ?, ?, ?)',
        [email, hashedPassword, 'student', full_name, phone || '']
      );
      const newUserId = userResult.insertId;

      await db.query(
        'INSERT INTO student_profiles (user_id, roll_number, department, hostel_block, room_number) VALUES (?, ?, ?, ?, ?)',
        [newUserId, roll_number, department || 'General', hostel_block || 'Hostel 1', room_number || '101']
      );

      // Initialize wallet
      await db.query('INSERT INTO wallets (user_id, balance) VALUES (?, 100.00)', [newUserId]);

      const token = jwt.sign({ id: newUserId, email, role: 'student', full_name }, JWT_SECRET, { expiresIn: '7d' });
      return res.status(201).json({
        success: true,
        message: 'Account registered successfully',
        token,
        user: { id: newUserId, email, role: 'student', full_name }
      });
    } else {
      if (memoryDb.users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
        return res.status(400).json({ success: false, message: 'Institutional email already registered' });
      }

      const newUserId = getNextId('users');
      const newUser = {
        id: newUserId,
        email,
        password_hash: hashedPassword,
        role: 'student',
        full_name,
        phone: phone || '',
        is_active: 1,
        created_at: new Date()
      };
      memoryDb.users.push(newUser);

      const profile = {
        id: getNextId('student_profiles'),
        user_id: newUserId,
        roll_number,
        department: department || 'General Engineering',
        hostel_block: hostel_block || 'Hostel Block 4',
        room_number: room_number || '204'
      };
      memoryDb.student_profiles.push(profile);

      // Seed student wallet with welcome bonus ₹100
      memoryDb.wallets.push({
        id: getNextId('wallets'),
        user_id: newUserId,
        balance: 100.00,
        is_locked: 0,
        updated_at: new Date()
      });

      const token = jwt.sign({ id: newUserId, email, role: 'student', full_name }, JWT_SECRET, { expiresIn: '7d' });
      return res.status(201).json({
        success: true,
        message: 'Student enrolled successfully with ₹100 Welcome Wallet credit!',
        token,
        user: { id: newUserId, email, role: 'student', full_name },
        student_profile: profile
      });
    }
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Server error during student registration' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req, res) => {
  try {
    let user = null;
    let profile = null;
    let wallet = null;

    if (db.isMysqlActive()) {
      const [users] = await db.query('SELECT id, email, role, full_name, phone FROM users WHERE id = ?', [req.user.id]);
      user = users[0] || null;
      if (user) {
        const [profiles] = await db.query('SELECT * FROM student_profiles WHERE user_id = ?', [user.id]);
        profile = profiles[0] || null;
        const [wallets] = await db.query('SELECT * FROM wallets WHERE user_id = ?', [user.id]);
        wallet = wallets[0] || null;
      }
    } else {
      user = memoryDb.users.find(u => u.id === req.user.id) || null;
      if (user) {
        profile = memoryDb.student_profiles.find(p => p.user_id === user.id) || null;
        wallet = memoryDb.wallets.find(w => w.user_id === user.id) || null;
      }
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        full_name: user.full_name,
        phone: user.phone
      },
      student_profile: profile,
      wallet: wallet ? { balance: Number(wallet.balance), is_locked: Boolean(wallet.is_locked) } : null
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/auth/demo-accounts (for 1-click test fill)
router.get('/demo-accounts', (req, res) => {
  res.json({
    success: true,
    student: {
      email: 'student.demo@campusbite.edu',
      password: 'password123',
      label: 'Aarav Patel (Student - CSE Dept)'
    },
    kitchen: {
      email: 'admin.kitchen@campusbite.edu',
      password: 'password123',
      label: 'Chef Vikram Sharma (Kitchen Staff)'
    }
  });
});

export default router;
