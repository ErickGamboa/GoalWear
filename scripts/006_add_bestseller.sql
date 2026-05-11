-- Add is_bestseller flag to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_bestseller boolean NOT NULL DEFAULT false;
