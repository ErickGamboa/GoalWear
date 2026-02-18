import { createClient } from "@/lib/supabase/server"
import { ProductCard } from "@/components/product-card"
import { SLUG_TO_CATEGORY, CATEGORY_LABELS } from "@/lib/types"
import type { Product } from "@/lib/types"
import { notFound } from "next/navigation"
import type { Metadata } from "next"

type Props = {
  params: Promise<{ category: string }>
  searchParams: Promise<{ q?: string }>
}

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category: slug } = await params
  const category = SLUG_TO_CATEGORY[slug]
  if (!category) return {}
  const label = CATEGORY_LABELS[category]
  return {
    title: `${label} | GoalWear`,
    description: `Catalogo de ${label.toLowerCase()} - GoalWear`,
  }
}

export default async function CatalogPage({ params, searchParams }: Props) {
  const { category: slug } = await params
  const { q: query } = await searchParams
  const category = SLUG_TO_CATEGORY[slug]
  if (!category) notFound()

  const label = CATEGORY_LABELS[category]
  const supabase = await createClient()

  let dbQuery = supabase
    .from("products")
    .select(`
      *,
      product_sizes (size, stock)
    `)
    .eq("category", category)
    .order("created_at", { ascending: false })

  if (query) {
    dbQuery = dbQuery.or(`name.ilike.%${query}%,team.ilike.%${query}%,code.ilike.%${query}%`)
  }

  const { data: products } = await dbQuery

  let productList = (products ?? []) as any[]

  // Filter by size if query exists and no name/team/code match was found for those sizes
  if (query) {
    const queryLower = query.toLowerCase()
    // Products already found by or() filter
    // We add products where at least one size matches the query
    // This is already done for name/team/code, but if someone searches just "XL",
    // the .or() above won't catch it unless the name has "XL".
    // So we refine the list to include size matches if they aren't already there.
    // However, since we selected product_sizes, we can do it in JS.
    productList = productList.filter(p => 
      p.name.toLowerCase().includes(queryLower) ||
      (p.team && p.team.toLowerCase().includes(queryLower)) ||
      p.code.toLowerCase().includes(queryLower) ||
      p.product_sizes?.some((s: any) => s.size.toLowerCase().includes(queryLower))
    )
  }

  // NEW: Filter out "immediate" products with zero total stock
  if (category === "immediate") {
    productList = productList.filter(p => 
      p.product_sizes?.some((s: any) => s.stock > 0)
    )
  }

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
