# 🍔 CampusBite — Automated Campus Canteen Food Ordering & Kitchen Operations Platform

CampusBite is a production-ready university dining ecosystem built with **React (Vite) + Tailwind CSS**, **Node.js Express REST APIs**, and a **Real-Time WebSocket (`ws://`) Pub/Sub Server** backed by a 21-table MySQL relational architecture (with zero-configuration automatic fallback).

---

## ⚡ Quick Start

### 1. Start the Backend API & WebSocket Server
```bash
cd backend
npm install
npm start
# Server boots up on http://localhost:5000
# WebSocket listening on ws://localhost:5000/ws/orders
```

### 2. Start the Frontend Application
```bash
cd frontend
npm install
npm run dev
# Vite dev server boots up on http://localhost:3000
```

Open `http://localhost:3000` in your web browser.

---

## 🔑 Pre-Configured Test Credentials & 1-Click Personas

| Role | Institutional Email | Password | Persona Details |
|------|---------------------|----------|-----------------|
| **Student** | `student.demo@campusbite.edu` | `password123` | **Aarav Patel** • CSE Dept • Hostel Block 4, Room 302 • Campus Wallet ₹340.00 |
| **Kitchen Staff** | `admin.kitchen@campusbite.edu` | `password123` | **Chef Vikram Sharma** • Executive Kitchen Chef • Station: Tawa 2 |
| **Admin** | `admin@campusbite.edu` | `password123` | **Campus Canteen Manager** • Food Safety Admin |

> 💡 *Tip: On the frontend login screen and top navbar, use the **1-Click Quick Demo Switcher** (`👨‍🎓 Student` / `👨‍🍳 Kitchen`) to immediately switch personas without typing.*

---

## 🏗️ Technical Highlights

1. **21 Relational MySQL Tables**:
   - `users`, `student_profiles`, `categories`, `food_items`, `pickup_slots`, `carts`, `cart_items`, `orders`, `order_items`, `wallets`, `wallet_transactions`, `payments`, `meal_plans`, `meal_subscriptions`, `inventory`, `discounts`, `feedback`, `grievances`, `notifications`, `upi_withdrawals`, `daily_specials`.
   - Complete foreign keys, cascading deletions, and transactional consistency.
   - Built-in resilient memory store fallback when local MySQL is offline so the app runs out-of-the-box.

2. **Statutory Tax Invoice (Section 31 CGST Act)**:
   - Header with GSTIN (`07AAATC9012E1Z8`) and FSSAI License (`#1001902200987`).
   - Detailed statutory computation: Subtotal, `HACK50` discount (-₹50.00 for orders ≥ ₹199), Student Welfare Subsidy (-₹8.00), CGST 2.5%, SGST 2.5%, and Eco-friendly Packaging (₹5.00).
   - Printable `@media print` CSS view with native Canvas Code-128 Barcode and QR Code tokens.

3. **Live Telemetry & Real-Time WebSockets (`ws://`)**:
   - 4-stage pipeline tracker (`PLACED` → `ACCEPTED` → `PREPARING` → `READY` → `COMPLETED`).
   - Web Audio API synthesizer buzzer and chime alerting the student when the order is `READY`.
   - 2-Minute cancellation SLA window with instant, 100% automated digital wallet refund.

4. **Kitchen Operations (KOT) Kanban Board**:
   - 4 Kanban columns (`Incoming`, `Cooking`, `At Counter`, `Archived`).
   - Emergency **86 Stock Kill-Switches** to disable dishes out-of-stock in real time.
   - Rush Throttle button broadcasting +5m preparation delay announcements to student screens.

5. **Student Dining Finance**:
   - Active 7-Day Sprint Booster progress tracker (10/14 meals used).
   - Itemized audit ledger with transaction filtering (`ALL`, `FOOD_ORDER`, `SUBSIDY`, `REFUND`, `TOPUP`).
   - Instant zero-fee UPI bank payout withdrawal modal to student VPA in < 60 seconds.
