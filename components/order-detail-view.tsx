import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CATEGORY_LABELS } from "@/lib/types"
import { formatCurrency, cn } from "@/lib/utils"
import Image from "next/image"
import { PatchSelector } from "@/app/admin/(dashboard)/pedidos/[id]/patch-selector"
import { ItemEditor } from "@/app/admin/(dashboard)/pedidos/[id]/item-editor"

const KIDS_SIZE_DISPLAY: Record<string, string> = {
  XXS: "16 = 2-3 años",
  XS: "18 = 4-5 años",
  S: "20 = 6-7 años",
  M: "22 = 7-8 años",
  L: "24 = 8-9 años",
  XL: "26 = 9-10 años",
  XXL: "28 = 11-12 años",
}

function formatSize(productName: string, size: string) {
  const isKids = productName.toLowerCase().includes("niñ")
  if (isKids && KIDS_SIZE_DISPLAY[size]) {
    return KIDS_SIZE_DISPLAY[size]
  }
  return size
}

type Props = {
  order: any
  patchesData: { name: string; image_url: string | null }[]
  patchMap: Record<string, string | null>
  /** Read-only: hides patch editing and the per-item "Editar" action (e.g. Despacho, where the order is already confirmed). */
  readOnly?: boolean
}

/**
 * Presentational body of an order detail (client cards, preorder table, other items).
 * Shared by the Pedidos and Despacho detail pages — each renders its own header/actions.
 */
export function OrderDetailView({ order, patchesData, patchMap, readOnly = false }: Props) {
  const preorderItems = order.order_items.filter((item: any) => item.category === "preorder")
  const otherItems = order.order_items.filter((item: any) => item.category !== "preorder")

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground">Datos del Cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Nombre</span>
              <span className="font-medium text-foreground">
                {order.customer_name}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email</span>
              <span className="text-foreground">{order.customer_email}</span>
            </div>
            {order.customer_phone && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Telefono</span>
                <span className="text-foreground">
                  {order.customer_phone}
                </span>
              </div>
            )}
            {order.customer_address && (
              <>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    Con envio a domicilio
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Direccion</span>
                  <span className="text-right text-foreground">
                    {order.customer_address}
                  </span>
                </div>
              </>
            )}
            {order.notes && (
              <>
                <Separator />
                <div>
                  <span className="text-muted-foreground">Notas:</span>
                  <p className="mt-1 text-foreground">{order.notes}</p>
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
                  {formatCurrency(Number(order.total) - Number(order.shipping_cost || 0))}
                </span>
              </div>
              {order.shipping_cost > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Envio</span>
                  <span className="text-foreground">
                    {formatCurrency(Number(order.shipping_cost))}
                  </span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between">
                <span className="font-semibold text-foreground">Total</span>
                <span className="text-2xl font-bold text-foreground">
                  {formatCurrency(Number(order.total))}
                </span>
              </div>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              {order.order_items.length} producto
              {order.order_items.length !== 1 ? "s" : ""}
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
                    {!readOnly && <th className="p-4 text-right text-foreground print:hidden">Acciones</th>}
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
                          {(() => {
                            const competitionInfo =
                              item.patches?.[0] && !patchMap[item.patches[0]]
                                ? item.patches[0]
                                : null;
                            const patchStartIndex = competitionInfo !== null ? 1 : 0;
                            return (
                              <>
                                {competitionInfo && (
                                  <div className="mb-3 rounded-lg bg-primary/10 border border-primary/20 px-3 py-2">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-primary/70 mb-0.5">
                                      Competicion
                                    </p>
                                    <p className="text-sm font-bold text-primary">
                                      {competitionInfo}
                                    </p>
                                  </div>
                                )}
                                <div className="flex flex-wrap gap-3">
                                  {[0, 1].map((slotIndex) => {
                                    const patchArrayIndex = patchStartIndex + slotIndex;
                                    const patchName = item.patches?.[patchArrayIndex] ?? null;
                                    if (readOnly) {
                                      if (!patchName) return null;
                                      const patchImageUrl = patchMap[patchName] ?? null;
                                      return (
                                        <div
                                          key={`${item.id}-${patchArrayIndex}`}
                                          className="relative h-40 w-40 overflow-hidden rounded-lg border border-border bg-white shadow-sm"
                                          title={patchName}
                                        >
                                          {patchImageUrl ? (
                                            <Image
                                              src={patchImageUrl}
                                              alt={patchName}
                                              fill
                                              className="object-contain p-2"
                                            />
                                          ) : (
                                            <div className="flex h-full w-full items-center justify-center bg-muted text-xs font-bold">
                                              {patchName}
                                            </div>
                                          )}
                                        </div>
                                      );
                                    }
                                    return (
                                      <PatchSelector
                                        key={`${item.id}-${patchArrayIndex}`}
                                        orderItemId={item.id}
                                        patchIndex={patchArrayIndex}
                                        currentPatchName={patchName}
                                        patchImageUrl={patchName ? patchMap[patchName] ?? null : null}
                                        allPatches={patchesData || []}
                                      />
                                    );
                                  })}
                                  {readOnly &&
                                    !item.patches?.[patchStartIndex] &&
                                    !item.patches?.[patchStartIndex + 1] && (
                                      <span className="text-sm text-muted-foreground">Sin parche</span>
                                    )}
                                </div>
                              </>
                            );
                          })()}
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
                                {formatSize(item.product_name, item.size)}
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
                        {!readOnly && (
                          <td className="p-4 text-right print:hidden">
                            <ItemEditor
                              orderItemId={item.id}
                              productId={item.product_id}
                              productName={item.product_name}
                              initialCustomName={item.custom_name}
                              initialCustomNumber={item.custom_number}
                              initialSize={item.size}
                              initialQuantity={item.quantity}
                              triggerLabel="Editar"
                            />
                          </td>
                        )}
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
                      {item.size && ` | Talla: ${formatSize(item.product_name, item.size)}`}
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
    </>
  )
}
