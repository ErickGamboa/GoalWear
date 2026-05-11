"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Star } from "lucide-react"
import { toast } from "sonner"
import { toggleBestseller } from "./actions"

export function StarProductButton({
  productId,
  isBestseller,
}: {
  productId: string
  isBestseller: boolean
}) {
  const [active, setActive] = useState(isBestseller)
  const [isLoading, setIsLoading] = useState(false)

  async function handleToggle() {
    setIsLoading(true)
    const prev = active
    setActive(!active)
    try {
      const result = await toggleBestseller(productId, active)
      if (!result.success) {
        setActive(prev)
        toast.error(result.message ?? "Error al actualizar")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className={`h-8 w-8 transition-colors ${active ? "text-yellow-500 hover:text-yellow-600" : "text-muted-foreground hover:text-yellow-500"}`}
      onClick={handleToggle}
      disabled={isLoading}
      title={active ? "Quitar de más vendidos" : "Marcar como más vendido"}
    >
      <Star className={`h-4 w-4 ${active ? "fill-current" : ""}`} />
    </Button>
  )
}
