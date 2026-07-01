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
  mujeres?: boolean,
  masVendidos?: boolean
) {
  const supabase = await createClient()
  const isFiltered = worldCup || mujeres || masVendidos

  const categories = ["immediate", "preorder", "accessory"]
  const results = await Promise.all(
    categories.map(async (category) => {
      // immediate cards must have stock: use an inner join on product_sizes so the
      // DB itself drops out-of-stock products. Otherwise limit() truncates BEFORE the
      // stock filter runs and in-stock products ranked lower never make it into a card.
      const sizesJoin =
        category === "immediate" ? "product_sizes!inner (size, stock)" : "product_sizes (size, stock)"

      let dbQuery = supabase
        .from("products")
        .select(
          `id, name, price, image_url, image_url_2, image_url_3, team, code, sport, category, has_stock, is_bestseller,
          ${sizesJoin}`
        )
        .eq("category", category)
        .order("sort_order", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: false })

      if (category === "immediate") {
        dbQuery = dbQuery.gt("product_sizes.stock", 0)
      }

      // default: show only soccer for jersey categories; skip in mujeres mode (all sports).
      // Match the catalog: treat NULL sport as soccer too.
      if (!mujeres && !masVendidos && (category === "immediate" || category === "preorder")) {
        dbQuery = dbQuery.or("sport.eq.soccer,sport.is.null")
      }

      if (masVendidos) {
        dbQuery = dbQuery.eq("is_bestseller", true)
      }

      if (query && !mujeres) {
        dbQuery = dbQuery.or(`name.ilike.%${query}%,team.ilike.%${query}%,code.ilike.%${query}%`)
      } else if (!isFiltered) {
        // stock is now filtered in the DB, so limit(4) accurately fills the cards
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
  searchParams: Promise<{ q?: string; worldCup?: string; mujeres?: string; sport?: string; soccerType?: string; masVendidos?: string }>
}) {
  const { q: query, worldCup: wcParam, mujeres: mujeresParam, sport, soccerType, masVendidos: masVendidosParam } = await searchParams
  const isWorldCup = wcParam === "1" && sport === "futbol" && soccerType === "selection"
  const isMujeres = mujeresParam === "1"
  const isMasVendidos = masVendidosParam === "1"
  const isSearching = !!query

  const { immediate, preorder, accessories } = await getFeaturedProducts(
    query,
    isWorldCup,
    isMujeres,
    isMasVendidos
  )

  const immediateHref = isSearching
    ? `/catalogo/entrega-inmediata?q=${encodeURIComponent(query!)}`
    : isWorldCup
    ? "/catalogo/entrega-inmediata?sport=futbol&soccerType=selection&worldCup=1"
    : isMujeres
    ? "/catalogo/entrega-inmediata?sport=futbol&mujeres=1"
    : isMasVendidos
    ? "/catalogo/entrega-inmediata?masVendidos=1"
    : "/catalogo/entrega-inmediata"

  const preorderHref = isSearching
    ? `/catalogo/pedido-previo?q=${encodeURIComponent(query!)}`
    : isWorldCup
    ? "/catalogo/pedido-previo?sport=futbol&soccerType=selection&worldCup=1"
    : isMujeres
    ? "/catalogo/pedido-previo?sport=futbol&mujeres=1"
    : isMasVendidos
    ? "/catalogo/pedido-previo?masVendidos=1"
    : "/catalogo/pedido-previo"

  const accessoriesHref = isSearching
    ? `/catalogo/accesorios?q=${encodeURIComponent(query!)}`
    : "/catalogo/accesorios"

  const isFiltered = isWorldCup || isMujeres || isMasVendidos

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
            <HomeFilters isWorldCup={isWorldCup} isMujeres={isMujeres} isMasVendidos={isMasVendidos} />
          </Suspense>
        )}

        <CategorySection
          title="Pedido Previo"
          description={
            isMasVendidos
              ? "Los más pedidos para personalizar con tu nombre."
              : isMujeres
              ? "Camisetas femeninas personalizadas con nombre y numero."
              : isWorldCup
              ? "Selecciones del Mundial para personalizar con tu nombre."
              : "Camisetas personalizadas con nombre, numero y parches."
          }
          href={preorderHref}
          products={preorder}
          isSearching={isSearching}
          isFiltered={isFiltered}
        />

        <CategorySection
          title="Entrega Inmediata"
          description={
            isMasVendidos
              ? "Los más vendidos con stock disponible."
              : isMujeres
              ? "Camisetas femeninas disponibles para envío inmediato."
              : isWorldCup
              ? "Selecciones del Mundial disponibles en stock."
              : "Camisetas listas para enviar. Stock disponible."
          }
          href={immediateHref}
          products={immediate}
          isSearching={isSearching}
          isFiltered={isFiltered}
        />

        {!isMasVendidos && (
          <CategorySection
            title="Artículos Deportivos"
            description="Espinilleras, medias, guantes, botellas y más"
            href={accessoriesHref}
            products={accessories}
            isSearching={isSearching}
            isFiltered={isWorldCup || isMujeres}
          />
        )}
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
        <Button asChild variant="ghost" className="hidden rounded-full sm:flex transition-all duration-300 hover:bg-foreground hover:text-background">
          <Link href={href}>
            Ver todos
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
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

      <div className="mt-6 text-center sm:hidden">
        <Button asChild variant="outline" size="sm" className="rounded-full">
          <Link href={href}>
            Ver todos
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </section>
  )
}
