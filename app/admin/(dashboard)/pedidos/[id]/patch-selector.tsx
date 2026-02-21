"use client"

import * as React from "react"
import Image from "next/image"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { updateOrderItemPatch } from "./patch-actions"
import { toast } from "sonner"
import { Loader2, RefreshCw, Plus, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

interface PatchSelectorProps {
  orderItemId: string
  patchIndex: number
  currentPatchName: string | null
  patchImageUrl: string | null
  allPatches: { name: string; image_url: string | null }[]
}

export function PatchSelector({
  orderItemId,
  patchIndex,
  currentPatchName,
  patchImageUrl,
  allPatches,
}: PatchSelectorProps) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)

  async function handlePatchSelect(newPatchName: string | null) {
    setLoading(true)
    try {
      const result = await updateOrderItemPatch(orderItemId, patchIndex, newPatchName)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(newPatchName ? "Parche actualizado" : "Parche eliminado")
        router.refresh()
        setOpen(false)
      }
    } catch (error) {
      toast.error("Error inesperado")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          className={cn(
            "group relative h-40 w-40 overflow-hidden rounded-lg border transition-all",
            currentPatchName 
              ? "border-border bg-white shadow-sm hover:border-primary hover:ring-2 hover:ring-primary/20" 
              : "border-transparent bg-transparent hover:border-dashed hover:border-muted-foreground/30 hover:bg-muted/10"
          )}
          title={currentPatchName ? `Cambiar parche: ${currentPatchName}` : "Agregar parche"}
        >
          {currentPatchName && patchImageUrl ? (
            <Image
              src={patchImageUrl}
              alt={currentPatchName}
              fill
              className="object-contain p-2 transition-transform group-hover:scale-110"
            />
          ) : currentPatchName ? (
            <div className="flex h-full w-full items-center justify-center bg-muted text-xs font-bold">
              {currentPatchName}
            </div>
          ) : null}
          
          <div className={cn(
            "absolute inset-0 flex items-center justify-center transition-opacity opacity-0 group-hover:opacity-100",
            currentPatchName ? "bg-black/40" : "bg-primary/5"
          )}>
            {currentPatchName ? (
              <RefreshCw className="h-8 w-8 text-white" />
            ) : (
              <Plus className="h-10 w-10 text-primary/40" />
            )}
          </div>
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Cambiar Parche</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-4 py-4 sm:grid-cols-4 md:grid-cols-5">
          {/* Option to remove patch */}
          <Button
            variant="outline"
            className="flex h-auto flex-col gap-2 p-3 hover:border-destructive hover:bg-destructive/5"
            onClick={() => handlePatchSelect(null)}
            disabled={loading}
          >
            <div className="flex h-20 w-20 items-center justify-center rounded bg-muted">
              <X className="h-10 w-10 text-destructive" />
            </div>
            <span className="text-[10px] uppercase font-bold text-destructive">Eliminar</span>
          </Button>

          {allPatches.map((patch) => (
            <Button
              key={patch.name}
              variant={patch.name === currentPatchName ? "default" : "outline"}
              className={`flex h-auto flex-col gap-2 p-3 ${
                patch.name === currentPatchName ? "ring-2 ring-primary ring-offset-2" : ""
              }`}
              onClick={() => handlePatchSelect(patch.name)}
              disabled={loading || patch.name === currentPatchName}
            >
              <div className="relative h-20 w-20 overflow-hidden rounded bg-white">
                {patch.image_url ? (
                  <Image
                    src={patch.image_url}
                    alt={patch.name}
                    fill
                    className="object-contain p-2"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[10px]">
                    {patch.name}
                  </div>
                )}
              </div>
              <span className="text-[10px] truncate w-full text-center uppercase font-bold">
                {patch.name}
              </span>
            </Button>
          ))}
        </div>
        {loading && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Actualizando pedido...
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
