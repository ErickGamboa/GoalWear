import { createClient } from "@/lib/supabase/server"
import type { OrderWithItems } from "@/lib/types"
import { OrdersClient } from "./orders-client"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function OrdersPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .order("created_at", { ascending: false })

  const orders = (data ?? []) as OrderWithItems[]

  return <OrdersClient orders={orders} />
}