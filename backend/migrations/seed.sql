-- CampusBite Seed Data and Realistic University Canteen Fixtures
USE campusbite_db;

-- Demo Users (Password: 'password123' bcrypt hash)
-- bcrypt hash for 'password123': $2a$10$rN8iA7cEv3.O/4JvC2P5se5o5/R7qG1JtVbHl8126G6PzF/lWz.C6
INSERT INTO users (id, email, password_hash, role, full_name, phone, is_active) VALUES
(1, 'student.demo@campusbite.edu', '$2a$10$rN8iA7cEv3.O/4JvC2P5se5o5/R7qG1JtVbHl8126G6PzF/lWz.C6', 'student', 'Aarav Patel', '+91 98765 43210'),
(2, 'admin.kitchen@campusbite.edu', '$2a$10$rN8iA7cEv3.O/4JvC2P5se5o5/R7qG1JtVbHl8126G6PzF/lWz.C6', 'kitchen_staff', 'Chef Vikram Sharma', '+91 91234 56789'),
(3, 'admin@campusbite.edu', '$2a$10$rN8iA7cEv3.O/4JvC2P5se5o5/R7qG1JtVbHl8126G6PzF/lWz.C6', 'admin', 'Campus Canteen Manager', '+91 98111 22233')
ON DUPLICATE KEY UPDATE full_name=VALUES(full_name);

INSERT INTO student_profiles (id, user_id, roll_number, department, hostel_block, room_number) VALUES
(1, 1, '2022CS8942', 'Computer Science & Engineering', 'Hostel Block 4', '302')
ON DUPLICATE KEY UPDATE department=VALUES(department);

-- Student Wallet with initial balance ₹340.00
INSERT INTO wallets (id, user_id, balance, is_locked) VALUES
(1, 1, 340.00, FALSE)
ON DUPLICATE KEY UPDATE balance=VALUES(balance);

