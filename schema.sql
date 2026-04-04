-- ================================================
-- BUY237 E-COMMERCE DATABASE SCHEMA
-- Optimized for Cameroon/African Market
-- ================================================

-- Drop existing tables if rebuilding
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS cart_items CASCADE;
DROP TABLE IF EXISTS carts CASCADE;
DROP TABLE IF EXISTS product_reviews CASCADE;
DROP TABLE IF EXISTS product_images CASCADE;
DROP TABLE IF EXISTS product_attributes CASCADE;
DROP TABLE IF EXISTS inventory CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS vendor_profiles CASCADE;
DROP TABLE IF EXISTS user_addresses CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS warehouses CASCADE;
DROP TABLE IF EXISTS customer_tiers CASCADE;
DROP TABLE IF EXISTS currencies CASCADE;
DROP TABLE IF EXISTS attributes CASCADE;
DROP TABLE IF EXISTS payment_transactions CASCADE;
DROP TABLE IF EXISTS delivery_zones CASCADE;

-- ================================================
-- CORE LOOKUP TABLES
-- ================================================

CREATE TABLE currencies (
    currency_code CHAR(3) PRIMARY KEY,
    currency_name VARCHAR(50) NOT NULL,
    symbol VARCHAR(10),
    exchange_rate_to_xaf DECIMAL(12,4) DEFAULT 1.0
);

INSERT INTO currencies VALUES 
    ('XAF', 'CFA Franc BEAC', 'FCFA', 1.0),
    ('USD', 'US Dollar', '$', 600.0),
    ('EUR', 'Euro', '€', 655.0);

CREATE TABLE customer_tiers (
    tier_id SERIAL PRIMARY KEY,
    tier_name VARCHAR(20) NOT NULL,
    discount_percentage DECIMAL(5,2) CHECK (discount_percentage BETWEEN 0 AND 100),
    min_lifetime_value DECIMAL(12,2) DEFAULT 0,
    tier_color VARCHAR(20) DEFAULT '#888888',
    benefits TEXT
);

INSERT INTO customer_tiers (tier_name, discount_percentage, min_lifetime_value, tier_color, benefits) VALUES
    ('Bronze', 0.00, 0, '#CD7F32', 'Basic access to all features'),
    ('Silver', 3.00, 50000, '#C0C0C0', '3% discount + free delivery over 25,000 FCFA'),
    ('Gold', 5.00, 200000, '#FFD700', '5% discount + priority support + free delivery'),
    ('Platinum', 10.00, 500000, '#E5E4E2', '10% discount + dedicated support + free delivery + early access');

CREATE TABLE warehouses (
    warehouse_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    location VARCHAR(200) NOT NULL,
    city VARCHAR(100) NOT NULL,
    region VARCHAR(100),
    country VARCHAR(100) DEFAULT 'Cameroon',
    phone VARCHAR(20),
    capacity INT,
    is_active BOOLEAN DEFAULT true
);

INSERT INTO warehouses (name, location, city, region, phone, capacity) VALUES
    ('Buy237 Yaoundé Hub', 'Quartier Bastos, Rue des Ambassades', 'Yaoundé', 'Centre', '+237 699 000 001', 5000),
    ('Buy237 Douala Hub', 'Akwa, Avenue du Général De Gaulle', 'Douala', 'Littoral', '+237 699 000 002', 8000),
    ('Buy237 Bafoussam Hub', 'Marché A, Rue Commerciale', 'Bafoussam', 'Ouest', '+237 699 000 003', 2000);

CREATE TABLE delivery_zones (
    zone_id SERIAL PRIMARY KEY,
    zone_name VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    base_fee DECIMAL(10,2) NOT NULL DEFAULT 1500,
    estimated_days_min INT DEFAULT 1,
    estimated_days_max INT DEFAULT 5,
    is_active BOOLEAN DEFAULT true
);

INSERT INTO delivery_zones (zone_name, city, base_fee, estimated_days_min, estimated_days_max) VALUES
    ('Yaoundé Express', 'Yaoundé', 1000, 1, 2),
    ('Yaoundé Standard', 'Yaoundé', 500, 2, 3),
    ('Douala Express', 'Douala', 1000, 1, 2),
    ('Douala Standard', 'Douala', 500, 2, 3),
    ('Bafoussam', 'Bafoussam', 2500, 2, 4),
    ('Bamenda', 'Bamenda', 3000, 3, 5),
    ('Garoua', 'Garoua', 3500, 3, 6),
    ('Other Regions', 'Other', 4000, 4, 7);

