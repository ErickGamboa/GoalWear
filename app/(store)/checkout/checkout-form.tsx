"use client"

import React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { useCart } from "@/lib/cart-context"
import { toast } from "sonner"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { formatCurrency } from "@/lib/utils"

export function CheckoutForm() {
  const { items, totalPrice, clearCart } = useCart()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const [needsShipping, setNeedsShipping] = useState(false)
  const SHIPPING_COST = 3500

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
  })

  const finalTotal = totalPrice + (needsShipping ? SHIPPING_COST : 0)

  function updateField(field: string, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (items.length === 0) return

    setLoading(true)
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: {
            ...formData,
            needsShipping,
          },
          items: items.map((item) => ({
            productId: item.productId,
            productCode: item.productCode,
            productName: item.productName,
            quantity: item.quantity,
            size: item.size,
            customName: item.customName,
            customNumber: item.customNumber,
            patches: item.patches,
            unitPrice: item.unitPrice,
            category: item.category,
          })),
          shippingCost: needsShipping ? SHIPPING_COST : 0,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        router.refresh()
        throw new Error(data.error || "Error al procesar el pedido")
      }

      clearCart()
      router.push("/checkout/exito")
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Error al procesar el pedido"
      )
    } finally {
      setLoading(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <p className="text-muted-foreground">Tu carrito esta vacio</p>
        <Button asChild variant="outline" className="rounded-full">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a la Tienda
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-400 rounded-2xl border border-border/50 bg-muted/20 p-6">
        <h2 className="mb-4 text-lg font-bold text-foreground uppercase tracking-tight">
          Resumen del Pedido
        </h2>
        <div className="space-y-3">
          {items.map((item, index) => (
            <div
              key={item.id}
              style={{ animationDelay: `${index * 50}ms` }}
              className="animate-in fade-in slide-in-from-left-4 duration-300 flex items-center justify-between text-sm"
            >
              <div className="flex-1">
                <p className="font-semibold text-foreground">
                  {item.productName}
                  {item.size && ` (${item.size})`}
                </p>
                <p className="text-xs text-muted-foreground">
                  {item.productCode} x{item.quantity}
                  {item.customName && ` | ${item.customName} #${item.customNumber}`}
                </p>
              </div>
              <span className="font-bold text-foreground">
                {formatCurrency(item.unitPrice * item.quantity)}
              </span>
            </div>
          ))}
        </div>
        <Separator className="my-4" />
        {needsShipping && (
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Envio</span>
            <span className="font-medium">{formatCurrency(SHIPPING_COST)}</span>
          </div>
        )}
        <div className="mt-2 flex items-center justify-between text-xl font-black text-foreground">
          <span>Total</span>
          <span>{formatCurrency(finalTotal)}</span>
        </div>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-400 delay-100 space-y-4">
        <h2 className="text-lg font-bold text-foreground uppercase tracking-tight">
          Datos del Cliente
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Nombre completo *</Label>
            <Input
              id="name"
              required
              value={formData.name}
              onChange={(e) => updateField("name", e.target.value)}
              placeholder="Tu nombre"
              className="h-12 rounded-xl border-border/50 bg-background font-medium focus:border-foreground transition-all"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Correo electronico *</Label>
            <Input
              id="email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => updateField("email", e.target.value)}
              placeholder="tu@email.com"
              className="h-12 rounded-xl border-border/50 bg-background font-medium focus:border-foreground transition-all"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="phone" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Telefono *</Label>
            <Input
              id="phone"
              required
              value={formData.phone}
              onChange={(e) => updateField("phone", e.target.value)}
              placeholder="+506 ..."
              className="h-12 rounded-xl border-border/50 bg-background font-medium focus:border-foreground transition-all"
            />
          </div>
        </div>

        <div className="rounded-2xl border border-border/50 p-4 transition-colors hover:border-border">
          <label className="flex items-start gap-3 cursor-pointer">
            <Checkbox
              id="needsShipping"
              checked={needsShipping}
              onCheckedChange={(checked) => setNeedsShipping(checked as boolean)}
              className="mt-1"
            />
            <div className="space-y-1 leading-none">
              <span className="text-sm font-bold text-foreground">
                Requiero envio a domicilio
              </span>
              <p className="text-xs text-muted-foreground">
                Costo adicional de {formatCurrency(SHIPPING_COST)}
              </p>
            </div>
          </label>

          {needsShipping && (
            <div className="mt-4 space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
              <Label htmlFor="address" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Direccion de envio *</Label>
              <Input
                id="address"
                required={needsShipping}
                value={formData.address}
                onChange={(e) => updateField("address", e.target.value)}
                placeholder="Calle, numero, ciudad, provincia"
                className="h-12 rounded-xl border-border/50 bg-background font-medium focus:border-foreground transition-all"
              />
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Notas adicionales</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => updateField("notes", e.target.value)}
            placeholder="Indicaciones especiales..."
            className="rounded-xl border-border/50 bg-background font-medium focus:border-foreground transition-all min-h-[100px]"
          />
        </div>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-400 delay-200 flex flex-col gap-3 sm:flex-row sm:justify-between">
        <Button asChild variant="outline" type="button" className="rounded-full h-12 px-6">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Seguir Comprando
          </Link>
        </Button>
        <Button type="submit" size="lg" disabled={loading} className="rounded-full h-12 px-8 font-bold uppercase tracking-widest transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Confirmar Pedido
        </Button>
      </div>
    </form>
  )
}
