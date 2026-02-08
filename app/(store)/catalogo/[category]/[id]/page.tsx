import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { SLUG_TO_CATEGORY, CATEGORY_LABELS, CATEGORY_SLUGS } from "@/lib/types"
import type { ProductWithSizes, Patch } from "@/lib/types"
import type { Metadata } from "next"
import { ProductDetailClient } from "./product-detail-client"
import Link from "next/link"

type Props = {
  params: Promise<{ category: string; id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data: product } = await supabase
    .from("products")
    .select("name, team")
    .eq("id", id)
    .single()

  if (!product) return {}
  return {
    title: `${product.name} | GoalWear`,
    description: `${product.name}${product.team ? ` - ${product.team}` : ""} en GoalWear`,
  }
}

export default async function ProductDetailPage({ params }: Props) {
  const { category: slug, id } = await params
  const category = SLUG_TO_CATEGORY[slug]
  if (!category) notFound()

  const supabase = await createClient()

  const { data: product } = await supabase
    .from("products")
    .select("*, product_sizes(*)")
    .eq("id", id)
    .single()

  if (!product) notFound()

  const typedProduct = product as ProductWithSizes
  const categoryLabel = CATEGORY_LABELS[category]

  let patches: Patch[] = []
  if (category === "preorder") {
    const { data } = await supabase.from("patches").select("*")
    patches = (data ?? []) as Patch[]
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:py-12">
      <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/" className="transition-colors hover:text-foreground">
          Inicio
        </Link>
        <span>/</span>
        <Link
          href={`/catalogo/${slug}`}
          className="transition-colors hover:text-foreground"
        >
          {categoryLabel}
        </Link>
        <span>/</span>
        <span className="text-foreground">{typedProduct.name}</span>
      </nav>

      <ProductDetailClient product={typedProduct} patches={patches} />
    </div>
  )
}
