"use client"

import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"

export function DeleteProductButton({ productId }: { productId: string }) {
  const router = useRouter()

  async function handleDelete() {
    if (!confirm("Estas seguro de eliminar este producto?")) return

    const supabase = createClient()
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", productId)

    if (error) {
      toast.error("Error al eliminar producto")
      return
    }

    toast.success("Producto eliminado")
    router.refresh()
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 text-muted-foreground hover:text-destructive"
      onClick={handleDelete}
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  )
}
