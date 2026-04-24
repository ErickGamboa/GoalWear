-- Agrega columna sort_order a productos para controlar el orden de display
ALTER TABLE products ADD COLUMN IF NOT EXISTS sort_order INTEGER;
CREATE INDEX IF NOT EXISTS idx_products_sort_order ON products (sort_order NULLS LAST);
