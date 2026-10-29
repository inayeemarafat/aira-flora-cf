-- Aira Flora — D1 (SQLite) schema.
-- Ported from the original Postgres/Supabase schema in drizzle/migrations.
-- Booleans are 0/1 integers, JSON columns are TEXT, timestamps are ISO-8601 UTC strings.

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL,
  price INTEGER NOT NULL,
  compare_price INTEGER,
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  sizes TEXT NOT NULL DEFAULT '["S","M","L","XL","XXL"]',
  colors TEXT NOT NULL DEFAULT '[]',
  image TEXT NOT NULL,
  gallery TEXT NOT NULL DEFAULT '[]',
  is_featured INTEGER NOT NULL DEFAULT 0,
  is_flash_sale INTEGER NOT NULL DEFAULT 0,
  flash_sale_price INTEGER,
  flash_ends_at TEXT,
  rating REAL NOT NULL DEFAULT 4.8,
  reviews_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  address TEXT NOT NULL,
  shipping_area TEXT NOT NULL,
  mobile TEXT NOT NULL,
  email TEXT,
  remarks TEXT,
  total_amount INTEGER NOT NULL,
  subtotal INTEGER NOT NULL DEFAULT 0,
  shipping_cost INTEGER NOT NULL DEFAULT 0,
  discount_amount INTEGER NOT NULL DEFAULT 0,
  coupon_code TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'on_the_way', 'delivered', 'cancelled')),
  payment_method TEXT NOT NULL DEFAULT 'cod',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
  product_id TEXT REFERENCES products (id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  image TEXT,
  size TEXT NOT NULL,
  color TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  price INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS coupons (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('percent', 'fixed')),
  value INTEGER NOT NULL,
  min_order INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  expires_at TEXT,
  used_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS product_reviews (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  author TEXT NOT NULL,
  rating INTEGER NOT NULL,
  comment TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL CHECK (trim(name) <> ''),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS visits (
  day TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products (category);
CREATE INDEX IF NOT EXISTS idx_orders_mobile ON orders (mobile);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders (created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items (order_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON product_reviews (product_id);
