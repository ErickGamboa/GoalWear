-- Products table (jerseys and accessories)
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  team TEXT,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  image_url TEXT,
  category TEXT NOT NULL CHECK (category IN ('immediate', 'preorder', 'accessory')),
  has_stock BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Product sizes with independent stock
CREATE TABLE IF NOT EXISTS public.product_sizes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  size TEXT NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  UNIQUE(product_id, size)
);

-- Patches for customization
CREATE TABLE IF NOT EXISTS public.patches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  image_url TEXT
);

-- Orders
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  customer_address TEXT,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Order items
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  product_code TEXT NOT NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  size TEXT,
  custom_name TEXT,
  custom_number TEXT,
  patches TEXT[],
  unit_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  category TEXT NOT NULL
);

-- Auto-generate product code function
CREATE OR REPLACE FUNCTION public.generate_product_code()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  prefix TEXT;
  seq_num INTEGER;
BEGIN
  IF NEW.category = 'immediate' THEN
    prefix := 'JEI';
  ELSIF NEW.category = 'preorder' THEN
    prefix := 'JPR';
  ELSE
    prefix := 'ACC';
  END IF;

  SELECT COALESCE(MAX(
    CAST(SUBSTRING(code FROM 4) AS INTEGER)
  ), 0) + 1
  INTO seq_num
  FROM public.products
  WHERE code LIKE prefix || '%';

  NEW.code := prefix || LPAD(seq_num::TEXT, 4, '0');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_generate_product_code ON public.products;
CREATE TRIGGER trigger_generate_product_code
  BEFORE INSERT ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_product_code();

-- Enable RLS on all tables
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_sizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Public read access for products, sizes, patches
CREATE POLICY "products_public_read" ON public.products FOR SELECT USING (true);
CREATE POLICY "product_sizes_public_read" ON public.product_sizes FOR SELECT USING (true);
CREATE POLICY "patches_public_read" ON public.patches FOR SELECT USING (true);

-- Admin full access for products
CREATE POLICY "products_admin_insert" ON public.products FOR INSERT WITH CHECK (
  (SELECT auth.uid()) IS NOT NULL
);
CREATE POLICY "products_admin_update" ON public.products FOR UPDATE USING (
  (SELECT auth.uid()) IS NOT NULL
);
CREATE POLICY "products_admin_delete" ON public.products FOR DELETE USING (
  (SELECT auth.uid()) IS NOT NULL
);

-- Admin full access for product_sizes
CREATE POLICY "product_sizes_admin_insert" ON public.product_sizes FOR INSERT WITH CHECK (
  (SELECT auth.uid()) IS NOT NULL
);
CREATE POLICY "product_sizes_admin_update" ON public.product_sizes FOR UPDATE USING (
  (SELECT auth.uid()) IS NOT NULL
);
CREATE POLICY "product_sizes_admin_delete" ON public.product_sizes FOR DELETE USING (
  (SELECT auth.uid()) IS NOT NULL
);

-- Admin full access for patches
CREATE POLICY "patches_admin_insert" ON public.patches FOR INSERT WITH CHECK (
  (SELECT auth.uid()) IS NOT NULL
);
CREATE POLICY "patches_admin_update" ON public.patches FOR UPDATE USING (
  (SELECT auth.uid()) IS NOT NULL
);
CREATE POLICY "patches_admin_delete" ON public.patches FOR DELETE USING (
  (SELECT auth.uid()) IS NOT NULL
);

-- Orders: public insert (customers can create orders), admin read
CREATE POLICY "orders_public_insert" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "orders_admin_read" ON public.orders FOR SELECT USING (
  (SELECT auth.uid()) IS NOT NULL
);

-- Order items: public insert, admin read
CREATE POLICY "order_items_public_insert" ON public.order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "order_items_admin_read" ON public.order_items FOR SELECT USING (
  (SELECT auth.uid()) IS NOT NULL
);

-- Function to decrement stock when order is placed
CREATE OR REPLACE FUNCTION public.decrement_stock(p_product_id UUID, p_size TEXT, p_quantity INTEGER)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.product_sizes
  SET stock = stock - p_quantity
  WHERE product_id = p_product_id AND size = p_size AND stock >= p_quantity;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient stock for product % size %', p_product_id, p_size;
  END IF;
END;
$$;

-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for product images
CREATE POLICY "product_images_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
CREATE POLICY "product_images_admin_insert" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'product-images' AND (SELECT auth.uid()) IS NOT NULL
);
CREATE POLICY "product_images_admin_update" ON storage.objects FOR UPDATE USING (
  bucket_id = 'product-images' AND (SELECT auth.uid()) IS NOT NULL
);
CREATE POLICY "product_images_admin_delete" ON storage.objects FOR DELETE USING (
  bucket_id = 'product-images' AND (SELECT auth.uid()) IS NOT NULL
);
