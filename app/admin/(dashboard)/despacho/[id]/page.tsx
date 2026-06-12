import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { OrderDetailView } from "@/components/order-detail-view"
import { DispatchDeliverButton } from "./dispatch-deliver-button"

type Props = {
  params: Promise<{ id: string }>
}

export default async function DespachoDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: order } = await supabase
    .from("orders")
    .select("*, order_items(*, products(image_url))")
    .eq("id", id)
    .order("id", { referencedTable: "order_items", ascending: true })
    .single()

  const { data: patchesData } = await supabase
    .from("patches")
    .select("name, image_url")
    .order("name")

  const patchMap = Object.fromEntries(
    patchesData?.map((p) => [p.name, p.image_url]) || []
  )

  if (!order) notFound()

  const typedOrder = order as any

  // Already delivered (or reverted) → it's no longer part of Despacho.
  if (typedOrder.status !== "taken") {
    redirect("/admin/despacho")
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <Button asChild variant="outline" size="icon">
          <Link href="/admin/despacho">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold text-foreground">Despachar pedido</h1>
        <span className="text-sm text-muted-foreground">
          {new Date(typedOrder.created_at).toLocaleDateString("es-MX", {
            day: "2-digit",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
        <div className="ml-auto">
          <DispatchDeliverButton orderId={typedOrder.id} />
        </div>
      </div>

      <OrderDetailView order={typedOrder} patchesData={patchesData || []} patchMap={patchMap} readOnly />
    </div>
  )
}
