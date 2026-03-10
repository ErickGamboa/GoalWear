import { notFound, redirect } from "next/navigation"
import type { Metadata } from "next"
import Link from "next/link"
import type { ReactNode } from "react"

import { CatalogSportFilter } from "@/components/catalog-sport-filter"
import { ProductCard } from "@/components/product-card"
import { createClient } from "@/lib/supabase/server"
import { CATEGORY_LABELS, SLUG_TO_CATEGORY, SPORT_SLUG_TO_ID } from "@/lib/types"
import type { Product } from "@/lib/types"

export const revalidate = 60

type Props = {
  params: Promise<{ category: string }>
  searchParams: Promise<{ q?: string; sport?: string; page?: string }>
}

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category: slug } = await params
  const category = SLUG_TO_CATEGORY[slug]
  if (!category) return {}
  const label = CATEGORY_LABELS[category]
  return {
    title: `${label} | GOΛLWEΛR`,
    description: `Catalogo de ${label.toLowerCase()} - GOΛLWEΛR`,
  }
}

const PAGE_SIZE = 12
const PRODUCT_COLUMNS = `
  id, name, price, image_url, image_url_2, image_url_3, team, code, sport, category, has_stock, created_at,
  product_sizes (size, stock)
`
type ProductRecord = Product & {
  product_sizes?: { size: string; stock: number }[]
}

