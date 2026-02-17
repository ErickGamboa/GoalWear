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
  const [imageUrl, setImageUrl] = useState("")
  const [imageFile, setImageFile] = useState<File | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()
      
      let finalImageUrl = imageUrl
      if (imageFile) {
        const ext = imageFile.name.split(".").pop()
        const fileName = `patch-${Date.now()}.${ext}`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("product-images")
          .upload(fileName, imageFile)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from("product-images")
          .getPublicUrl(uploadData.path)
        finalImageUrl = publicUrl
      }

      const { error } = await supabase.from("patches").insert({
        name,
        price: 0,
        image_url: finalImageUrl || null,
      })

      if (error) {
        if (error.code === '23505') {
          throw new Error("Ya existe un parche con ese nombre")
        }
        throw error
      }

      toast.success("Parche creado")
      setName("")
      setImageUrl("")
      setImageFile(null)
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
        <Label htmlFor="patch-image-file">Subir imagen local</Label>
        <Input
          id="patch-image-file"
          type="file"
          accept="image/*"
          onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="patch-image">O URL de imagen</Label>
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
