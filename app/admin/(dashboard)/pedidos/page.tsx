import { createClient } from "@/lib/supabase/server"
import type { OrderWithItems } from "@/lib/types"
import { OrdersClient } from "./orders-client"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function OrdersPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("orders")
    .select("*, order_items(*, products(image_url))")
    .order("created_at", { ascending: false })

  const { data: patchesData } = await supabase
    .from("patches")
    .select("name, image_url")
    .order("name")

  const orders = (data ?? []) as OrderWithItems[]
  const patchMap = Object.fromEntries(
    (patchesData ?? []).map((patch) => [patch.name, patch.image_url])
  )

  return <OrdersClient orders={orders} patchMap={patchMap} />
}
