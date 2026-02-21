"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useCart } from "@/lib/cart-context"
import { createClient } from "@/lib/supabase/client"
import type { ProductWithSizes, Patch } from "@/lib/types"
import { ShoppingCart, Loader2, Lightbulb } from "lucide-react"
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
  const isPlayerType = product.name.toLowerCase().includes("player")

  const JERSEY_SIZES = ["XS", "S", "M", "L", "XL", "XXL"]
  
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
        toast.error("Maximo 2 parches por camiseta")
        return prev
      }
      return [...prev, patchName]
    })
  }

  return (
    <div className="grid gap-8 md:grid-cols-2 md:gap-12">
      <div className="animate-in fade-in slide-in-from-left-4 duration-500 space-y-4">
        <div 
          ref={containerRef}
          className="relative aspect-square overflow-hidden rounded-2xl bg-muted/50 border border-border/50 cursor-crosshair group"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {activeImage ? (
            <img
              src={activeImage}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              <span className="text-8xl font-bold opacity-10">GW</span>
            </div>
          )}
          
          <div 
            className="absolute inset-0 z-10 hidden md:block pointer-events-none rounded-2xl border-2 border-foreground/10"
            style={zoomStyle}
          />
        </div>

        {images.length > 1 && (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {images.map((img, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActiveImage(img)}
                className={cn(
                  "relative aspect-square w-20 overflow-hidden rounded-xl border-2 transition-all shrink-0 hover:scale-105",
                  activeImage === img
                    ? "border-foreground scale-105 shadow-lg shadow-black/10"
                    : "border-transparent hover:border-border"
                )}
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

      <div className="animate-in fade-in slide-in-from-right-4 duration-500 flex flex-col">
        <Badge variant="outline" className="w-fit font-mono text-xs font-bold uppercase tracking-widest px-3 py-1 bg-muted/30">
          {product.code}
        </Badge>
        
        {product.team && (
          <p className="mt-2 text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground">
            {product.team}
          </p>
        )}
        
        <h1 className="mt-2 text-3xl font-black text-foreground md:text-4xl leading-tight">
          {product.name}
        </h1>
        
        <div className="mt-4 flex items-baseline gap-3">
          <span className="text-3xl font-black text-foreground">
            {formatCurrency(unitPrice)}
          </span>
          {isPreorder && (
            <Badge variant="outline" className="text-xs font-bold">
              Incluye Personalizacion
            </Badge>
          )}
        </div>

        {!product.has_stock && (
          <div className="mt-6 flex items-center gap-2 rounded-xl bg-muted/50 p-4 text-muted-foreground border border-border/50">
            <span className="font-bold uppercase tracking-widest text-sm">Producto no disponible temporalmente</span>
          </div>
        )}

        {displaySizes.length > 0 && !isAccessory && (
          <div className="mt-8">
            <Label className="text-xs font-bold uppercase tracking-widest text-foreground">Seleccionar Talla</Label>
            <div className="mt-3 flex flex-wrap gap-2">
              {displaySizes.map((s) => {
                const outOfStock = !isPreorder && s.stock < 1
                const isSelected = selectedSize === s.size
                return (
                  <button
                    key={s.id}
                    type="button"
                    disabled={outOfStock}
                    onClick={() => setSelectedSize(s.size)}
                    className={cn(
                      "group relative flex h-12 flex-col items-center justify-center rounded-xl border-2 px-4 text-sm font-bold transition-all",
                      isSelected
                        ? "border-foreground bg-foreground text-background shadow-lg shadow-black/10 scale-105"
                        : outOfStock
                          ? "cursor-not-allowed border-border/50 text-muted-foreground opacity-40"
                          : "border-border/50 text-foreground hover:border-foreground hover:scale-105"
                    )}
                  >
                    <span className="uppercase">{s.size}</span>
                    {!isPreorder && s.stock > 0 && (
                      <span className={cn(
                        "text-[10px] opacity-60",
                        isSelected ? "text-background" : "text-muted-foreground"
                      )}>
                        {s.stock}u.
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
            {isPlayerType && (
              <div className="mt-4 flex items-start gap-3 rounded-xl bg-muted/30 p-4 text-sm border border-border/50">
                <div className="rounded-full bg-foreground/10 p-2">
                  <Lightbulb className="h-4 w-4" />
                </div>
                <div className="space-y-1">
                  <p className="font-bold uppercase tracking-tight">Tip de GoalWear</p>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    Las camisetas tipo &quot;player&quot; tienen un corte mas ajustado al cuerpo.
                    Si prefieres un ajuste mas comodo o estas entre dos tallas, te recomendamos
                    elegir una talla mas grande de la que usas regularmente.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {isAccessory && (
          <div className="mt-8">
            <Label htmlFor="custom-size" className="text-xs font-bold uppercase tracking-widest text-foreground">
              Especificar Talla o Tamano
            </Label>
            <Input
              id="custom-size"
              placeholder="Ej: M, Unica, Ajustable..."
              value={selectedSize}
              onChange={(e) => setSelectedSize(e.target.value)}
              className="mt-3 h-12 rounded-xl border-border/50 bg-background font-medium focus:border-foreground transition-all"
            />
          </div>
        )}

        {isPreorder && (
          <div className="mt-8 space-y-4 rounded-2xl border border-border/50 bg-muted/20 p-6">
            <div className="flex items-center gap-2">
              <div className="h-1 w-8 bg-foreground rounded-full" />
              <h3 className="text-sm font-bold uppercase tracking-widest text-foreground">
                Configura tu Camiseta
              </h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="custom-name" className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  Nombre en Dorsal
                </Label>
                <Input
                  id="custom-name"
                  placeholder="EJ: CR7"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value.toUpperCase())}
                  className="h-12 rounded-xl border-border/50 bg-background font-bold uppercase focus:border-foreground transition-all"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="custom-number" className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  Numero
                </Label>
                <Input
                  id="custom-number"
                  placeholder="EJ: 7"
                  maxLength={3}
                  value={customNumber}
                  onChange={(e) => setCustomNumber(e.target.value)}
                  className="h-12 rounded-xl border-border/50 bg-background font-bold focus:border-foreground transition-all"
                />
              </div>
            </div>

            {patches.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                    Selecciona Parches (MAX 2)
                  </Label>
                  <Badge variant="outline" className="text-[10px] font-bold">
                    {selectedPatches.length}/2
                  </Badge>
                </div>
                <div className="grid grid-cols-4 gap-3 sm:grid-cols-5">
                  {patches.map((patch) => {
                    const isSelected = selectedPatches.includes(patch.name)
                    return (
                      <button
                        key={patch.id}
                        type="button"
                        onClick={() => togglePatch(patch.name)}
                        className={cn(
                          "relative aspect-square overflow-hidden rounded-xl border-2 p-2 transition-all",
                          isSelected 
                            ? "border-foreground bg-background scale-110 shadow-lg shadow-black/10 z-10" 
                            : "border-border/50 hover:border-foreground/50 hover:scale-105"
                        )}
                      >
                        {patch.image_url ? (
                          <img
                            src={patch.image_url}
                            alt={patch.name}
                            className="h-full w-full object-contain"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[10px] text-center font-bold leading-tight uppercase">
                            {patch.name}
                          </div>
                        )}
                        {isSelected && (
                          <div className="absolute -top-1 -right-1 bg-foreground text-background rounded-full p-1 shadow-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-8 flex flex-col gap-4">
          {!isPreorder && !isAccessory && selectedSize && (
            <p className="text-xs font-medium text-muted-foreground">
              {availableStock > 0 
                ? `Disponibles: ${availableStock} unidades` 
                : "Sin stock disponible"}
            </p>
          )}
          <div className="flex items-center gap-4">
            <div className="flex items-center rounded-xl border border-border/50 bg-muted/20 px-2">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="flex h-12 w-12 items-center justify-center text-xl font-bold transition-all hover:bg-background rounded-xl active:scale-90"
              >
                -
              </button>
              <span className="flex w-12 items-center justify-center text-lg font-black font-mono">
                {quantity.toString().padStart(2, "0")}
              </span>
              <button
                type="button"
                disabled={!isPreorder && !isAccessory && quantity >= availableStock}
                onClick={() => setQuantity(quantity + 1)}
                className="flex h-12 w-12 items-center justify-center text-xl font-bold transition-all hover:bg-background rounded-xl disabled:opacity-20 active:scale-90"
              >
                +
              </button>
            </div>

            <Button
              className="flex-1 h-12 rounded-full text-sm font-bold uppercase tracking-widest shadow-lg shadow-black/5 transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
              size="lg"
              disabled={!canAdd || isValidating}
              onClick={handleAddToCart}
            >
              {isValidating ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <ShoppingCart className="mr-2 h-5 w-5" />
              )}
              {isOutOfStock ? "Agotado" : isValidating ? "Validando..." : "Agregar a mi Orden"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
