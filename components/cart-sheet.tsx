"use client"

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useCart } from "@/lib/cart-context"
import { Minus, Plus, Trash2, ShoppingBag, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { formatCurrency } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { useState } from "react"
import { toast } from "sonner"

export function CartSheet() {
  const router = useRouter()
  const { items, removeItem, updateQuantity, totalPrice, isOpen, setIsOpen } =
    useCart()
  const [isValidating, setIsValidating] = useState(false)

  const handleCheckout = async () => {
    setIsValidating(true)
    try {
      const supabase = createClient()
      
      const immediateItems = items.filter(item => item.category === "immediate")
      
      if (immediateItems.length > 0) {
        for (const item of immediateItems) {
          const { data, error } = await supabase
            .from("product_sizes")
            .select("stock")
            .eq("product_id", item.productId)
            .eq("size", item.size)
            .single()

          if (error) throw error

          if (!data || data.stock < item.quantity) {
            toast.error(`Stock insuficiente para ${item.productName} (${item.size}). Disponibles: ${data?.stock || 0}`)
            setIsValidating(false)
            return
          }
        }
      }

      setIsOpen(false)
      router.push("/checkout")
    } catch (err) {
      console.error("Stock validation error:", err)
      toast.error("Error al validar el inventario")
    } finally {
      setIsValidating(false)
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent className="flex w-full flex-col border-l border-border/50 sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-foreground text-lg">
            <ShoppingBag className="h-5 w-5" />
            Tu Carrito
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-muted-foreground">
            <div className="rounded-full bg-muted p-6">
              <ShoppingBag className="h-10 w-10" />
            </div>
            <p className="text-sm font-medium">Tu carrito esta vacio</p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto py-4 pr-1">
              <div className="flex flex-col gap-3">
                {items.map((item, index) => (
                  <div
                    key={item.id}
                    style={{ animationDelay: `${index * 50}ms` }}
                    className="animate-in fade-in slide-in-from-right-4 duration-300 flex gap-3 rounded-2xl border border-border/50 p-3 transition-all duration-300 hover:border-border hover:bg-muted/30"
                  >
                    {item.imageUrl && (
                      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-muted">
                        <img
                          src={item.imageUrl || "/placeholder.svg"}
                          alt={item.productName}
                          className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                        />
                      </div>
                    )}
                    <div className="flex flex-1 flex-col gap-0.5">
                      <p className="text-sm font-semibold text-foreground leading-tight">
                        {item.productName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.productCode} {item.size && `| Talla: ${item.size}`}
                      </p>
                      {item.customName && (
                        <p className="text-xs text-muted-foreground">
                          Nombre: {item.customName} #{item.customNumber}
                        </p>
                      )}
                      {item.patches && item.patches.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          Parches: {item.patches.join(", ")}
                        </p>
                      )}
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="flex h-7 w-7 items-center justify-center rounded-full border border-border/50 text-sm font-bold transition-all duration-200 hover:bg-foreground hover:text-background hover:border-foreground active:scale-90"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-8 text-center text-sm font-bold text-foreground">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="flex h-7 w-7 items-center justify-center rounded-full border border-border/50 text-sm font-bold transition-all duration-200 hover:bg-foreground hover:text-background hover:border-foreground active:scale-90"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-foreground">
                            {formatCurrency(item.unitPrice * item.quantity)}
                          </span>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-all duration-200 hover:bg-muted hover:text-foreground active:scale-90"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-auto pt-4">
              <Separator className="mb-4" />
              <div className="flex items-center justify-between pb-4">
                <span className="text-sm font-medium text-muted-foreground">Total</span>
                <span className="text-2xl font-black text-foreground">
                  {formatCurrency(totalPrice)}
                </span>
              </div>
              <Button 
                className="w-full h-12 rounded-full text-sm font-bold uppercase tracking-widest transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]" 
                size="lg" 
                onClick={handleCheckout}
                disabled={isValidating}
              >
                {isValidating ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : null}
                {isValidating ? "Validando Stock..." : "Finalizar Pedido"}
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