CREATE TABLE attributes (
    attribute_id SERIAL PRIMARY KEY,
    attribute_name VARCHAR(50) NOT NULL UNIQUE,
    attribute_type VARCHAR(20) DEFAULT 'text' -- text, number, boolean, color, size
);

INSERT INTO attributes (attribute_name, attribute_type) VALUES
    ('Color', 'color'),
    ('Size', 'size'),
    ('Material', 'text'),
    ('Brand', 'text'),
    ('Weight', 'number'),
    ('Warranty', 'text'),
    ('Storage', 'size'),
    ('RAM', 'size'),
    ('Battery', 'text'),
    ('Screen Size', 'number');

-- ================================================
-- USERS & AUTHENTICATION
-- ================================================

CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    preferred_language VARCHAR(10) DEFAULT 'en',
    role VARCHAR(20) DEFAULT 'customer' CHECK (role IN ('customer', 'vendor', 'admin')),
    tier_id INT REFERENCES customer_tiers(tier_id) DEFAULT 1,
    lifetime_value DECIMAL(12,2) DEFAULT 0.0,
    profile_image_url VARCHAR(500),
    is_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_addresses (
    address_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    label VARCHAR(50) DEFAULT 'Home', -- Home, Work, Other
    recipient_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    city VARCHAR(100) NOT NULL,
    neighborhood VARCHAR(100),
    landmark VARCHAR(200), -- e.g., "Near Total Melen"
    street_details TEXT,
    delivery_zone_id INT REFERENCES delivery_zones(zone_id),
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- VENDORS
-- ================================================

CREATE TABLE vendor_profiles (
    vendor_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
    shop_name VARCHAR(100) NOT NULL UNIQUE,
    shop_description TEXT,
    shop_logo_url VARCHAR(500),
    shop_banner_url VARCHAR(500),
    city VARCHAR(100),
    address TEXT,
    phone VARCHAR(20),
    whatsapp VARCHAR(20),
    total_sales DECIMAL(12,2) DEFAULT 0,
    total_orders INT DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0.0,
    review_count INT DEFAULT 0,
    is_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- PRODUCTS & CATALOG
-- ================================================

CREATE TABLE categories (
    category_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    parent_id INT REFERENCES categories(category_id),
    icon VARCHAR(50),
    image_url VARCHAR(500),
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true
);

INSERT INTO categories (name, slug, icon, sort_order) VALUES
    ('Electronics', 'electronics', '📱', 1),
    ('Fashion', 'fashion', '👗', 2),
    ('Home & Living', 'home-living', '🏠', 3),
    ('Food & Groceries', 'food-groceries', '🛒', 4),
    ('Health & Beauty', 'health-beauty', '💄', 5),
    ('Agriculture', 'agriculture', '🌱', 6),
    ('Automotive', 'automotive', '🚗', 7),
    ('Sports & Outdoors', 'sports-outdoors', '⚽', 8),
    ('Books & Education', 'books-education', '📚', 9),
    ('Baby & Kids', 'baby-kids', '🧸', 10),
    ('Phones & Tablets', 'phones-tablets', '📲', 11),
    ('Computers', 'computers', '💻', 12);

CREATE TABLE products (
    product_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID REFERENCES vendor_profiles(vendor_id) ON DELETE CASCADE,
    category_id INT REFERENCES categories(category_id),
    product_name VARCHAR(200) NOT NULL,
    slug VARCHAR(250) NOT NULL UNIQUE,
    description TEXT,
    base_price DECIMAL(12,2) NOT NULL CHECK (base_price > 0),
    discount_price DECIMAL(12,2),
    currency_code CHAR(3) REFERENCES currencies(currency_code) DEFAULT 'XAF',
    sku VARCHAR(100),
    is_available BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    is_deal_of_day BOOLEAN DEFAULT false,
    tags TEXT[], -- Array of search tags
    rating DECIMAL(3,2) DEFAULT 0.0,
    review_count INT DEFAULT 0,
    total_sold INT DEFAULT 0,
    weight_kg DECIMAL(8,3),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE product_images (
    image_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(product_id) ON DELETE CASCADE,
    image_url VARCHAR(500) NOT NULL,
    alt_text VARCHAR(200),
    is_primary BOOLEAN DEFAULT false,
    sort_order INT DEFAULT 0
);

CREATE TABLE product_attributes (
    product_id UUID REFERENCES products(product_id) ON DELETE CASCADE,
    attribute_id INT REFERENCES attributes(attribute_id),
    value VARCHAR(200) NOT NULL,
    PRIMARY KEY (product_id, attribute_id)
);

CREATE TABLE inventory (
    inventory_id SERIAL PRIMARY KEY,
    product_id UUID REFERENCES products(product_id) ON DELETE CASCADE,
    warehouse_id INT REFERENCES warehouses(warehouse_id),
    quantity_on_hand INT DEFAULT 0 CHECK (quantity_on_hand >= 0),
    reorder_threshold INT DEFAULT 10,
    UNIQUE(product_id, warehouse_id)
);

CREATE TABLE product_reviews (
    review_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(product_id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    order_item_id UUID,
    rating INT CHECK (rating BETWEEN 1 AND 5),
    title VARCHAR(200),
    body TEXT,
    is_verified_purchase BOOLEAN DEFAULT false,
    helpful_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- CART & ORDERS
-- ================================================

CREATE TABLE carts (
    cart_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    session_id VARCHAR(100), -- for guest carts
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

CREATE TABLE cart_items (
    cart_item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id UUID REFERENCES carts(cart_id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(product_id),
    quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price DECIMAL(12,2) NOT NULL,
    added_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE orders (
    order_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    user_id UUID REFERENCES users(user_id),
    address_id UUID REFERENCES user_addresses(address_id),
    status VARCHAR(30) DEFAULT 'pending' 
        CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
    payment_method VARCHAR(30) NOT NULL
        CHECK (payment_method IN ('mtn_momo', 'orange_money', 'cash_on_delivery', 'card')),
    payment_status VARCHAR(20) DEFAULT 'pending'
        CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    payment_reference VARCHAR(100),
    subtotal DECIMAL(12,2) NOT NULL,
    delivery_fee DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL,
    currency_code CHAR(3) DEFAULT 'XAF',
    notes TEXT,
    estimated_delivery DATE,
    delivered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE order_items (
    order_item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(order_id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(product_id),
    vendor_id UUID REFERENCES vendor_profiles(vendor_id),
    product_name VARCHAR(200) NOT NULL,
    unit_price DECIMAL(12,2) NOT NULL,
    quantity INT NOT NULL,
    total_price DECIMAL(12,2) NOT NULL,
    item_status VARCHAR(20) DEFAULT 'pending'
);

CREATE TABLE payment_transactions (
    transaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(order_id),
    user_id UUID REFERENCES users(user_id),
    payment_method VARCHAR(30) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    currency_code CHAR(3) DEFAULT 'XAF',
    status VARCHAR(20) DEFAULT 'pending'
        CHECK (status IN ('pending', 'success', 'failed', 'cancelled')),
    external_reference VARCHAR(200),
    phone_number VARCHAR(20),
    response_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- INDEXES FOR PERFORMANCE
-- ================================================

CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_vendor ON products(vendor_id);
CREATE INDEX idx_products_featured ON products(is_featured) WHERE is_featured = true;
CREATE INDEX idx_products_deal ON products(is_deal_of_day) WHERE is_deal_of_day = true;
CREATE INDEX idx_products_search ON products USING GIN (to_tsvector('english', product_name || ' ' || COALESCE(description, '')));
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_cart_items_cart ON cart_items(cart_id);
CREATE INDEX idx_inventory_product ON inventory(product_id);
CREATE INDEX idx_reviews_product ON product_reviews(product_id);

-- ================================================
-- FUNCTIONS & TRIGGERS
-- ================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_vendor_updated_at BEFORE UPDATE ON vendor_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Update product rating when review added
CREATE OR REPLACE FUNCTION update_product_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE products 
    SET 
        rating = (SELECT AVG(rating) FROM product_reviews WHERE product_id = NEW.product_id),
        review_count = (SELECT COUNT(*) FROM product_reviews WHERE product_id = NEW.product_id)
    WHERE product_id = NEW.product_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_product_rating 
AFTER INSERT OR UPDATE ON product_reviews 
FOR EACH ROW EXECUTE FUNCTION update_product_rating();

-- Generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.order_number = 'B237-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(SUBSTRING(NEW.order_id::text, 1, 6));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_order_number 
BEFORE INSERT ON orders 
FOR EACH ROW EXECUTE FUNCTION generate_order_number();

-- ================================================
-- SAMPLE DATA
-- ================================================

-- Sample admin user (password: Admin@237)
INSERT INTO users (user_id, email, phone, password_hash, full_name, role, is_verified) VALUES
    ('00000000-0000-0000-0000-000000000001', 'admin@buy237.cm', '+237699000000', '$2b$10$hashed_placeholder', 'Buy237 Admin', 'admin', true);

COMMIT;
