-- Vendors table
CREATE TABLE IF NOT EXISTS vendors (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    address VARCHAR(255) NOT NULL,
    approved BOOLEAN NOT NULL
);
-- Chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
    id SERIAL PRIMARY KEY,
    sender_id BIGINT NOT NULL,
    receiver_id BIGINT NOT NULL,
    content TEXT NOT NULL,
    sent_at TIMESTAMP NOT NULL
);
-- Uploads table
CREATE TABLE IF NOT EXISTS uploads (
    id SERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_url VARCHAR(255) NOT NULL,
    uploaded_at TIMESTAMP NOT NULL
);
-- Payments table
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL,
    amount DOUBLE PRECISION NOT NULL,
    method VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL
);
-- Addresses table
CREATE TABLE IF NOT EXISTS addresses (
    id SERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    street VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    country VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL
);
-- Carts table
CREATE TABLE IF NOT EXISTS carts (
    id SERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL
);

-- Cart items table
CREATE TABLE IF NOT EXISTS cart_items (
    id SERIAL PRIMARY KEY,
    cart_id BIGINT REFERENCES carts(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL,
    quantity INTEGER NOT NULL
);
-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    total_amount DOUBLE PRECISION NOT NULL,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id BIGINT REFERENCES orders(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL,
    quantity INTEGER NOT NULL,
    price DOUBLE PRECISION NOT NULL
);
-- User table for Auth module
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE
);
