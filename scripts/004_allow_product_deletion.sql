-- Migration: Allow product deletion for products not in pending orders
-- Date: 2026-04-14
-- order_items stores denormalized product data (product_code, product_name,
-- unit_price, etc.), so nullifying product_id in historical rows is safe.
-- The application-level block (actions.ts) prevents deletion while a product
-- is in an active (pending) order.

-- 1. Make product_id nullable so ON DELETE SET NULL can work
ALTER TABLE public.order_items
  ALTER COLUMN product_id DROP NOT NULL;

-- 2. Drop the existing FK constraint (auto-named by PostgreSQL convention)
ALTER TABLE public.order_items
  DROP CONSTRAINT IF EXISTS order_items_product_id_fkey;

-- 3. Re-add FK with ON DELETE SET NULL
ALTER TABLE public.order_items
  ADD CONSTRAINT order_items_product_id_fkey
  FOREIGN KEY (product_id)
  REFERENCES public.products(id)
  ON DELETE SET NULL;