-- Categories
INSERT INTO categories (id, name, slug, display_order, is_active) VALUES
(1, 'Thali & Meals', 'thali-meals', 1, TRUE),
(2, 'South Indian Express', 'south-indian', 2, TRUE),
(3, 'Breakfast & Snacks', 'snacks', 3, TRUE),
(4, 'Beverages', 'beverages', 4, TRUE),
(5, 'Chinese & Wok', 'chinese-wok', 5, TRUE)
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Food Items
INSERT INTO food_items (id, category_id, name, description, price, is_veg, is_jain, prep_time_mins, calories, spice_level, current_stock, is_available, station_name, image_url) VALUES
(1, 1, 'Paneer Butter Masala Thali', 'Special cashew tomato gravy, 3 Butter Rotis, Jeera Rice, Dal Tadka, Salad & Gulab Jamun', 70.00, TRUE, FALSE, 8, 520, 2, 25, TRUE, 'Tawa 2', 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&auto=format&fit=crop&q=80'),
(2, 2, 'Crispy Masala Dosa', 'Golden Ghee Roast, Spiced potato filling, Fresh Coconut Chutney & Sambhar', 70.00, TRUE, TRUE, 6, 310, 1, 30, TRUE, 'Tawa 2', 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600&auto=format&fit=crop&q=80'),
(3, 4, 'Cold Coffee with Ice Cream', 'Chilled brewed blend topped with vanilla scoop', 40.00, TRUE, TRUE, 3, 220, 0, 18, TRUE, 'Beverages / Bar', 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=600&auto=format&fit=crop&q=80'),
(4, 1, 'Rajma Chawal Executive Bowl', 'Slow-cooked Punjabi style red kidney beans, fragrant steamed basmati rice, onion pickle & papad', 65.00, TRUE, FALSE, 5, 410, 2, 40, TRUE, 'Main Kitchen', 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80'),
(5, 2, 'Steamed Idli Sambhar (2 Pcs)', 'Puffy soft fermented rice cakes with spicy drumstick sambhar and tomato chutney', 45.00, TRUE, TRUE, 4, 180, 1, 35, TRUE, 'Steam Station', 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80'),
(6, 3, 'Mumbai Pav Bhaji (2 Butter Pav)', 'Mashed spiced vegetable curry with dollop of Amul butter & toasted buttery pavs', 65.00, TRUE, FALSE, 7, 440, 3, 20, TRUE, 'Tawa 1', 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=600&auto=format&fit=crop&q=80'),
(7, 3, 'Crispy Samosa Chaat (2 Pcs)', 'Crushed potato samosas topped with curd, tamarind chutney, mint chutney and sev', 45.00, TRUE, FALSE, 5, 340, 2, 28, TRUE, 'Snack Counter', 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80'),
(8, 4, 'Desi Masala Chai (Kadak)', 'Slow-simmered Assam tea leaves with fresh crushed ginger and green cardamom', 15.00, TRUE, TRUE, 2, 75, 0, 100, TRUE, 'Beverages / Bar', 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80'),
(9, 5, 'Veg Hakka Noodles & Manchurian', 'Wok-tossed noodles with crunchy bell peppers and crisp vegetable manchurian balls', 85.00, TRUE, FALSE, 9, 480, 2, 22, TRUE, 'Wok Express', 'https://images.unsplash.com/photo-1617093727343-374698b1b08d?w=600&auto=format&fit=crop&q=80')
ON DUPLICATE KEY UPDATE name=VALUES(name), price=VALUES(price);

-- Inventory (86 Kill Switches and real-time tracking)
INSERT INTO inventory (food_item_id, current_stock, low_stock_threshold, is_86_killed) VALUES
(1, 25, 5, FALSE),
(2, 30, 5, FALSE),
(3, 18, 5, FALSE),
(4, 40, 8, FALSE),
(5, 35, 6, FALSE),
(6, 20, 5, FALSE),
(7, 28, 5, FALSE),
(8, 100, 15, FALSE),
(9, 22, 5, FALSE)
ON DUPLICATE KEY UPDATE current_stock=VALUES(current_stock);

-- Pickup Slots
INSERT INTO pickup_slots (id, slot_label, start_time, end_time, max_capacity, current_load, is_active) VALUES
(1, '1:00 PM - 1:15 PM (Pre-rush)', '13:00:00', '13:15:00', 40, 12, TRUE),
(2, '1:15 PM - 1:30 PM (Lunch Break)', '13:15:00', '13:30:00', 50, 28, TRUE),
(3, '1:30 PM - 1:45 PM (Peak Window)', '13:30:00', '13:45:00', 50, 44, TRUE),
(4, '1:45 PM - 2:00 PM (Post-rush)', '13:45:00', '14:00:00', 40, 16, TRUE),
(5, '5:00 PM - 5:30 PM (Evening Snacks)', '17:00:00', '17:30:00', 60, 15, TRUE)
ON DUPLICATE KEY UPDATE slot_label=VALUES(slot_label);

-- Coupons & Discounts
INSERT INTO discounts (id, code, min_order_amount, discount_value, is_percentage, is_active) VALUES
(1, 'HACK50', 199.00, 50.00, FALSE, TRUE),
(2, 'CAMPUS20', 100.00, 20.00, FALSE, TRUE),
(3, 'FIRSTBITE', 150.00, 30.00, FALSE, TRUE)
ON DUPLICATE KEY UPDATE discount_value=VALUES(discount_value);

-- Meal Plans
INSERT INTO meal_plans (id, title, duration_days, meals_per_day, price, daily_rate_equivalent, allows_cash_rollover, is_active) VALUES
(1, '7-Day Exam Sprint Booster', 7, 2, 840.00, 120.00, TRUE, TRUE),
(2, 'Monthly Scholar All-Access', 30, 3, 3499.00, 116.00, TRUE, TRUE),
(3, 'Flexi Snack & Beverage Pass', 30, 1, 499.00, 16.60, TRUE, TRUE)
ON DUPLICATE KEY UPDATE price=VALUES(price);

-- Active Subscription for demo student
INSERT INTO meal_subscriptions (id, user_id, meal_plan_id, total_meals_allowance, meals_consumed, start_date, end_date, is_paused, status) VALUES
(1, 1, 1, 14, 10, CURDATE() - INTERVAL 3 DAY, CURDATE() + INTERVAL 4 DAY, FALSE, 'ACTIVE')
ON DUPLICATE KEY UPDATE total_meals_allowance=VALUES(total_meals_allowance);

-- Daily Specials
INSERT INTO daily_specials (id, title, description, special_price, original_price, banner_tag, is_active) VALUES
(1, 'Chef’s Royal Shahi Thali Combo', 'Paneer Butter Masala, Gulab Jamun, 3 Butter Tawa Rotis, Veg Biryani + Chilled Jaljeera', 99.00, 140.00, 'CHEF SPECIAL 30% OFF', TRUE),
(2, 'Exam Cram Power Breakfast', 'Crispy Masala Dosa + Filter Coffee + Extra Coconut Chutney Cup', 75.00, 110.00, 'MORNING SPECIAL', TRUE),
(3, 'Monsoon Snack Pack', '2 Crispy Samosas with Tangy Chutneys + Kadak Ginger Tea', 35.00, 50.00, 'CAMPUS HIT', TRUE)
ON DUPLICATE KEY UPDATE special_price=VALUES(special_price);

-- Sample Initial Orders for demo tracking & KOT board
INSERT INTO orders (id, order_token, security_pin, user_id, pickup_slot_id, counter_assigned, subtotal_amount, discount_amount, subsidy_amount, cgst_amount, sgst_amount, packaging_fee, final_amount, status, special_instructions) VALUES
(1, '#TOKEN-412', '8942', 1, 2, 'Counter 2 (Express)', 210.00, 50.00, 8.00, 3.80, 3.80, 5.00, 164.60, 'PREPARING', 'Extra green chutney and less oil on roti please'),
(2, '#TOKEN-413', '4192', 1, 2, 'Counter 1', 140.00, 0.00, 8.00, 3.30, 3.30, 5.00, 143.60, 'PLACED', 'Pack spoons'),
(3, '#TOKEN-409', '7721', 1, 1, 'Counter 3', 85.00, 0.00, 0.00, 2.12, 2.12, 5.00, 94.24, 'READY', 'No onion, Jain style'),
(4, '#TOKEN-395', '1033', 1, 1, 'Counter 2 (Express)', 180.00, 0.00, 8.00, 4.30, 4.30, 5.00, 185.60, 'COMPLETED', 'Completed lunch')
ON DUPLICATE KEY UPDATE order_token=VALUES(order_token);

INSERT INTO order_items (id, order_id, food_item_id, quantity, unit_price, subtotal) VALUES
(1, 1, 1, 1, 70.00, 70.00),
(2, 1, 2, 2, 70.00, 140.00),
(3, 2, 2, 2, 70.00, 140.00),
(4, 3, 9, 1, 85.00, 85.00),
(5, 4, 1, 2, 70.00, 140.00),
(6, 4, 3, 1, 40.00, 40.00)
ON DUPLICATE KEY UPDATE quantity=VALUES(quantity);

-- Payments for seeded orders
INSERT INTO payments (id, order_id, payment_method, transaction_ref, amount, payment_status) VALUES
(1, 1, 'WALLET', 'CB-TXN-9842019', 164.60, 'SUCCESS'),
(2, 2, 'WALLET', 'CB-TXN-9842020', 143.60, 'SUCCESS'),
(3, 3, 'UPI', 'CB-TXN-9842021', 94.24, 'SUCCESS'),
(4, 4, 'WALLET', 'CB-TXN-9842018', 185.60, 'SUCCESS')
ON DUPLICATE KEY UPDATE transaction_ref=VALUES(transaction_ref);

-- Wallet transactions audit log
INSERT INTO wallet_transactions (id, wallet_id, order_id, amount, transaction_type, category, reference_note, post_balance) VALUES
(1, 1, NULL, 500.00, 'CREDIT', 'TOPUP', 'Campus Card Auto-Reload', 500.00),
(2, 1, 4, 185.60, 'DEBIT', 'FOOD_ORDER', 'Order #TOKEN-395 Payment', 314.40),
(3, 1, NULL, 200.00, 'CREDIT', 'TOPUP', 'UPI Quick Topup (GPay)', 514.40),
(4, 1, 1, 164.60, 'DEBIT', 'FOOD_ORDER', 'Order #TOKEN-412 Payment (HACK50 applied)', 349.80),
(5, 1, NULL, 8.00, 'CREDIT', 'SUBSIDY', 'Univ Student Welfare Food Subsidy Credit', 357.80)
ON DUPLICATE KEY UPDATE reference_note=VALUES(reference_note);
