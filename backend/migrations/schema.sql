-- CampusBite Production Relational Database Schema (21 Tables)
CREATE DATABASE IF NOT EXISTS campusbite_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE campusbite_db;

-- 1. Users table (students and canteen staff)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(191) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('student', 'admin', 'kitchen_staff') DEFAULT 'student',
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. Student profiles with roll number and hostel block
CREATE TABLE IF NOT EXISTS student_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    roll_number VARCHAR(50) NOT NULL UNIQUE,
    department VARCHAR(100),
    hostel_block VARCHAR(50),
    room_number VARCHAR(20),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 3. Canteen food categories
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE
) ENGINE=InnoDB;

-- 4. Food menu items with dietary, stock, and preparation indicators
CREATE TABLE IF NOT EXISTS food_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    is_veg BOOLEAN DEFAULT TRUE,
    is_jain BOOLEAN DEFAULT FALSE,
    prep_time_mins INT DEFAULT 10,
    calories INT DEFAULT 0,
    spice_level INT DEFAULT 1,
    current_stock INT DEFAULT 50,
    is_available BOOLEAN DEFAULT TRUE,
    station_name VARCHAR(50) DEFAULT 'Main Kitchen',
    image_url TEXT,
    FOREIGN KEY (category_id) REFERENCES categories(id)
) ENGINE=InnoDB;

-- 5. Time-slot based pre-booking pickup windows
CREATE TABLE IF NOT EXISTS pickup_slots (
    id INT AUTO_INCREMENT PRIMARY KEY,
    slot_label VARCHAR(100) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    max_capacity INT DEFAULT 50,
    current_load INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE
) ENGINE=InnoDB;

-- 6. Active carts
CREATE TABLE IF NOT EXISTS carts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 7. Cart line items
CREATE TABLE IF NOT EXISTS cart_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cart_id INT NOT NULL,
    food_item_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    special_notes TEXT,
    FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
    FOREIGN KEY (food_item_id) REFERENCES food_items(id)
) ENGINE=InnoDB;

-- 8. Orders table with statutory billing, token, and state progression
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_token VARCHAR(30) NOT NULL UNIQUE, -- e.g. '#TOKEN-412'
    security_pin VARCHAR(10) NOT NULL,       -- e.g. '8942'
    user_id INT NOT NULL,
    pickup_slot_id INT,
    counter_assigned VARCHAR(50) DEFAULT 'Counter 2 (Express)',
    subtotal_amount DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0.00,
    subsidy_amount DECIMAL(10,2) DEFAULT 0.00,
    cgst_amount DECIMAL(10,2) DEFAULT 0.00,
    sgst_amount DECIMAL(10,2) DEFAULT 0.00,
    packaging_fee DECIMAL(10,2) DEFAULT 0.00,
    final_amount DECIMAL(10,2) NOT NULL,
    status ENUM('PLACED', 'ACCEPTED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED') DEFAULT 'PLACED',
    special_instructions TEXT,
    cancellation_reason VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (pickup_slot_id) REFERENCES pickup_slots(id)
) ENGINE=InnoDB;

-- 9. Order line items
CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    food_item_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (food_item_id) REFERENCES food_items(id)
) ENGINE=InnoDB;

-- 10. Student digital wallet
CREATE TABLE IF NOT EXISTS wallets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    balance DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    is_locked BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 11. Itemized wallet financial transaction ledger
CREATE TABLE IF NOT EXISTS wallet_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    wallet_id INT NOT NULL,
    order_id INT NULL,
    amount DECIMAL(10,2) NOT NULL,
    transaction_type ENUM('DEBIT', 'CREDIT', 'REFUND', 'SUBSIDY', 'TOPUP') NOT NULL,
    category ENUM('FOOD_ORDER', 'SUBSIDY', 'REFUND', 'TOPUP', 'CASHBACK') NOT NULL,
    reference_note VARCHAR(255) NOT NULL,
    post_balance DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (wallet_id) REFERENCES wallets(id),
    FOREIGN KEY (order_id) REFERENCES orders(id)
) ENGINE=InnoDB;

