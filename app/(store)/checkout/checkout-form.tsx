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
        router.refresh() // Refresh stock data
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
        <Button asChild variant="outline">
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
      {/* Order Summary */}
      <div className="rounded-lg border border-border p-4">
        <h2 className="mb-4 text-lg font-semibold text-foreground">
          Resumen del Pedido
        </h2>
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between text-sm"
            >
              <div className="flex-1">
                <p className="font-medium text-foreground">
                  {item.productName}
                  {item.size && ` (${item.size})`}
                </p>
                <p className="text-xs text-muted-foreground">
                  {item.productCode} x{item.quantity}
                  {item.customName && ` | ${item.customName} #${item.customNumber}`}
                </p>
              </div>
              <span className="font-medium text-foreground">
                {formatCurrency(item.unitPrice * item.quantity)}
              </span>
            </div>
          ))}
        </div>
        <Separator className="my-3" />
        {needsShipping && (
          <div className="flex items-center justify-between text-sm text-foreground">
            <span>Envio</span>
            <span>{formatCurrency(SHIPPING_COST)}</span>
          </div>
        )}
        <div className="flex items-center justify-between text-base font-bold text-foreground">
          <span>Total</span>
          <span>{formatCurrency(finalTotal)}</span>
        </div>
      </div>

      {/* Customer Info */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">
          Datos del Cliente
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="name">Nombre completo *</Label>
            <Input
              id="name"
              required
              value={formData.name}
              onChange={(e) => updateField("name", e.target.value)}
              placeholder="Tu nombre"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="email">Correo electronico *</Label>
            <Input
              id="email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => updateField("email", e.target.value)}
              placeholder="tu@email.com"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="phone">Telefono *</Label>
            <Input
              id="phone"
              required
              value={formData.phone}
              onChange={(e) => updateField("phone", e.target.value)}
              placeholder="+52 ..."
              className="mt-1"
            />
          </div>
        </div>

        {/* Shipping Option */}
        <div className="rounded-lg border border-border p-4">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="needsShipping"
              checked={needsShipping}
              onCheckedChange={(checked) => setNeedsShipping(checked as boolean)}
            />
            <div className="space-y-1 leading-none">
              <Label
                htmlFor="needsShipping"
                className="text-sm font-semibold text-foreground"
              >
                Requiero envio a domicilio
              </Label>
              <p className="text-xs text-muted-foreground">
                Costo adicional de {formatCurrency(SHIPPING_COST)}
              </p>
            </div>
          </div>

          {needsShipping && (
            <div className="mt-4">
              <Label htmlFor="address">Direccion de envio *</Label>
              <Input
                id="address"
                required={needsShipping}
                value={formData.address}
                onChange={(e) => updateField("address", e.target.value)}
                placeholder="Calle, numero, ciudad, provincia"
                className="mt-1"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                El costo de envio sera agregado a tu pedido
              </p>
            </div>
          )}
        </div>

        <div>
          <Label htmlFor="notes">Notas adicionales</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => updateField("notes", e.target.value)}
            placeholder="Indicaciones especiales..."
            className="mt-1"
            rows={3}
          />
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
        <Button asChild variant="outline" type="button">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Seguir Comprando
          </Link>
        </Button>
        <Button type="submit" size="lg" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Confirmar Pedido
        </Button>
      </div>
    </form>
  )
}
