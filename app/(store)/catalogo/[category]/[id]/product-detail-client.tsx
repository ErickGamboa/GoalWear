"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { useCart } from "@/lib/cart-context"
import type { ProductWithSizes, Patch } from "@/lib/types"
import { ShoppingCart } from "lucide-react"
import { toast } from "sonner"

export function ProductDetailClient({
  product,
  patches,
}: {
  product: ProductWithSizes
  patches: Patch[]
}) {
  const { addItem } = useCart()
  const [selectedSize, setSelectedSize] = useState("")
  const [customName, setCustomName] = useState("")
  const [customNumber, setCustomNumber] = useState("")
  const [selectedPatches, setSelectedPatches] = useState<string[]>([])
  const [quantity, setQuantity] = useState(1)

  const isPreorder = product.category === "preorder"
  const isAccessory = product.category === "accessory"
  const sizes = product.product_sizes || []

  const selectedSizeData = sizes.find((s) => s.size === selectedSize)
  const isOutOfStock =
    !isPreorder && selectedSizeData ? selectedSizeData.stock < 1 : false

  const canAdd =
    (isAccessory || selectedSize) && !isOutOfStock && product.has_stock

  const patchTotal = selectedPatches.reduce((sum, pName) => {
    const patch = patches.find((p) => p.name === pName)
    return sum + (patch ? Number(patch.price) : 0)
  }, 0)

  const unitPrice = Number(product.price) + patchTotal

  function handleAddToCart() {
    if (!canAdd) return
    addItem({
      id: `${product.id}-${selectedSize}-${customName}-${customNumber}-${selectedPatches.join(",")}`,
      productId: product.id,
      productCode: product.code,
      productName: product.name,
      team: product.team,
      imageUrl: product.image_url,
      category: product.category,
      size: selectedSize,
      quantity,
      unitPrice,
      customName: isPreorder ? customName : undefined,
      customNumber: isPreorder ? customNumber : undefined,
      patches: isPreorder ? selectedPatches : undefined,
    })
    toast.success("Producto agregado al carrito")
  }

  function togglePatch(patchName: string) {
    setSelectedPatches((prev) =>
      prev.includes(patchName)
        ? prev.filter((p) => p !== patchName)
        : [...prev, patchName]
    )
  }

  return (
    <div className="grid gap-8 md:grid-cols-2">
      {/* Product Image */}
      <div className="aspect-square overflow-hidden rounded-xl bg-muted">
        {product.image_url ? (
          <img
            src={product.image_url || "/placeholder.svg"}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <span className="text-8xl font-bold opacity-10">JS</span>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="flex flex-col">
        <Badge variant="secondary" className="mb-2 w-fit text-xs">
          {product.code}
        </Badge>
        {product.team && (
          <p className="text-sm font-medium text-muted-foreground">
            {product.team}
          </p>
        )}
        <h1 className="mt-1 text-2xl font-bold text-foreground md:text-3xl">
          {product.name}
        </h1>
        <p className="mt-3 text-3xl font-bold text-primary">
          ${unitPrice.toFixed(2)}
        </p>
        {patchTotal > 0 && (
          <p className="text-sm text-muted-foreground">
            Precio base: ${Number(product.price).toFixed(2)} + Parches: $
            {patchTotal.toFixed(2)}
          </p>
        )}

        {!product.has_stock && (
          <Badge variant="destructive" className="mt-3 w-fit">
            Producto no disponible
          </Badge>
        )}

        {/* Sizes */}
        {sizes.length > 0 && (
          <div className="mt-6">
            <Label className="text-sm font-semibold text-foreground">Talla</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {sizes.map((s) => {
                const outOfStock = !isPreorder && s.stock < 1
                return (
                  <button
                    key={s.id}
                    type="button"
                    disabled={outOfStock}
                    onClick={() => setSelectedSize(s.size)}
                    className={`flex h-10 min-w-[2.5rem] items-center justify-center rounded-md border px-3 text-sm font-medium transition-colors ${
                      selectedSize === s.size
                        ? "border-primary bg-primary text-primary-foreground"
                        : outOfStock
                          ? "cursor-not-allowed border-border text-muted-foreground opacity-40"
                          : "border-border text-foreground hover:border-primary"
                    }`}
                  >
                    {s.size}
                    {!isPreorder && (
                      <span className="ml-1 text-[10px] opacity-60">
                        ({s.stock})
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Customization for preorder */}
        {isPreorder && (
          <div className="mt-6 space-y-4 rounded-lg border border-border p-4">
            <h3 className="text-sm font-semibold text-foreground">
              Personalizacion
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="custom-name" className="text-xs text-muted-foreground">
                  Nombre (opcional)
                </Label>
                <Input
                  id="custom-name"
                  placeholder="Ej: MESSI"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="custom-number" className="text-xs text-muted-foreground">
                  Numero (opcional)
                </Label>
                <Input
                  id="custom-number"
                  placeholder="Ej: 10"
                  value={customNumber}
                  onChange={(e) => setCustomNumber(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            {patches.length > 0 && (
              <div>
                <Label className="text-xs text-muted-foreground">Parches</Label>
                <div className="mt-2 space-y-2">
                  {patches.map((patch) => (
                    <label
                      key={patch.id}
                      className="flex cursor-pointer items-center gap-3 rounded-md border border-border p-2.5 transition-colors hover:bg-accent"
                    >
                      <Checkbox
                        checked={selectedPatches.includes(patch.name)}
                        onCheckedChange={() => togglePatch(patch.name)}
                      />
                      <div className="flex flex-1 items-center justify-between">
                        <span className="text-sm text-foreground">
                          {patch.name}
                        </span>
                        <span className="text-sm font-medium text-muted-foreground">
                          +${Number(patch.price).toFixed(2)}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Quantity + Add to Cart */}
        <div className="mt-6 flex items-center gap-3">
          <div className="flex items-center rounded-md border border-border">
            <button
              type="button"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="flex h-10 w-10 items-center justify-center text-foreground transition-colors hover:bg-accent"
            >
              -
            </button>
            <span className="flex h-10 w-10 items-center justify-center text-sm font-medium text-foreground">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity(quantity + 1)}
              className="flex h-10 w-10 items-center justify-center text-foreground transition-colors hover:bg-accent"
            >
              +
            </button>
          </div>

          <Button
            className="flex-1"
            size="lg"
            disabled={!canAdd}
            onClick={handleAddToCart}
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            Agregar al Carrito
          </Button>
        </div>
      </div>
    </div>
  )
}
