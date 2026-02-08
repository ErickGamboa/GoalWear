"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"
import type { Patch } from "@/lib/types"

export function PatchList({ patches }: { patches: Patch[] }) {
  const router = useRouter()

  async function handleDelete(id: string) {
    if (!confirm("Eliminar este parche?")) return

    const supabase = createClient()
    const { error } = await supabase.from("patches").delete().eq("id", id)

    if (error) {
      toast.error("Error al eliminar")
      return
    }

    toast.success("Parche eliminado")
    router.refresh()
  }

  if (patches.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-muted-foreground">
        No hay parches
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {patches.map((patch) => (
        <div
          key={patch.id}
          className="flex items-center justify-between rounded-md border border-border p-3"
        >
          <div>
            <p className="text-sm font-medium text-foreground">{patch.name}</p>
            <p className="text-xs text-muted-foreground">
              ${Number(patch.price).toFixed(2)}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={() => handleDelete(patch.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  )
}
