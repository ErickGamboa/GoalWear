"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"
import { deleteProduct } from "./actions"

export function DeleteProductButton({ productId }: { productId: string }) {
  const [isLoading, setIsLoading] = useState(false)

  async function handleDelete() {
    if (!confirm("¿Estás seguro de eliminar este producto?")) return

    setIsLoading(true)
    try {
      const result = await deleteProduct(productId)
      if (!result.success) {
        toast.error(result.message ?? "Error al eliminar producto")
        return
      }
      toast.success("Producto eliminado")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 text-muted-foreground hover:text-destructive"
      onClick={handleDelete}
      disabled={isLoading}
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  )
}