export default async function CatalogPage({ params, searchParams }: Props) {
  const { category: slug } = await params
  const { q: query, sport: sportSlug, page: pageParam } = await searchParams
  const category = SLUG_TO_CATEGORY[slug]
  if (!category) notFound()

  const label = CATEGORY_LABELS[category]
  const supabase = await createClient()

  const requestedPage = (() => {
    const parsed = Number(pageParam)
    if (!Number.isFinite(parsed) || parsed < 1) return 1
    return Math.floor(parsed)
  })()

  const isSportFilterEnabled = category === "immediate" || category === "preorder"
  if (isSportFilterEnabled && !sportSlug) {
    const params = new URLSearchParams()
    if (query) {
      params.set("q", query)
    }
    params.set("sport", "futbol")
    const search = params.toString()
    redirect(`/catalogo/${slug}?${search}`)
  }

  const resolvedSport = sportSlug ? SPORT_SLUG_TO_ID[sportSlug] : undefined
  const activeSport = isSportFilterEnabled ? (resolvedSport ?? "soccer") : null

  let dbQuery = supabase
    .from("products")
    .select(PRODUCT_COLUMNS, { count: "exact" })
    .eq("category", category)
    .order("created_at", { ascending: false })

  if (activeSport) {
    if (activeSport === "soccer") {
      dbQuery = dbQuery.or("sport.eq.soccer,sport.is.null")
    } else {
      dbQuery = dbQuery.eq("sport", activeSport)
    }
  }

  if (query) {
    dbQuery = dbQuery.or(`name.ilike.%${query}%,team.ilike.%${query}%,code.ilike.%${query}%`)
  }

  const buildPageHref = (page: number) => {
    const params = new URLSearchParams()
    if (query) params.set("q", query)
    if (sportSlug) params.set("sport", sportSlug)
    if (page > 1) params.set("page", String(page))
    const qs = params.toString()
    return qs ? `/catalogo/${slug}?${qs}` : `/catalogo/${slug}`
  }

  let paginatedProducts: ProductRecord[] = []
  let totalProducts = 0
  let totalPages = 1
  let currentPage = requestedPage
  let showingStart = 0
  let showingEnd = 0

  if (!query) {
    const offset = (requestedPage - 1) * PAGE_SIZE
    const { data, count, error } = await dbQuery.range(offset, offset + PAGE_SIZE - 1)

    if (error) {
      throw error
    }

    totalProducts = count ?? 0
    totalPages = Math.max(1, Math.ceil(totalProducts / PAGE_SIZE))

    if (totalProducts > 0 && requestedPage > totalPages) {
      redirect(buildPageHref(totalPages))
    }

    currentPage = Math.min(requestedPage, totalPages)
    paginatedProducts = (data ?? []) as ProductRecord[]
    showingStart = totalProducts === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1
    showingEnd = totalProducts === 0 ? 0 : showingStart + paginatedProducts.length - 1
  } else {
    const { data } = await dbQuery
    let productList = (data ?? []) as ProductRecord[]

    if (activeSport) {
      productList = productList.filter((product) => {
        const sportValue = product.sport ?? null
        if (!sportValue) {
          return activeSport === "soccer"
        }
        return sportValue === activeSport
      })
    }

    if (query) {
      const queryLower = query.toLowerCase()
      productList = productList.filter((p) =>
        p.name.toLowerCase().includes(queryLower) ||
        (p.team && p.team.toLowerCase().includes(queryLower)) ||
        p.code.toLowerCase().includes(queryLower) ||
        p.product_sizes?.some((s: any) => s.size.toLowerCase().includes(queryLower))
      )
    }

    if (category === "immediate") {
      productList = productList.filter((p) =>
        p.product_sizes?.some((s: any) => s.stock > 0)
      )
    }

    totalProducts = productList.length
    totalPages = Math.max(1, Math.ceil(totalProducts / PAGE_SIZE))

    if (totalProducts > 0 && requestedPage > totalPages) {
      redirect(buildPageHref(totalPages))
    }

    currentPage = Math.min(requestedPage, totalPages)
    const startIndex = (currentPage - 1) * PAGE_SIZE
    paginatedProducts = productList.slice(startIndex, startIndex + PAGE_SIZE)
    showingStart = totalProducts === 0 ? 0 : startIndex + 1
    showingEnd = Math.min(totalProducts, startIndex + paginatedProducts.length)
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:py-16">
      <header className="animate-in fade-in slide-in-from-bottom-4 duration-500 mb-10">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground">
          Catalogo
        </p>
        <h1 className="text-4xl font-bold text-foreground md:text-5xl">{label}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {totalProducts} producto{totalProducts !== 1 ? "s" : ""} disponible{totalProducts !== 1 ? "s" : ""}
        </p>
        {totalProducts > 0 && (
          <p className="text-xs text-muted-foreground/80">
            Mostrando {showingStart}-{showingEnd} de {totalProducts}
          </p>
        )}
      </header>

      <CatalogSportFilter
        activeSport={isSportFilterEnabled ? activeSport : null}
        category={category}
      />

      {paginatedProducts.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 md:gap-6 md:grid-cols-3 lg:grid-cols-4 overflow-hidden">
          {paginatedProducts.map((product) => (
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

      {totalPages > 1 && (
        <div className="mt-10 flex flex-col items-center gap-4 border-t border-border/50 pt-6">
          <p className="text-xs font-medium text-muted-foreground">
            Página {currentPage} de {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <PaginationLink href={buildPageHref(1)} disabled={currentPage === 1}>
              Primera
            </PaginationLink>
            <PaginationLink href={buildPageHref(Math.max(1, currentPage - 1))} disabled={currentPage === 1}>
              Anterior
            </PaginationLink>
            <PaginationLink href={buildPageHref(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages}>
              Siguiente
            </PaginationLink>
            <PaginationLink href={buildPageHref(totalPages)} disabled={currentPage === totalPages}>
              Última
            </PaginationLink>
          </div>
        </div>
      )}
    </div>
  )
}

function PaginationLink({ href, disabled, children }: { href: string; disabled: boolean; children: ReactNode }) {
  if (disabled) {
    return (
      <span className="cursor-not-allowed rounded-full border border-border/50 px-3 py-1 text-xs text-muted-foreground/60">
        {children}
      </span>
    )
  }

  return (
    <Link
      href={href}
      className="rounded-full border border-border px-3 py-1 text-xs font-semibold text-foreground transition-all duration-200 hover:bg-foreground hover:text-background"
    >
      {children}
    </Link>
  )
}
