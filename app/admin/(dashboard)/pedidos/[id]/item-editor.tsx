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
import { Pencil, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { updateOrderItemDetails } from "./item-actions"

type Props = {
  orderItemId: string
  productName: string
  initialCustomName: string | null
  initialCustomNumber: string | null
  initialSize: string | null
  initialQuantity: number
  triggerLabel?: string
}

export function ItemEditor({
  orderItemId,
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

  React.useEffect(() => {
    if (open) {
      setCustomName(initialCustomName ?? "")
      setCustomNumber(initialCustomNumber ?? "")
      setSize(initialSize ?? "")
      setQuantity(String(initialQuantity ?? 1))
    }
  }, [open, initialCustomName, initialCustomNumber, initialSize, initialQuantity])

  async function handleSave() {
    const qty = Math.max(1, Math.floor(Number(quantity) || 1))
    setSaving(true)
    try {
      const result = await updateOrderItemDetails(orderItemId, {
        customName: customName || null,
        customNumber: customNumber || null,
        size: size || null,
        quantity: qty,
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar {productName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
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