-- 12. Payments tracking
CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL UNIQUE,
    payment_method ENUM('WALLET', 'UPI', 'RFID_CARD', 'CASH') DEFAULT 'WALLET',
    transaction_ref VARCHAR(100) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_status ENUM('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED') DEFAULT 'SUCCESS',
    settled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id)
) ENGINE=InnoDB;

-- 13. Student meal plan subscription tiers
CREATE TABLE IF NOT EXISTS meal_plans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    duration_days INT NOT NULL,
    meals_per_day INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    daily_rate_equivalent DECIMAL(10,2) NOT NULL,
    allows_cash_rollover BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE
) ENGINE=InnoDB;

-- 14. Active student meal subscriptions
CREATE TABLE IF NOT EXISTS meal_subscriptions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    meal_plan_id INT NOT NULL,
    total_meals_allowance INT NOT NULL,
    meals_consumed INT DEFAULT 0,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_paused BOOLEAN DEFAULT FALSE,
    status ENUM('ACTIVE', 'PAUSED', 'EXPIRED', 'CANCELLED') DEFAULT 'ACTIVE',
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (meal_plan_id) REFERENCES meal_plans(id)
) ENGINE=InnoDB;

-- 15. Real-time Kitchen Inventory & 86 Kill Switches
CREATE TABLE IF NOT EXISTS inventory (
    id INT AUTO_INCREMENT PRIMARY KEY,
    food_item_id INT NOT NULL UNIQUE,
    current_stock INT NOT NULL DEFAULT 50,
    low_stock_threshold INT NOT NULL DEFAULT 5,
    is_86_killed BOOLEAN DEFAULT FALSE,
    last_restocked TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (food_item_id) REFERENCES food_items(id)
) ENGINE=InnoDB;

-- 16. Discounts and promotional rules (e.g. HACK50)
CREATE TABLE IF NOT EXISTS discounts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    min_order_amount DECIMAL(10,2) DEFAULT 0.00,
    discount_value DECIMAL(10,2) NOT NULL,
    is_percentage BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE
) ENGINE=InnoDB;

-- 17. Multi-dimensional post-pickup feedback
CREATE TABLE IF NOT EXISTS feedback (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL UNIQUE,
    user_id INT NOT NULL,
    taste_rating INT NOT NULL CHECK (taste_rating BETWEEN 1 AND 5),
    speed_rating INT NOT NULL CHECK (speed_rating BETWEEN 1 AND 5),
    hygiene_rating INT NOT NULL CHECK (hygiene_rating BETWEEN 1 AND 5),
    courtesy_rating INT NOT NULL CHECK (courtesy_rating BETWEEN 1 AND 5),
    dietary_honored BOOLEAN DEFAULT TRUE,
    comment TEXT,
    karma_points_awarded INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

-- 18. Grievance and refund disputes desk
CREATE TABLE IF NOT EXISTS grievances (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    user_id INT NOT NULL,
    issue_type ENUM('MISSING_ITEM', 'COLD_FOOD', 'BILLING_ERROR', 'EXCESSIVE_DELAY', 'OTHER') NOT NULL,
    description TEXT,
    status ENUM('OPEN', 'IN_REVIEW', 'REFUNDED', 'REJECTED') DEFAULT 'OPEN',
    refund_amount DECIMAL(10,2) DEFAULT 0.00,
    resolved_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

-- 19. Smart notifications (Push & WhatsApp simulations)
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    channel ENUM('IN_APP', 'WHATSAPP', 'SMS') DEFAULT 'IN_APP',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

-- 20. Instant UPI payout withdrawals
CREATE TABLE IF NOT EXISTS upi_withdrawals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    wallet_id INT NOT NULL,
    upi_id VARCHAR(100) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payout_status ENUM('INITIATED', 'PROCESSING', 'SETTLED', 'FAILED') DEFAULT 'SETTLED',
    settled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (wallet_id) REFERENCES wallets(id)
) ENGINE=InnoDB;

-- 21. Daily campus combos and specials
CREATE TABLE IF NOT EXISTS daily_specials (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    special_price DECIMAL(10,2) NOT NULL,
    original_price DECIMAL(10,2) NOT NULL,
    banner_tag VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE
) ENGINE=InnoDB;
