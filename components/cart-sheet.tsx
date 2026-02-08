"use client"

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useCart } from "@/lib/cart-context"
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react"
import Link from "next/link"

export function CartSheet() {
  const { items, removeItem, updateQuantity, totalPrice, isOpen, setIsOpen } =
    useCart()

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
                            ${(item.unitPrice * item.quantity).toFixed(2)}
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
                  ${totalPrice.toFixed(2)}
                </span>
              </div>
              <Button asChild className="w-full" size="lg" onClick={() => setIsOpen(false)}>
                <Link href="/checkout">Finalizar Pedido</Link>
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
