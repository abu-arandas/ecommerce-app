-- Complete Database Schema and Migrations
-- BeautyHub E-Commerce Platform
-- This file contains the complete database schema including all migrations

-- =================================================================
-- INITIAL SCHEMA
-- =================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Categories Table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products Table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  image_url TEXT,
  stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders Table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  total NUMERIC(10, 2) NOT NULL CHECK (total >= 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  shipping_address TEXT NOT NULL,
  notes TEXT,
  payment_intent_id TEXT,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'succeeded', 'failed', 'cancelled', 'refunded')),
  payment_method TEXT,
  tracking_number TEXT,
  carrier TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order Items Table
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cart Items Table
CREATE TABLE IF NOT EXISTS cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- Wishlist Table
CREATE TABLE IF NOT EXISTS wishlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- Reviews Table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  comment TEXT NOT NULL,
  helpful_count INTEGER DEFAULT 0 CHECK (helpful_count >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =================================================================
-- PAYMENT TRACKING MIGRATION
-- =================================================================

-- Payment Logs Table for audit trail
CREATE TABLE IF NOT EXISTS payment_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  stripe_event_id TEXT UNIQUE,
  amount NUMERIC,
  status TEXT,
  error_message TEXT,
  payload JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =================================================================
-- EMAIL NOTIFICATIONS MIGRATION
-- =================================================================

-- Email Logs Table for tracking sent emails
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  email_type TEXT NOT NULL CHECK (email_type IN ('order_confirmation', 'shipping_notification', 'delivery_confirmation', 'order_update')),
  recipient TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'bounced')),
  provider_response JSONB,
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =================================================================
-- INVENTORY TRACKING MIGRATION
-- =================================================================

-- Inventory Logs Table for tracking stock changes
CREATE TABLE IF NOT EXISTS inventory_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  change_amount INTEGER NOT NULL,
  previous_stock INTEGER NOT NULL,
  new_stock INTEGER NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('order', 'restock', 'correction', 'return')),
  reference_id UUID, -- Can be order_id or other reference
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =================================================================
-- INDEXES FOR PERFORMANCE
-- =================================================================

-- Product indexes
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON products(is_featured);

-- Order indexes
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_intent_id ON orders(payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

-- Order items indexes
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- Cart items indexes
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON cart_items(product_id);

-- Wishlist indexes
CREATE INDEX IF NOT EXISTS idx_wishlist_user_id ON wishlist(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_product_id ON wishlist(product_id);

-- Reviews indexes
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);

-- Payment logs indexes
CREATE INDEX IF NOT EXISTS idx_payment_logs_order_id ON payment_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_logs_stripe_event_id ON payment_logs(stripe_event_id);
CREATE INDEX IF NOT EXISTS idx_payment_logs_created_at ON payment_logs(created_at);

-- Email logs indexes
CREATE INDEX IF NOT EXISTS idx_email_logs_order_id ON email_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_email_type ON email_logs(email_type);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_logs(sent_at);

-- Inventory logs indexes
CREATE INDEX IF NOT EXISTS idx_inventory_logs_product_id ON inventory_logs(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_created_at ON inventory_logs(created_at);

-- =================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =================================================================

-- Enable RLS on all tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Categories policies (public read)
CREATE POLICY "Anyone can view categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Only admins can manage categories" ON categories FOR ALL TO authenticated
  USING ((auth.jwt() -> 'user_metadata' ->>'is_admin')::boolean = true);

-- Products policies (public read)
CREATE POLICY "Anyone can view products" ON products FOR SELECT USING (true);
CREATE POLICY "Only admins can manage products" ON products FOR ALL TO authenticated
  USING ((auth.jwt() -> 'user_metadata' ->>'is_admin')::boolean = true);

-- Orders policies (users can see their own)
CREATE POLICY "Users can view own orders" ON orders FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Users can create own orders" ON orders FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all orders" ON orders FOR SELECT TO authenticated
  USING ((auth.jwt() -> 'user_metadata' ->>'is_admin')::boolean = true);
CREATE POLICY "Admins can update orders" ON orders FOR UPDATE TO authenticated
  USING ((auth.jwt() -> 'user_metadata' ->>'is_admin')::boolean = true);

-- Order items policies
CREATE POLICY "Users can view own order items" ON order_items FOR SELECT TO authenticated
  USING (order_id IN (SELECT id FROM orders WHERE user_id = auth.uid()));
CREATE POLICY "Users can create own order items" ON order_items FOR INSERT TO authenticated
  WITH CHECK (order_id IN (SELECT id FROM orders WHERE user_id = auth.uid()));

-- Cart items policies (users manage their own)
CREATE POLICY "Users can manage own cart" ON cart_items FOR ALL TO authenticated
  USING (auth.uid() = user_id);

-- Wishlist policies (users manage their own)
CREATE POLICY "Users can manage own wishlist" ON wishlist FOR ALL TO authenticated
  USING (auth.uid() = user_id);

-- Reviews policies
CREATE POLICY "Anyone can view reviews" ON reviews FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create reviews" ON reviews FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reviews" ON reviews FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own reviews" ON reviews FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Payment logs policies (admin only)
CREATE POLICY "Only admins can view payment logs" ON payment_logs FOR SELECT TO authenticated
  USING ((auth.jwt() -> 'user_metadata' ->>'is_admin')::boolean = true);
CREATE POLICY "System can insert payment logs" ON payment_logs FOR INSERT TO authenticated
  WITH CHECK (true);

-- Email logs policies (admin only)
CREATE POLICY "Only admins can view email logs" ON email_logs FOR SELECT TO authenticated
  USING ((auth.jwt() -> 'user_metadata' ->>'is_admin')::boolean = true);
CREATE POLICY "System can insert email logs" ON email_logs FOR INSERT TO authenticated
  WITH CHECK (true);

-- Inventory logs policies (admin only)
ALTER TABLE inventory_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view inventory logs" ON inventory_logs FOR SELECT TO authenticated
  USING ((auth.jwt() -> 'user_metadata' ->>'is_admin')::boolean = true);

CREATE POLICY "Admins can insert inventory logs" ON inventory_logs FOR INSERT TO authenticated
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->>'is_admin')::boolean = true);
  
