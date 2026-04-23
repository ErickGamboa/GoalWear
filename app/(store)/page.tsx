import { createClient } from "@/lib/supabase/server"
import { AnimatedProductGrid } from "@/components/animated-product-grid"
import { AnimatedHero } from "@/components/animated-hero"
import { HomeFilters } from "@/components/home-filters"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { Suspense } from "react"

export const revalidate = 60

async function getFeaturedProducts(
  query?: string,
  worldCup?: boolean,
  mujeres?: boolean
) {
  const supabase = await createClient()
  const isFiltered = worldCup || mujeres

  const categories = ["immediate", "preorder", "accessory"]
  const results = await Promise.all(
    categories.map(async (category) => {
      let dbQuery = supabase
        .from("products")
        .select(
          `id, name, price, image_url, image_url_2, image_url_3, team, code, sport, category, has_stock,
          product_sizes (size, stock)`
        )
        .eq("category", category)
        .order("created_at", { ascending: false })

      // default: show only soccer for jersey categories; skip in mujeres mode (all sports)
      if (!mujeres && (category === "immediate" || category === "preorder")) {
        dbQuery = dbQuery.eq("sport", "soccer")
      }

      if (query && !mujeres) {
        dbQuery = dbQuery.or(`name.ilike.%${query}%,team.ilike.%${query}%,code.ilike.%${query}%`)
      } else if (!isFiltered) {
        dbQuery = dbQuery.limit(4)
      }

      const { data } = await dbQuery
      let list = (data ?? []) as any[]

      if (query && !mujeres) {
        const ql = query.toLowerCase()
        list = list.filter(p =>
          p.name.toLowerCase().includes(ql) ||
          (p.team && p.team.toLowerCase().includes(ql)) ||
          p.code.toLowerCase().includes(ql) ||
          p.product_sizes?.some((s: any) => s.size.toLowerCase().includes(ql))
        )
      }

      if (worldCup) {
        list = list.filter(p => p.name.toLowerCase().includes("mundial"))
      }

      if (mujeres) {
        list = list.filter(p => {
          const n = p.name.toLowerCase()
          return n.includes("mujer") || n.includes("woman")
        })
      }

      if (category === "immediate") {
        list = list.filter(p =>
          p.product_sizes?.some((s: any) => s.stock > 0)
        )
      }

      return list.slice(0, 4)
    })
  )

  return {
    immediate: results[0],
    preorder: results[1],
    accessories: results[2],
  }
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; worldCup?: string; mujeres?: string; sport?: string; soccerType?: string }>
}) {
  const { q: query, worldCup: wcParam, mujeres: mujeresParam, sport, soccerType } = await searchParams
  const isWorldCup = wcParam === "1" && sport === "futbol" && soccerType === "selection"
  const isMujeres = mujeresParam === "1"

  const { immediate, preorder, accessories } = await getFeaturedProducts(
    query,
    isWorldCup,
    isMujeres
  )

  const isSearching = !!query

  const immediateHref = isWorldCup
    ? "/catalogo/entrega-inmediata?sport=futbol&soccerType=selection&worldCup=1"
    : isMujeres
    ? "/catalogo/entrega-inmediata?sport=futbol&mujeres=1"
    : "/catalogo/entrega-inmediata"

  const preorderHref = isWorldCup
    ? "/catalogo/pedido-previo?sport=futbol&soccerType=selection&worldCup=1"
    : isMujeres
    ? "/catalogo/pedido-previo?sport=futbol&mujeres=1"
    : "/catalogo/pedido-previo"

  return (
    <>
      {!isSearching && <AnimatedHero />}

      <div className="mx-auto max-w-7xl px-4 py-12 md:py-16">
        {isSearching ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 mb-10 border-b border-border/50 pb-6">
            <h1 className="text-2xl font-bold text-foreground">Resultados para &quot;{query}&quot;</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Mostrando coincidencias en todas las categorias
            </p>
          </div>
        ) : (
          <Suspense>
            <HomeFilters isWorldCup={isWorldCup} isMujeres={isMujeres} />
          </Suspense>
        )}

        <CategorySection
          title="Entrega Inmediata"
          description={
            isMujeres
              ? "Camisetas femeninas disponibles para envío inmediato."
              : isWorldCup
              ? "Selecciones del Mundial disponibles en stock."
              : "Camisetas listas para enviar. Stock disponible."
          }
          href={immediateHref}
          products={immediate}
          isSearching={isSearching}
          isFiltered={isWorldCup || isMujeres}
        />

        <CategorySection
          title="Pedido Previo"
          description={
            isMujeres
              ? "Camisetas femeninas personalizadas con nombre y numero."
              : isWorldCup
              ? "Selecciones del Mundial para personalizar con tu nombre."
              : "Camisetas personalizadas con nombre, numero y parches."
          }
          href={preorderHref}
          products={preorder}
          isSearching={isSearching}
          isFiltered={isWorldCup || isMujeres}
        />

        <CategorySection
          title="Accesorios"
          description="Jerseys, abrigos, gorras, calzado y más"
          href="/catalogo/accesorios"
          products={accessories}
          isSearching={isSearching}
          isFiltered={isWorldCup || isMujeres}
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
  isFiltered,
}: {
  title: string
  description: string
  href: string
  products: any[]
  isSearching?: boolean
  isFiltered?: boolean
}) {
  if ((isSearching || isFiltered) && products.length === 0) return null

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
