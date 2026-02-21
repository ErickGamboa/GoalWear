"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Loader2, Hand } from "lucide-react"
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
import { takeOrder } from "./actions"

export function TakeOrderButton({ order }: { order: OrderWithItems }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  if (order.status !== 'pending') return null

  const handleTake = async () => {
    setLoading(true)
    try {
      const result = await takeOrder(order.id)

      if (!result.success) {
        throw new Error(result.message)
      }

      toast.success("Pedido tomado con éxito")
      router.refresh() 
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al tomar pedido")
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
          className="h-8 w-8 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
          title="Tomar Pedido"
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Hand className="h-4 w-4" />
          )}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Tomar pedido?</AlertDialogTitle>
          <AlertDialogDescription>
            El pedido se moverá al historial en amarillo, listo para ser entregado.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleTake}
            className="bg-yellow-600 hover:bg-yellow-700"
          >
            Confirmar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
