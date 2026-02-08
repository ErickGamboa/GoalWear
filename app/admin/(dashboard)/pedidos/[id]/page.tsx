import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import type { OrderWithItems } from "@/lib/types"
import { CATEGORY_LABELS } from "@/lib/types"

type Props = {
  params: Promise<{ id: string }>
}

export default async function OrderDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: order } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("id", id)
    .single()

  if (!order) notFound()

  const typedOrder = order as OrderWithItems

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Button asChild variant="outline" size="icon">
          <Link href="/admin/pedidos">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold text-foreground">
          Pedido
        </h1>
        <span className="text-sm text-muted-foreground">
          {new Date(typedOrder.created_at).toLocaleDateString("es-MX", {
            day: "2-digit",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground">Datos del Cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Nombre</span>
              <span className="font-medium text-foreground">
                {typedOrder.customer_name}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email</span>
              <span className="text-foreground">{typedOrder.customer_email}</span>
            </div>
            {typedOrder.customer_phone && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Telefono</span>
                <span className="text-foreground">
                  {typedOrder.customer_phone}
                </span>
              </div>
            )}
            {typedOrder.customer_address && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Direccion</span>
                <span className="text-right text-foreground">
                  {typedOrder.customer_address}
                </span>
              </div>
            )}
            {typedOrder.notes && (
              <>
                <Separator />
                <div>
                  <span className="text-muted-foreground">Notas:</span>
                  <p className="mt-1 text-foreground">{typedOrder.notes}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-foreground">Resumen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              ${Number(typedOrder.total).toFixed(2)}
            </div>
            <p className="text-sm text-muted-foreground">
              {typedOrder.order_items.length} producto
              {typedOrder.order_items.length !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-foreground">Productos del Pedido</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {typedOrder.order_items.map((item) => (
              <div
                key={item.id}
                className="flex items-start justify-between rounded-lg border border-border p-3"
              >
                <div>
                  <p className="font-medium text-foreground">
                    {item.product_name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {item.product_code}
                    {item.size && ` | Talla: ${item.size}`}
                    {" | x"}
                    {item.quantity}
                  </p>
                  <Badge variant="secondary" className="mt-1 text-xs">
                    {CATEGORY_LABELS[item.category] || item.category}
                  </Badge>
                  {item.custom_name && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      Personalizacion: {item.custom_name} #{item.custom_number}
                    </p>
                  )}
                  {item.patches && item.patches.length > 0 && (
                    <p className="text-sm text-muted-foreground">
                      Parches: {item.patches.join(", ")}
                    </p>
                  )}
                </div>
                <span className="text-sm font-bold text-foreground">
                  ${Number(item.subtotal).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
