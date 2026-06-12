"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Loader2, PackageCheck } from "lucide-react"
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
import { deliverOrder } from "../../pedidos/actions"

export function DispatchDeliverButton({ orderId }: { orderId: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleDeliver = async () => {
    setLoading(true)
    try {
      const result = await deliverOrder(orderId)
      if (!result.success) {
        throw new Error(result.message)
      }
      toast.success("Pedido entregado con éxito")
      // Delivered → leaves Despacho, back to the list (date filter persists in sessionStorage).
      router.push("/admin/despacho")
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al entregar pedido")
      setLoading(false)
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button className="bg-green-600 hover:bg-green-700 text-white" disabled={loading}>
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <PackageCheck className="mr-2 h-4 w-4" />
          )}
          Marcar como entregado
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Entregar pedido?</AlertDialogTitle>
          <AlertDialogDescription>
            El pedido se marcará como entregado, pasará al historial en verde y saldrá de Despacho.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleDeliver} className="bg-green-600 hover:bg-green-700">
            Confirmar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
