import { createClient } from "@/lib/supabase/server"
import { AnimatedProductGrid } from "@/components/animated-product-grid"
import { AnimatedHero } from "@/components/animated-hero"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import Link from "next/link"

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

      if (query) {
        const ql = query.toLowerCase()
        list = list.filter(p => 
          p.name.toLowerCase().includes(ql) ||
          (p.team && p.team.toLowerCase().includes(ql)) ||
          p.code.toLowerCase().includes(ql) ||
          p.product_sizes?.some((s: any) => s.size.toLowerCase().includes(ql))
        )
      }

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
      {!isSearching && <AnimatedHero />}

      <div className="mx-auto max-w-7xl px-4 py-12 md:py-16">
        {isSearching && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 mb-10 border-b border-border/50 pb-6">
            <h1 className="text-2xl font-bold text-foreground">Resultados para &quot;{query}&quot;</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Mostrando coincidencias en todas las categorias
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
    <section className="mb-16 last:mb-0">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground md:text-3xl">{title}</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
        </div>
        {!isSearching && (
          <Button asChild variant="ghost" className="hidden rounded-full sm:flex transition-all duration-300 hover:bg-foreground hover:text-background">
            <Link href={href}>
              Ver todos
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        )}
      </div>

      {products.length > 0 ? (
        <AnimatedProductGrid products={products} />
      ) : (
        <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-border/50 bg-muted/20">
          <p className="text-sm text-muted-foreground">
            Proximamente se agregaran productos
          </p>
        </div>
      )}

      {!isSearching && (
        <div className="mt-6 text-center sm:hidden">
          <Button asChild variant="outline" size="sm" className="rounded-full">
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
