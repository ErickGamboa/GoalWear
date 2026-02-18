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

  // Solo mostrar si el pedido tiene items de entrega inmediata
  const hasImmediate = order.order_items.some(item => item.category === "immediate")
  
  if (!hasImmediate) return null

  // Si ya no está procesado (se devolvió), mostrar botón deshabilitado o estado
  if (!order.inventory_processed) {
    return (
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-8 w-8 text-muted-foreground opacity-50 cursor-not-allowed"
        disabled
        title="Stock ya devuelto"
      >
        <RotateCcw className="h-4 w-4" />
      </Button>
    )
  }

  const handleRevert = async () => {
    setLoading(true)
    try {
      // Usar la función atómica para revertir el stock de forma segura
      const { data: success, error } = await supabase.rpc("revert_order_stock_atomic", {
        p_order_id: order.id
      })

      if (error) throw error

      if (!success) {
        throw new Error("Este pedido ya fue devuelto al inventario.")
      }

      toast.success("Inventario devuelto y sincronizado")
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al devolver inventario")
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
          title="Devolver Stock"
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
          <AlertDialogTitle>¿Devolver productos al inventario?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción sumará las cantidades de los productos de entrega inmediata 
            de este pedido nuevamente al stock global. Úsalo solo si el pedido fue cancelado.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleRevert}
            className="bg-orange-600 hover:bg-orange-700"
          >
            Confirmar Devolución
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
