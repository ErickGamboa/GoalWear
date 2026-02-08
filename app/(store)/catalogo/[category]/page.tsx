import { createClient } from "@/lib/supabase/server"
import { ProductCard } from "@/components/product-card"
import { SLUG_TO_CATEGORY, CATEGORY_LABELS } from "@/lib/types"
import type { Product } from "@/lib/types"
import { notFound } from "next/navigation"
import type { Metadata } from "next"

type Props = {
  params: Promise<{ category: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category: slug } = await params
  const category = SLUG_TO_CATEGORY[slug]
  if (!category) return {}
  const label = CATEGORY_LABELS[category]
  return {
    title: `${label} | GoalWear`,
    description: `Catalogo de ${label.toLowerCase()} - GoalWear`,
  }
}

export default async function CatalogPage({ params }: Props) {
  const { category: slug } = await params
  const category = SLUG_TO_CATEGORY[slug]
  if (!category) notFound()

  const label = CATEGORY_LABELS[category]
  const supabase = await createClient()

  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("category", category)
    .order("created_at", { ascending: false })

  const productList = (products ?? []) as Product[]

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">{label}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {productList.length} producto{productList.length !== 1 ? "s" : ""}
        </p>
      </div>

      {productList.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {productList.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="flex h-60 items-center justify-center rounded-lg border border-dashed border-border">
          <p className="text-muted-foreground">
            No hay productos en esta categoria aun
          </p>
        </div>
      )}
    </div>
  )
}
