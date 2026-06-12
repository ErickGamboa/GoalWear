import { createClient } from "@/lib/supabase/server"
import type { OrderWithItems } from "@/lib/types"
import { DespachoClient } from "./despacho-client"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function DespachoPage() {
  const supabase = await createClient()

  // Only "yellow" orders: taken and with inventory already processed (not reverted).
  const { data } = await supabase
    .from("orders")
    .select("*, order_items(*, products(image_url))")
    .eq("status", "taken")
    .eq("inventory_processed", true)
    .order("created_at", { ascending: false })

  const orders = (data ?? []) as OrderWithItems[]

  return <DespachoClient orders={orders} />
}
