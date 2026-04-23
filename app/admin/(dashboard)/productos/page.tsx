import { createClient } from "@/lib/supabase/server"
import type { Product } from "@/lib/types"
import { ProductsClient } from "./products-client"

export default async function ProductsPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false })

  const products = (data ?? []) as Product[]

  return <ProductsClient products={products} />
}
