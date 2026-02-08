"use client"

import React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

export function PatchForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState("")
  const [price, setPrice] = useState("")
  const [imageUrl, setImageUrl] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.from("patches").insert({
        name,
        price: parseFloat(price),
        image_url: imageUrl || null,
      })

      if (error) throw error

      toast.success("Parche creado")
      setName("")
      setPrice("")
      setImageUrl("")
      router.refresh()
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Error al crear parche"
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="patch-name">Nombre *</Label>
        <Input
          id="patch-name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Liga MX, Champions League..."
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="patch-price">Precio *</Label>
        <Input
          id="patch-price"
          type="number"
          step="0.01"
          min="0"
          required
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="5.00"
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="patch-image">URL de imagen</Label>
        <Input
          id="patch-image"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://..."
          className="mt-1"
        />
      </div>
      <Button type="submit" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Agregar Parche
      </Button>
    </form>
  )
}
