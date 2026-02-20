-- Migration: Add shipping support to orders
-- Date: 2026-02-19

-- Add shipping_cost column to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS shipping_cost NUMERIC(10,2) NOT NULL DEFAULT 0;

-- Update existing orders to have shipping_cost = 0 (for data consistency)
UPDATE public.orders SET shipping_cost = 0 WHERE shipping_cost IS NULL;

-- Create or replace the atomic order placement function with shipping support
CREATE OR REPLACE FUNCTION public.place_order_atomic(
  p_customer_name TEXT,
  p_customer_email TEXT,
  p_customer_phone TEXT,
  p_customer_address TEXT,
  p_total NUMERIC,
  p_shipping_cost NUMERIC,
  p_notes TEXT,
  p_items JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order_id UUID;
  item_record RECORD;
  v_current_stock INTEGER;
BEGIN
  -- Create the order first
  INSERT INTO public.orders (
    customer_name,
    customer_email,
    customer_phone,
    customer_address,
    total,
    shipping_cost,
    notes
  ) VALUES (
    p_customer_name,
    p_customer_email,
    p_customer_phone,
    p_customer_address,
    p_total,
    COALESCE(p_shipping_cost, 0),
    p_notes
  )
  RETURNING id INTO v_order_id;

  -- Process each item and decrement stock for immediate delivery items
  FOR item_record IN SELECT * FROM jsonb_to_recordset(p_items) AS x(
    productId UUID,
    productCode TEXT,
    productName TEXT,
    quantity INTEGER,
    size TEXT,
    customName TEXT,
    customNumber TEXT,
    patches TEXT[],
    unitPrice NUMERIC,
    category TEXT
  )
  LOOP
    -- Insert order item
    INSERT INTO public.order_items (
      order_id,
      product_id,
      product_code,
      product_name,
      quantity,
      size,
      custom_name,
      custom_number,
      patches,
      unit_price,
      subtotal,
      category
    ) VALUES (
      v_order_id,
      item_record.productId,
      item_record.productCode,
      item_record.productName,
      item_record.quantity,
      item_record.size,
      item_record.customName,
      item_record.customNumber,
      item_record.patches,
      item_record.unitPrice,
      item_record.unitPrice * item_record.quantity,
      item_record.category
    );

    -- Decrement stock only for immediate delivery items
    IF item_record.category = 'immediate' THEN
      -- Check current stock
      SELECT stock INTO v_current_stock
      FROM public.product_sizes
      WHERE product_id = item_record.productId AND size = item_record.size;

      IF v_current_stock IS NULL OR v_current_stock < item_record.quantity THEN
        RAISE EXCEPTION 'Insufficient stock for product % size %', item_record.productCode, item_record.size;
      END IF;

      -- Decrement stock
      UPDATE public.product_sizes
      SET stock = stock - item_record.quantity
      WHERE product_id = item_record.productId AND size = item_record.size;
    END IF;
  END LOOP;

  RETURN v_order_id;
EXCEPTION
  WHEN OTHERS THEN
    -- Re-raise the error with the original message
    RAISE;
END;
$$;

-- Add comment for documentation
COMMENT ON COLUMN public.orders.shipping_cost IS 'Costo de envio del pedido (3500 CRC por defecto si aplica)';

-- Create index for shipping queries (optional, for performance if needed)
CREATE INDEX IF NOT EXISTS idx_orders_shipping_cost ON public.orders(shipping_cost) WHERE shipping_cost > 0;

-- Verify the changes
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'orders' AND table_schema = 'public'
ORDER BY ordinal_position;
