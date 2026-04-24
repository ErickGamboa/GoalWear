import { createClient } from "@/lib/supabase/server"
import type { Product } from "@/lib/types"
import { ProductsClient } from "./products-client"

const PAGE = 1000

export default async function ProductsPage() {
  const supabase = await createClient()

  const all: Product[] = []
  let from = 0

  while (true) {
    const { data } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false })
      .range(from, from + PAGE - 1)

    if (!data?.length) break
    all.push(...(data as Product[]))
    if (data.length < PAGE) break
    from += PAGE
  }

  return <ProductsClient products={all} />
}
