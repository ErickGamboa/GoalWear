"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Loader2, PackageCheck } from "lucide-react"
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
import { deliverOrder } from "./actions"

export function DeliverOrderButton({ order }: { order: OrderWithItems }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  if (order.status !== 'taken') return null

  const handleDeliver = async () => {
    setLoading(true)
    try {
      const result = await deliverOrder(order.id)

      if (!result.success) {
        throw new Error(result.message)
      }

      toast.success("Pedido entregado con éxito")
      router.refresh() 
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al entregar pedido")
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
          title="Entregar Pedido"
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <PackageCheck className="h-4 w-4" />
          )}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Entregar pedido?</AlertDialogTitle>
          <AlertDialogDescription>
            El pedido se marcará como entregado y se pondrá en verde.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleDeliver}
            className="bg-green-600 hover:bg-green-700"
          >
            Confirmar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
