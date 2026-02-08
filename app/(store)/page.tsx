import { createClient } from "@/lib/supabase/server"
import { ProductCard } from "@/components/product-card"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import Link from "next/link"
import type { Product } from "@/lib/types"

async function getFeaturedProducts() {
  const supabase = await createClient()

  const [immediate, preorder, accessories] = await Promise.all([
    supabase
      .from("products")
      .select("*")
      .eq("category", "immediate")
      .order("created_at", { ascending: false })
      .limit(4),
    supabase
      .from("products")
      .select("*")
      .eq("category", "preorder")
      .order("created_at", { ascending: false })
      .limit(4),
    supabase
      .from("products")
      .select("*")
      .eq("category", "accessory")
      .order("created_at", { ascending: false })
      .limit(4),
  ])

  return {
    immediate: (immediate.data ?? []) as Product[],
    preorder: (preorder.data ?? []) as Product[],
    accessories: (accessories.data ?? []) as Product[],
  }
}

export default async function HomePage() {
  const { immediate, preorder, accessories } = await getFeaturedProducts()

  return (
    <>
      {/* Hero */}
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

      {/* Category Sections */}
      <div className="mx-auto max-w-7xl px-4 py-12 md:py-16">
        <CategorySection
          title="Entrega Inmediata"
          description="Camisetas listas para enviar. Stock disponible."
          href="/catalogo/entrega-inmediata"
          products={immediate}
        />

        <CategorySection
          title="Pedido Previo"
          description="Camisetas personalizadas con nombre, numero y parches."
          href="/catalogo/pedido-previo"
          products={preorder}
        />

        <CategorySection
          title="Accesorios"
          description="Gorras, bufandas, guantes y mas."
          href="/catalogo/accesorios"
          products={accessories}
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
}: {
  title: string
  description: string
  href: string
  products: Product[]
}) {
  return (
    <section className="mb-12 last:mb-0">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        <Button asChild variant="ghost" className="hidden sm:flex">
          <Link href={href}>
            Ver todos
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
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

      <div className="mt-4 text-center sm:hidden">
        <Button asChild variant="outline" size="sm">
          <Link href={href}>
            Ver todos
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </section>
  )
}
