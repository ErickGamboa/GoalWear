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

  if (query) {
    const queryLower = query.toLowerCase()
    productList = productList.filter(p => 
      p.name.toLowerCase().includes(queryLower) ||
      (p.team && p.team.toLowerCase().includes(queryLower)) ||
      p.code.toLowerCase().includes(queryLower) ||
      p.product_sizes?.some((s: any) => s.size.toLowerCase().includes(queryLower))
    )
  }

  if (category === "immediate") {
    productList = productList.filter(p => 
      p.product_sizes?.some((s: any) => s.stock > 0)
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:py-16">
      <header className="animate-in fade-in slide-in-from-bottom-4 duration-500 mb-10">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground">
          Catalogo
        </p>
        <h1 className="text-4xl font-bold text-foreground md:text-5xl">{label}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {productList.length} producto{productList.length !== 1 ? "s" : ""} disponible{productList.length !== 1 ? "s" : ""}
        </p>
      </header>

      {productList.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 md:gap-6 md:grid-cols-3 lg:grid-cols-4 overflow-hidden">
          {productList.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="animate-in fade-in duration-500 flex h-72 items-center justify-center rounded-2xl border border-dashed border-border/50 bg-muted/20">
          <p className="text-sm text-muted-foreground">
            No hay productos en esta categoria aun
          </p>
        </div>
      )}
    </div>
  )
}
