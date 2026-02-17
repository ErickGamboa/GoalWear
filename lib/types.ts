export type Product = {
  id: string
  code: string
  name: string
  team: string | null
  price: number
  image_url: string | null
  image_url_2: string | null
  image_url_3: string | null
  category: "immediate" | "preorder" | "accessory"
  has_stock: boolean
  created_at: string
}

export type ProductSize = {
  id: string
  product_id: string
  size: string
  stock: number
}

export type Patch = {
  id: string
  name: string
  price: number
  image_url: string | null
}

export type ProductWithSizes = Product & {
  product_sizes: ProductSize[]
}

export type Order = {
  id: string
  customer_name: string
  customer_email: string
  customer_phone: string | null
  customer_address: string | null
  total: number
  notes: string | null
  created_at: string
}

export type OrderItem = {
  id: string
  order_id: string
  product_id: string
  product_code: string
  product_name: string
  quantity: number
  size: string | null
  custom_name: string | null
  custom_number: string | null
  patches: string[] | null
  unit_price: number
  subtotal: number
  category: string
}

export type OrderWithItems = Order & {
  order_items: OrderItem[]
}

export const CATEGORY_LABELS: Record<string, string> = {
  immediate: "Entrega Inmediata",
  preorder: "Pedido Previo",
  accessory: "Accesorios",
}

export const CATEGORY_SLUGS: Record<string, string> = {
  immediate: "entrega-inmediata",
  preorder: "pedido-previo",
  accessory: "accesorios",
}

export const SLUG_TO_CATEGORY: Record<string, string> = {
  "entrega-inmediata": "immediate",
  "pedido-previo": "preorder",
  accesorios: "accessory",
}
