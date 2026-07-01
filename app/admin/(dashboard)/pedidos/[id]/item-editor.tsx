"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Pencil, Loader2, Search, Check } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { updateOrderItemDetails, listProductsForPicker } from "./item-actions"

type PickerProduct = {
  id: string
  code: string
  name: string
  price: number
  category: string
}

// Color-coded category tags so the admin can tell immediate vs preorder apart at a glance.
const CATEGORY_TAG: Record<string, { label: string; className: string }> = {
  immediate: { label: "Entrega Inmediata", className: "bg-green-100 text-green-800" },
  preorder: { label: "Pedido Previo", className: "bg-blue-100 text-blue-800" },
  accessory: { label: "Accesorios", className: "bg-purple-100 text-purple-800" },
}

type Props = {
  orderItemId: string
  productId: string
  productName: string
  initialCustomName: string | null
  initialCustomNumber: string | null
  initialSize: string | null
  initialQuantity: number
  triggerLabel?: string
}

export function ItemEditor({
  orderItemId,
  productId,
  productName,
  initialCustomName,
  initialCustomNumber,
  initialSize,
  initialQuantity,
  triggerLabel = "Editar",
}: Props) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [customName, setCustomName] = React.useState(initialCustomName ?? "")
  const [customNumber, setCustomNumber] = React.useState(initialCustomNumber ?? "")
  const [size, setSize] = React.useState(initialSize ?? "")
  const [quantity, setQuantity] = React.useState(String(initialQuantity ?? 1))

  // Product picker state
  const [selectedProductId, setSelectedProductId] = React.useState(productId)
  const [selectedProductName, setSelectedProductName] = React.useState(productName)
  const [changingProduct, setChangingProduct] = React.useState(false)
  const [products, setProducts] = React.useState<PickerProduct[]>([])
  const [productsLoading, setProductsLoading] = React.useState(false)
  const [productSearch, setProductSearch] = React.useState("")

  React.useEffect(() => {
    if (open) {
      setCustomName(initialCustomName ?? "")
      setCustomNumber(initialCustomNumber ?? "")
      setSize(initialSize ?? "")
      setQuantity(String(initialQuantity ?? 1))
      setSelectedProductId(productId)
      setSelectedProductName(productName)
      setChangingProduct(false)
      setProductSearch("")
    }
  }, [open, initialCustomName, initialCustomNumber, initialSize, initialQuantity, productId, productName])

  // Lazy-load the product list the first time the picker is opened.
  React.useEffect(() => {
    if (!changingProduct || products.length > 0 || productsLoading) return
    setProductsLoading(true)
    listProductsForPicker()
      .then((result) => {
        if (result.error) {
          toast.error(result.error)
          return
        }
        setProducts(result.products as PickerProduct[])
      })
      .catch(() => toast.error("Error al cargar productos"))
      .finally(() => setProductsLoading(false))
  }, [changingProduct, products.length, productsLoading])

  const filteredProducts = React.useMemo(() => {
    const q = productSearch.trim().toLowerCase()
    if (!q) return products
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q)
    )
  }, [products, productSearch])

  const productChanged = selectedProductId !== productId

  async function handleSave() {
    const qty = Math.max(1, Math.floor(Number(quantity) || 1))
    setSaving(true)
    try {
      const result = await updateOrderItemDetails(orderItemId, {
        customName: customName || null,
        customNumber: customNumber || null,
        size: size || null,
        quantity: qty,
        productId: productChanged ? selectedProductId : null,
      })
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Cambios guardados")
        router.refresh()
        setOpen(false)
      }
    } catch {
      toast.error("Error inesperado al guardar")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Pencil className="h-3.5 w-3.5" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader className="min-w-0">
          <DialogTitle className="truncate">Editar {productName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 min-w-0">
          <div className="space-y-1.5 min-w-0">
            <Label>Producto</Label>
            <div className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {selectedProductName}
                </p>
                {productChanged && (
                  <p className="text-xs text-amber-600">Producto cambiado (sin guardar)</p>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setChangingProduct((v) => !v)}
              >
                {changingProduct ? "Cerrar" : "Cambiar"}
              </Button>
            </div>

            {changingProduct && (
              <div className="min-w-0 rounded-md border border-border p-2">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    autoFocus
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Buscar por nombre o identificador"
                    className="pl-8"
                  />
                </div>
                <div className="mt-2 max-h-56 overflow-y-auto">
                  {productsLoading ? (
                    <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Cargando productos...
                    </div>
                  ) : filteredProducts.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">
                      No se encontraron productos
                    </p>
                  ) : (
                    <ul className="divide-y divide-border">
                      {filteredProducts.map((p) => {
                        const isSelected = p.id === selectedProductId
                        return (
                          <li key={p.id}>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedProductId(p.id)
                                setSelectedProductName(p.name)
                                setChangingProduct(false)
                              }}
                              className={cn(
                                "flex w-full items-center justify-between gap-2 px-2 py-2 text-left text-sm hover:bg-muted/60",
                                isSelected && "bg-muted"
                              )}
                            >
                              <span className="min-w-0">
                                <span className="block truncate font-medium text-foreground">
                                  {p.name}
                                </span>
                                <span className="mt-0.5 flex items-center gap-2">
                                  <span className="truncate font-mono text-xs text-muted-foreground">
                                    {p.code}
                                  </span>
                                  {CATEGORY_TAG[p.category] && (
                                    <span
                                      className={cn(
                                        "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium",
                                        CATEGORY_TAG[p.category].className
                                      )}
                                    >
                                      {CATEGORY_TAG[p.category].label}
                                    </span>
                                  )}
                                </span>
                              </span>
                              {isSelected && <Check className="h-4 w-4 shrink-0 text-primary" />}
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={`name-${orderItemId}`}>Name</Label>
            <Input
              id={`name-${orderItemId}`}
              value={customName}
              onChange={(e) => setCustomName(e.target.value.toUpperCase())}
              placeholder="Nombre personalizado"
              maxLength={40}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor={`number-${orderItemId}`}>Numero</Label>
              <Input
                id={`number-${orderItemId}`}
                value={customNumber}
                onChange={(e) => setCustomNumber(e.target.value)}
                placeholder="Ej. 10"
                maxLength={4}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`size-${orderItemId}`}>Size</Label>
              <Input
                id={`size-${orderItemId}`}
                value={size}
                onChange={(e) => setSize(e.target.value.toUpperCase())}
                placeholder="S, M, L, XL..."
                maxLength={8}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`qty-${orderItemId}`}>Cantidad</Label>
            <Input
              id={`qty-${orderItemId}`}
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Cambiar la cantidad recalcula el subtotal y el total del pedido.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setOpen(false)}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button type="button" onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              "Guardar"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
