import express from 'express';
import { memoryDb } from '../db/connection.js';

const router = express.Router();

// In-memory store for live active group orders
const activeGroups = new Map();

// Seed initial demo group order for Hostel Room 402
activeGroups.set('HOSTEL-402', {
  code: 'HOSTEL-402',
  hostName: 'Aarav Patel (Room 302)',
  hostelBlock: 'Hostel Block 4',
  createdAt: new Date(),
  status: 'OPEN',
  members: ['Aarav Patel', 'Rohan Verma', 'Kunal Shah'],
  items: [
    { id: 1, food_id: 1, name: 'Paneer Butter Masala Thali', price: 70.0, addedBy: 'Aarav Patel', quantity: 1 },
    { id: 2, food_id: 2, name: 'Crispy Masala Dosa', price: 70.0, addedBy: 'Rohan Verma', quantity: 1 },
    { id: 3, food_id: 3, name: 'Cold Coffee with Ice Cream', price: 40.0, addedBy: 'Kunal Shah', quantity: 2 }
  ]
});

// POST /api/group/create
router.post('/create', (req, res) => {
  const { hostName = 'Aarav Patel', hostelBlock = 'Hostel Block 4' } = req.body;
  const roomNum = Math.floor(100 + Math.random() * 900);
  const code = `ROOM-${roomNum}`;

  const group = {
    code,
    hostName,
    hostelBlock,
    createdAt: new Date(),
    status: 'OPEN',
    members: [hostName],
    items: []
  };

  activeGroups.set(code, group);
  res.status(201).json({ success: true, message: `Group Order Room ${code} created!`, group });
});

// GET /api/group/:code
router.get('/:code', (req, res) => {
  const code = req.params.code.toUpperCase();
  const group = activeGroups.get(code);

  if (!group) {
    return res.status(404).json({ success: false, message: `Group room ${code} not found.` });
  }

  const subtotal = group.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  res.json({
    success: true,
    group: {
      ...group,
      totalItemsCount: group.items.reduce((sum, i) => sum + i.quantity, 0),
      subtotalAmount: Number(subtotal.toFixed(2))
    }
  });
});

// POST /api/group/join
router.post('/join', (req, res) => {
  const { code, memberName } = req.body;
  if (!code || !memberName) {
    return res.status(400).json({ success: false, message: 'Room code and your name are required' });
  }

  const group = activeGroups.get(code.toUpperCase());
  if (!group) {
    return res.status(404).json({ success: false, message: 'Room code does not exist' });
  }

  if (!group.members.includes(memberName)) {
    group.members.push(memberName);
  }

  res.json({ success: true, message: `Joined group room ${group.code}`, group });
});

// POST /api/group/add-item
router.post('/add-item', (req, res) => {
  const { code, food_id, name, price, addedBy = 'Student', quantity = 1 } = req.body;
  const group = activeGroups.get(code?.toUpperCase());

  if (!group) {
    return res.status(404).json({ success: false, message: 'Group room not found' });
  }

  group.items.push({
    id: Date.now(),
    food_id,
    name,
    price: Number(price),
    addedBy,
    quantity: Number(quantity)
  });

  res.json({ success: true, message: `Added ${name} to group tray!`, group });
});

export default router;
