"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Loader2, CheckCircle2 } from "lucide-react"
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
import { completeOrder } from "./actions"

export function CompleteOrderButton({ order }: { order: OrderWithItems }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  if (order.status === 'completed') return null

  const handleComplete = async () => {
    setLoading(true)
    try {
      const result = await completeOrder(order.id)

      if (!result.success) {
        throw new Error(result.message)
      }

      toast.success("Pedido finalizado con éxito")
      router.refresh() 
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al finalizar pedido")
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
          className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
          title="Finalizar Pedido"
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle2 className="h-4 w-4" />
          )}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Finalizar pedido?</AlertDialogTitle>
          <AlertDialogDescription>
            El pedido se moverá al historial y su total se sumará a los ingresos del dashboard.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleComplete}
            className="bg-green-600 hover:bg-green-700"
          >
            Confirmar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
