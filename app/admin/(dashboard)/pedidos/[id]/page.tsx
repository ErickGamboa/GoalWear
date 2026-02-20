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
import { formatCurrency, cn } from "@/lib/utils"
import Image from "next/image"

type Props = {
  params: Promise<{ id: string }>
}

export default async function OrderDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: order } = await supabase
    .from("orders")
    .select("*, order_items(*, products(image_url))")
    .eq("id", id)
    .single()

  const { data: patchesData } = await supabase
    .from("patches")
    .select("name, image_url")

  const patchMap = Object.fromEntries(
    patchesData?.map((p) => [p.name, p.image_url]) || []
  )

  if (!order) notFound()

  const typedOrder = order as any // Using any to handle the joined product data easily

  const preorderItems = typedOrder.order_items.filter((item: any) => item.category === "preorder")
  const otherItems = typedOrder.order_items.filter((item: any) => item.category !== "preorder")

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
              <>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    Con envio a domicilio
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Direccion</span>
                  <span className="text-right text-foreground">
                    {typedOrder.customer_address}
                  </span>
                </div>
              </>
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
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="text-foreground">
                  {formatCurrency(Number(typedOrder.total) - Number(typedOrder.shipping_cost || 0))}
                </span>
              </div>
              {typedOrder.shipping_cost > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Envio</span>
                  <span className="text-foreground">
                    {formatCurrency(Number(typedOrder.shipping_cost))}
                  </span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between">
                <span className="font-semibold text-foreground">Total</span>
                <span className="text-2xl font-bold text-foreground">
                  {formatCurrency(Number(typedOrder.total))}
                </span>
              </div>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              {typedOrder.order_items.length} producto
              {typedOrder.order_items.length !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>
      </div>

      {preorderItems.length > 0 && (
        <Card className="mt-6 border-primary/20">
          <CardHeader className="bg-primary/5">
            <CardTitle className="text-primary flex items-center gap-2 text-xl">
              Camisetas - Pedido Previo
              <Badge>{preorderItems.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-border bg-muted/50 text-xs font-bold uppercase tracking-wider">
                    <th className="p-4 text-foreground">Producto</th>
                    <th className="p-4 text-foreground">IMAGE OF T-Shirt</th>
                    <th className="p-4 text-foreground">PATCH</th>
                    <th className="p-4 text-foreground">Name</th>
                    <th className="p-4 text-foreground">Characteristics</th>
                    <th className="p-4 text-right text-foreground">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {preorderItems.map((item: any) => {
                    const isPlayerVersion = item.product_name.toLowerCase().includes("player");
                    
                    return (
                      <tr key={item.id} className="hover:bg-muted/30">
                        <td className="p-4 min-w-[200px]">
                          <div className="font-bold text-base text-foreground">{item.product_name}</div>
                          <div className="text-sm text-muted-foreground font-mono">{item.product_code}</div>
                        </td>
                        <td className="p-4">
                          {item.products?.image_url ? (
                            <div className="relative h-48 w-48 overflow-hidden rounded-lg border-2 border-border shadow-sm bg-white">
                              <Image
                                src={item.products.image_url}
                                alt={item.product_name}
                                fill
                                className="object-contain"
                              />
                            </div>
                          ) : (
                            <div className="flex h-40 w-40 items-center justify-center rounded-lg bg-muted text-xs text-muted-foreground border border-dashed">
                              Sin imagen
                            </div>
                          )}
                        </td>
                        <td className="p-4">
                          {item.patches && item.patches.length > 0 ? (
                            <div className="flex flex-wrap gap-3">
                              {item.patches.map((patchName: string) => (
                                <div 
                                  key={patchName} 
                                  title={patchName}
                                  className="relative h-24 w-24 overflow-hidden rounded-md border border-border bg-white shadow-sm"
                                >
                                  {patchMap[patchName] ? (
                                    <Image
                                      src={patchMap[patchName]}
                                      alt={patchName}
                                      fill
                                      className="object-contain p-1"
                                    />
                                  ) : (
                                    <div className="flex h-full w-full items-center justify-center bg-muted text-[10px]">
                                      {patchName}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground italic">Ninguno</span>
                          )}
                        </td>
                        <td className="p-4">
                          <span className="text-xl font-black text-foreground uppercase tracking-widest">
                            {item.custom_name || "-"}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground w-20">Size:</span>
                              <Badge variant="outline" className="text-sm font-bold px-3">
                                {item.size}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground w-20">Version:</span>
                              <span className={cn("font-bold px-2 py-0.5 rounded text-xs uppercase", 
                                isPlayerVersion ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800")}>
                                {isPlayerVersion ? "Player" : "Fan"}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground w-20">Numero:</span>
                              <span className="text-lg font-black text-primary">
                                {item.custom_number || "N/A"}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground w-20">Cantidad:</span>
                              <span className="font-bold">{item.quantity}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-right font-bold text-lg text-foreground">
                          {formatCurrency(Number(item.subtotal))}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {otherItems.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-foreground">Productos del Pedido</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {otherItems.map((item: any) => (
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
                    {formatCurrency(Number(item.subtotal))}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
