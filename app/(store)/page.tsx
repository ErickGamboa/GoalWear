import { createClient } from "@/lib/supabase/server"
import { ProductCard } from "@/components/product-card"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import Link from "next/link"
import type { Product } from "@/lib/types"

async function getFeaturedProducts(query?: string) {
  const supabase = await createClient()

  const categories = ["immediate", "preorder", "accessory"]
  const results = await Promise.all(
    categories.map(async (category) => {
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
      } else {
        dbQuery = dbQuery.limit(4)
      }

      const { data } = await dbQuery
      let list = (data ?? []) as any[]

      // Filter by size if query exists
      if (query) {
        const ql = query.toLowerCase()
        list = list.filter(p => 
          p.name.toLowerCase().includes(ql) ||
          (p.team && p.team.toLowerCase().includes(ql)) ||
          p.code.toLowerCase().includes(ql) ||
          p.product_sizes?.some((s: any) => s.size.toLowerCase().includes(ql))
        )
      }

      // NEW: Filter out "immediate" products with zero total stock
      if (category === "immediate") {
        list = list.filter(p => 
          p.product_sizes?.some((s: any) => s.stock > 0)
        )
      }

      return list
    })
  )

  return {
    immediate: results[0],
    preorder: results[1],
    accessories: results[2],
  }
}

export default async function HomePage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q: query } = await searchParams
  const { immediate, preorder, accessories } = await getFeaturedProducts(query)

  const isSearching = !!query

  return (
    <>
      {/* Hero */}
      {!isSearching && (
        <section className="relative overflow-hidden bg-foreground px-4 py-20 md:py-28">
          <div className="mx-auto max-w-7xl text-center">
            <h1 className="text-balance text-4xl font-bold tracking-tight text-background md:text-6xl">
              Camisetas Deportivas
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-pretty text-base text-background/70 md:text-lg">
              Encuentra las mejores camisetas de tus equipos favoritos. Entrega inmediata, pedidos personalizados y accesorios.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg">
                <Link href="/catalogo/entrega-inmediata">
                  Entrega Inmediata
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-background/30 bg-transparent text-background hover:bg-background/10 hover:text-background"
              >
                <Link href="/catalogo/pedido-previo">Personalizar Camiseta</Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Category Sections */}
      <div className="mx-auto max-w-7xl px-4 py-12 md:py-16">
        {isSearching && (
          <div className="mb-8 border-b pb-4">
            <h1 className="text-2xl font-bold">Resultados para: "{query}"</h1>
            <p className="text-muted-foreground">
              Mostrando coincidencias en todas las categorías
            </p>
          </div>
        )}

        <CategorySection
          title="Entrega Inmediata"
          description="Camisetas listas para enviar. Stock disponible."
          href="/catalogo/entrega-inmediata"
          products={immediate}
          isSearching={isSearching}
        />

        <CategorySection
          title="Pedido Previo"
          description="Camisetas personalizadas con nombre, numero y parches."
          href="/catalogo/pedido-previo"
          products={preorder}
          isSearching={isSearching}
        />

        <CategorySection
          title="Accesorios"
          description="Gorras, bufandas, guantes y mas."
          href="/catalogo/accesorios"
          products={accessories}
          isSearching={isSearching}
        />
      </div>
    </>
  )
}

function CategorySection({
  title,
  description,
  href,
  products,
  isSearching,
}: {
  title: string
  description: string
  href: string
  products: any[]
  isSearching?: boolean
}) {
  if (isSearching && products.length === 0) return null

  return (
    <section className="mb-12 last:mb-0">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        {!isSearching && (
          <Button asChild variant="ghost" className="hidden sm:flex">
            <Link href={href}>
              Ver todos
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        )}
      </div>

      {products.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-border">
          <p className="text-sm text-muted-foreground">
            Proximamente se agregaran productos
          </p>
        </div>
      )}

      {!isSearching && (
        <div className="mt-4 text-center sm:hidden">
          <Button asChild variant="outline" size="sm">
            <Link href={href}>
              Ver todos
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      )}
    </section>
  )
}
