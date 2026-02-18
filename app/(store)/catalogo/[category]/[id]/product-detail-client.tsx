"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { useCart } from "@/lib/cart-context"
import { createClient } from "@/lib/supabase/client"
import type { ProductWithSizes, Patch } from "@/lib/types"
import { ShoppingCart, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { formatCurrency, cn } from "@/lib/utils"

export function ProductDetailClient({
  product,
  patches,
}: {
  product: ProductWithSizes
  patches: Patch[]
}) {
  const router = useRouter()
  const { addItem, items: cartItems } = useCart()
  const [selectedSize, setSelectedSize] = useState("")
  const [customName, setCustomName] = useState("")
  const [customNumber, setCustomNumber] = useState("")
  const [selectedPatches, setSelectedPatches] = useState<string[]>([])
  const [quantity, setQuantity] = useState(1)
  const [activeImage, setActiveImage] = useState(product.image_url)
  const [zoomStyle, setZoomStyle] = useState<React.CSSProperties>({ display: 'none' })
  const [isValidating, setIsValidating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  const images = [
    product.image_url,
    product.image_url_2,
    product.image_url_3,
  ].filter(Boolean) as string[]

  const isPreorder = product.category === "preorder"
  const isAccessory = product.category === "accessory"
  
  const JERSEY_SIZES = ["XS", "S", "M", "L", "XL", "XXL"]
  
  // Logic for display sizes
  const displaySizes = isPreorder 
    ? JERSEY_SIZES.map(size => ({ 
        id: size, 
        size: size, 
        stock: 999 
      }))
    : (product.product_sizes || [])

  const selectedSizeData = displaySizes.find((s) => s.size === selectedSize)
  const availableStock = selectedSizeData?.stock || 0
  const isOutOfStock =
    !isPreorder && selectedSizeData ? selectedSizeData.stock < 1 : false

  const canAdd =
    !isValidating &&
    ((isAccessory && selectedSize.trim() !== "") || (selectedSize && (isPreorder || availableStock >= quantity))) && 
    !isOutOfStock && 
    product.has_stock

  const patchTotal = 0 

  const unitPrice = Number(product.price)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return
    
    const { left, top, width, height } = containerRef.current.getBoundingClientRect()
    const x = ((e.pageX - left - window.scrollX) / width) * 100
    const y = ((e.pageY - top - window.scrollY) / height) * 100
    
    setZoomStyle({
      display: 'block',
      backgroundImage: `url(${activeImage})`,
      backgroundPosition: `${x}% ${y}%`,
      backgroundSize: '250%', 
    })
  }

  const handleMouseLeave = () => {
    setZoomStyle({ display: 'none' })
  }

  async function handleAddToCart() {
    if (!canAdd) return

    // Final Validation against DB before adding
    if (!isPreorder && !isAccessory) {
      setIsValidating(true)
      try {
        const { data, error } = await supabase
          .from("product_sizes")
          .select("stock")
          .eq("product_id", product.id)
          .eq("size", selectedSize)
          .single()

        if (error) throw error
        
        const dbStock = data.stock
        const inCart = cartItems
          .filter(item => item.productId === product.id && item.size === selectedSize)
          .reduce((sum, item) => sum + item.quantity, 0)

        if (dbStock < (quantity + inCart)) {
          toast.error(`Solo quedan ${dbStock} unidades disponibles (tienes ${inCart} en el carrito)`)
          return
        }
      } catch (err) {
        toast.error("Error al verificar stock")
        return
      } finally {
        setIsValidating(false)
      }
    }

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
    router.refresh()
  }

  function togglePatch(patchName: string) {
    setSelectedPatches((prev) => {
      const isSelected = prev.includes(patchName)
      if (isSelected) {
        return prev.filter((p) => p !== patchName)
      }
      if (prev.length >= 2) {
        toast.error("Máximo 2 parches por camiseta")
        return prev
      }
      return [...prev, patchName]
    })
  }

  return (
    <div className="grid gap-8 md:grid-cols-2">
      {/* Product Images */}
      <div className="space-y-4">
        <div 
          ref={containerRef}
          className="relative aspect-square overflow-hidden rounded-xl bg-muted border border-border cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {activeImage ? (
            <>
              <img
                src={activeImage}
                alt={product.name}
                className="h-full w-full object-cover transition-all"
              />
              {/* Zoom Overlay (Desktop only) */}
              <div 
                className="absolute inset-0 z-10 hidden md:block pointer-events-none"
                style={zoomStyle}
              />
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              <span className="text-8xl font-bold opacity-10">GW</span>
            </div>
          )}
        </div>

        {images.length > 1 && (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {images.map((img, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActiveImage(img)}
                className={`relative aspect-square w-20 overflow-hidden rounded-lg border-2 transition-all ${
                  activeImage === img
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-transparent hover:border-border"
                }`}
              >
                <img
                  src={img}
                  alt={`${product.name} thumbnail ${i + 1}`}
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
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
          {formatCurrency(unitPrice)}
        </p>
        {patchTotal > 0 && (
          <p className="text-sm text-muted-foreground">
            Precio base: {formatCurrency(Number(product.price))} + Parches: {formatCurrency(patchTotal)}
          </p>
        )}

        {!product.has_stock && (
          <Badge variant="destructive" className="mt-3 w-fit">
            Producto no disponible
          </Badge>
        )}

        {/* Sizes */}
        {displaySizes.length > 0 && !isAccessory && (
          <div className="mt-6">
            <Label className="text-sm font-semibold text-foreground">Talla</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {displaySizes.map((s) => {
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

        {/* Custom Size for Accessories */}
        {isAccessory && (
          <div className="mt-6">
            <Label htmlFor="custom-size" className="text-sm font-semibold text-foreground">
              Especificar Talla o Tamaño
            </Label>
            <Input
              id="custom-size"
              placeholder="Ej: M, Única, Ajustable..."
              value={selectedSize}
              onChange={(e) => setSelectedSize(e.target.value)}
              className="mt-2"
            />
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
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Selecciona tus Parches (Máx. 2)
                </Label>
                <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
                  {patches.map((patch) => {
                    const isSelected = selectedPatches.includes(patch.name)
                    return (
                      <button
                        key={patch.id}
                        type="button"
                        onClick={() => togglePatch(patch.name)}
                        className={cn(
                          "relative aspect-square overflow-hidden rounded-lg border-2 p-1 transition-all",
                          isSelected 
                            ? "border-primary bg-primary/5 ring-2 ring-primary/20" 
                            : "border-border hover:border-muted-foreground/50"
                        )}
                      >
                        {patch.image_url ? (
                          <img
                            src={patch.image_url}
                            alt={patch.name}
                            className="h-full w-full object-contain"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[10px] text-center font-medium leading-tight">
                            {patch.name}
                          </div>
                        )}
                        {isSelected && (
                          <div className="absolute top-1 right-1 bg-primary text-primary-foreground rounded-full p-0.5">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
                {selectedPatches.length > 0 && (
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    Seleccionados: <span className="font-medium text-foreground">{selectedPatches.join(", ")}</span>
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Quantity + Add to Cart */}
        <div className="mt-6 flex flex-col gap-3">
          {!isPreorder && !isAccessory && selectedSize && (
            <p className={cn(
              "text-xs font-medium",
              availableStock < 5 ? "text-destructive" : "text-muted-foreground"
            )}>
              {availableStock > 0 
                ? `Disponibles: ${availableStock} unidades` 
                : "Sin stock disponible"}
            </p>
          )}
          <div className="flex items-center gap-3">
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
                disabled={!isPreorder && !isAccessory && quantity >= availableStock}
                onClick={() => setQuantity(quantity + 1)}
                className="flex h-10 w-10 items-center justify-center text-foreground transition-colors hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed"
              >
                +
              </button>
            </div>

            <Button
              className="flex-1"
              size="lg"
              disabled={!canAdd || isValidating}
              onClick={handleAddToCart}
            >
              {isValidating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ShoppingCart className="mr-2 h-4 w-4" />
              )}
              {isOutOfStock ? "Agotado" : isValidating ? "Validando..." : "Agregar al Carrito"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
