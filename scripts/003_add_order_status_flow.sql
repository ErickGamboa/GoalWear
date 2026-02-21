-- Migration: Add order status flow (pending -> taken -> delivered)
-- Date: 2026-02-20

-- First, migrate existing 'completed' orders to 'delivered'
UPDATE public.orders 
SET status = 'delivered' 
WHERE status = 'completed';

-- Drop existing constraint if exists
ALTER TABLE public.orders 
DROP CONSTRAINT IF EXISTS orders_status_check;

-- Add new status constraint with three states
ALTER TABLE public.orders 
ADD CONSTRAINT orders_status_check 
CHECK (status IN ('pending', 'taken', 'delivered'));

-- Add comment for documentation
COMMENT ON COLUMN public.orders.status IS 'pending: nuevo pedido, taken: pedido tomado (amarillo), delivered: pedido entregado (verde)';
