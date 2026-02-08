import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { ProductForm } from "@/components/product-form"
import type { ProductWithSizes } from "@/lib/types"

type Props = {
  params: Promise<{ id: string }>
}

export default async function EditProductPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: product } = await supabase
    .from("products")
    .select("*, product_sizes(*)")
    .eq("id", id)
    .single()

  if (!product) notFound()

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">
        Editar Producto: {product.code}
      </h1>
      <ProductForm mode="edit" product={product as ProductWithSizes} />
    </div>
  )
}
