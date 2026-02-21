"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Loader2, RotateCcw } from "lucide-react"
import type { OrderWithItems } from "@/lib/types"
import { useRouter } from "next/navigation"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export function InventoryButton({ order }: { order: OrderWithItems }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // Si ya no está procesado (se devolvió/declinó), mostrar botón deshabilitado
  if (!order.inventory_processed) {
    return (
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-8 w-8 text-muted-foreground opacity-50 cursor-not-allowed"
        disabled
        title="Pedido ya declinado"
      >
        <RotateCcw className="h-4 w-4" />
      </Button>
    )
  }

  // Determinar si tiene items de entrega inmediata
  const hasImmediate = order.order_items.some(item => item.category === "immediate")
  
  // Determinar el texto según el tipo de pedido
  const dialogTitle = hasImmediate 
    ? "¿Devolver productos al inventario?" 
    : "¿Declinar pedido?"
  
  const dialogDescription = hasImmediate
    ? "Esta acción sumará las cantidades de los productos de entrega inmediata de este pedido nuevamente al stock global. Úsalo solo si el pedido fue cancelado."
    : "Esta acción marcará el pedido como declinado. El pedido se moverá al historial en rojo."

  const buttonText = hasImmediate ? "Confirmar Devolución" : "Declinar Pedido"

  const handleRevert = async () => {
    setLoading(true)
    try {
      const { data: success, error } = await supabase.rpc("revert_order_stock_atomic", {
        p_order_id: order.id
      })

      if (error) throw error

      if (!success) {
        throw new Error("Este pedido ya fue procesado.")
      }

      toast.success(hasImmediate ? "Inventario devuelto y sincronizado" : "Pedido declinado")
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al procesar")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
          title={hasImmediate ? "Devolver Stock" : "Declinar Pedido"}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RotateCcw className="h-4 w-4" />
          )}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{dialogTitle}</AlertDialogTitle>
          <AlertDialogDescription>
            {dialogDescription}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleRevert}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {buttonText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
