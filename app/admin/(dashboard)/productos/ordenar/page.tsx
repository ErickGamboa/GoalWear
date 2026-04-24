import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { SortClient } from "./sort-client"

type SortableProduct = {
  id: string
  name: string
  team: string | null
  code: string
  category: string
  sort_order: number | null
}

const PAGE = 1000

async function fetchAllProducts(supabase: Awaited<ReturnType<typeof createClient>>): Promise<SortableProduct[]> {
  const all: SortableProduct[] = []
  let from = 0

  while (true) {
    const { data, error } = await supabase
      .from("products")
      .select("id, name, team, code, category, sort_order")
      .order("sort_order", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false })
      .range(from, from + PAGE - 1)

    if (error) {
      // sort_order column doesn't exist yet — fall back to created_at only
      return fetchAllProductsFallback(supabase)
    }

    if (!data?.length) break
    all.push(...(data as SortableProduct[]))
    if (data.length < PAGE) break
    from += PAGE
  }

  return all
}

async function fetchAllProductsFallback(supabase: Awaited<ReturnType<typeof createClient>>): Promise<SortableProduct[]> {
  const all: SortableProduct[] = []
  let from = 0

  while (true) {
    const { data } = await supabase
      .from("products")
      .select("id, name, team, code, category")
      .order("created_at", { ascending: false })
      .range(from, from + PAGE - 1)

    if (!data?.length) break
    all.push(...(data as SortableProduct[]))
    if (data.length < PAGE) break
    from += PAGE
  }

  return all
}

export default async function OrdenarProductosPage() {
  const supabase = await createClient()
  const products = await fetchAllProducts(supabase)

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/productos"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a Productos
        </Link>
        <h1 className="text-2xl font-bold text-foreground">Ordenar Productos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Buscá por equipo (ej. &quot;Inter&quot;), arrastrá los grupos al orden deseado y guardá.
          Los cambios se reflejan en el homepage y catálogo.
        </p>
      </div>

      <SortClient initialProducts={products} />
    </div>
  )
}
