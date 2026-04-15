export type SportType = "soccer" | "basketball" | "football" | "formula1" | "baseball"
export type SoccerType = "club" | "selection"

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
  sport: SportType
  soccer_type: SoccerType | null
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

export const SPORT_OPTIONS: { id: SportType; label: string; slug: string }[] = [
  {
    id: "soccer",
    label: "Fútbol",
    slug: "futbol",
  },
  {
    id: "basketball",
    label: "Baloncesto",
    slug: "basketball",
  },
  {
    id: "football",
    label: "Fútbol americano",
    slug: "football",
  },
  {
    id: "formula1",
    label: "Fórmula 1",
    slug: "formula-1",
  },
  {
    id: "baseball",
    label: "Béisbol",
    slug: "baseball",
  },
]

export const SPORT_SLUG_TO_ID: Record<string, SportType> = SPORT_OPTIONS.reduce((acc, option) => {
  acc[option.slug] = option.id
  return acc
}, {} as Record<string, SportType>)

export const SPORT_ID_TO_SLUG: Record<SportType, string> = SPORT_OPTIONS.reduce((acc, option) => {
  acc[option.id] = option.slug
  return acc
}, {} as Record<SportType, string>)

export const SPORT_LABELS: Record<SportType, string> = SPORT_OPTIONS.reduce((acc, option) => {
  acc[option.id] = option.label
  return acc
}, {} as Record<SportType, string>)

export type Order = {
  id: string
  customer_name: string
  customer_email: string
  customer_phone: string | null
  customer_address: string | null
  total: number
  shipping_cost: number
  notes: string | null
  inventory_processed: boolean
  status: 'pending' | 'taken' | 'delivered'
  created_at: string
}

export type OrderItem = {
  id: string
  order_id: string
  product_id: string | null
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