-- Allow system/triggers to insert inventory logs (if using database functions)
-- Note: In Supabase, triggers execute with the privileges of the function owner (usually postgres), bypassing RLS.
-- But if inserting from API, we need a policy.

-- =================================================================
-- DATABASE FUNCTIONS
-- =================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cart_items_updated_at BEFORE UPDATE ON cart_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to increment helpful count on reviews
CREATE OR REPLACE FUNCTION increment_helpful_count(review_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE reviews
  SET helpful_count = helpful_count + 1
  WHERE id = review_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get average rating for a product
CREATE OR REPLACE FUNCTION get_average_rating(product_uuid UUID)
RETURNS TABLE(average NUMERIC, count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(AVG(rating), 0)::NUMERIC AS average,
    COUNT(*)::BIGINT AS count
  FROM reviews
  WHERE product_id = product_uuid;
END;
$$ LANGUAGE plpgsql;

-- =================================================================
-- EMAIL TRIGGERS
-- =================================================================

-- Function to send order confirmation email
CREATE OR REPLACE FUNCTION trigger_send_order_confirmation()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.payment_status = 'succeeded' AND (OLD.payment_status IS NULL OR OLD.payment_status != 'succeeded') THEN
    INSERT INTO email_logs (order_id, email_type, recipient, status)
    VALUES (NEW.id, 'order_confirmation', NEW.shipping_address, 'pending');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for order confirmation emails
DROP TRIGGER IF EXISTS send_order_confirmation_trigger ON orders;
CREATE TRIGGER send_order_confirmation_trigger
  AFTER INSERT OR UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION trigger_send_order_confirmation();

-- Function to send shipping notification
CREATE OR REPLACE FUNCTION trigger_send_shipping_notification()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'shipped' AND (OLD.status IS NULL OR OLD.status != 'shipped') THEN
    INSERT INTO email_logs (order_id, email_type, recipient, status)
    VALUES (NEW.id, 'shipping_notification', NEW.shipping_address, 'pending');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for shipping notifications
DROP TRIGGER IF EXISTS send_shipping_notification_trigger ON orders;
CREATE TRIGGER send_shipping_notification_trigger
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION trigger_send_shipping_notification();

-- =================================================================
-- VIEWS FOR ANALYTICS
-- =================================================================

-- Email analytics view
CREATE OR REPLACE VIEW email_analytics AS
SELECT
  email_type,
  status,
  COUNT(*) as count,
  DATE(sent_at) as date
FROM email_logs
GROUP BY email_type, status, DATE(sent_at)
ORDER BY date DESC;

-- =================================================================
-- COMMENTS FOR DOCUMENTATION
-- =================================================================

COMMENT ON TABLE payment_logs IS 'Audit log for all Stripe payment events';
COMMENT ON TABLE email_logs IS 'Tracks all emails sent from the system for order notifications';
COMMENT ON TABLE reviews IS 'Customer reviews and ratings for products';
COMMENT ON FUNCTION increment_helpful_count IS 'Increments the helpful count for a review (for voting)';
COMMENT ON FUNCTION get_average_rating IS 'Returns average rating and total review count for a product';
COMMENT ON FUNCTION trigger_send_order_confirmation IS 'Automatically logs order confirmation emails when payment succeeds';
COMMENT ON FUNCTION trigger_send_shipping_notification IS 'Automatically logs shipping notification emails when order is shipped';
