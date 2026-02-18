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
      
      // Filter immediate items to check stock
      const immediateItems = items.filter(item => item.category === "immediate")
      
      if (immediateItems.length > 0) {
        // Check stock for all immediate items
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

      // If all good, proceed to checkout
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
      <SheetContent className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-foreground">
            <ShoppingBag className="h-5 w-5" />
            Carrito de Compras
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground">
            <ShoppingBag className="h-12 w-12" />
            <p className="text-sm">Tu carrito esta vacio</p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto pr-1">
              <div className="flex flex-col gap-4">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3 rounded-lg border border-border p-3">
                    {item.imageUrl && (
                      <img
                        src={item.imageUrl || "/placeholder.svg"}
                        alt={item.productName}
                        className="h-16 w-16 rounded-md object-cover"
                      />
                    )}
                    <div className="flex flex-1 flex-col gap-1">
                      <p className="text-sm font-medium text-foreground leading-tight">
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
                      <div className="mt-1 flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7 bg-transparent"
                            onClick={() =>
                              updateQuantity(item.id, item.quantity - 1)
                            }
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center text-sm text-foreground">
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7 bg-transparent"
                            onClick={() =>
                              updateQuantity(item.id, item.quantity + 1)
                            }
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-foreground">
                            {formatCurrency(item.unitPrice * item.quantity)}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={() => removeItem(item.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
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
                <span className="text-base font-semibold text-foreground">Total</span>
                <span className="text-lg font-bold text-foreground">
                  {formatCurrency(totalPrice)}
                </span>
              </div>
              <Button 
                className="w-full" 
                size="lg" 
                onClick={handleCheckout}
                disabled={isValidating}
              >
                {isValidating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
