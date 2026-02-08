import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Product } from "@/lib/types"
import { CATEGORY_SLUGS } from "@/lib/types"

export function ProductCard({ product }: { product: Product }) {
  const slug = CATEGORY_SLUGS[product.category]
  const inStock = product.has_stock

  return (
    <Link href={`/catalogo/${slug}/${product.id}`}>
      <Card className="group overflow-hidden border-border transition-shadow hover:shadow-lg">
        <div className="relative aspect-square overflow-hidden bg-muted">
          {product.image_url ? (
            <img
              src={product.image_url || "/placeholder.svg"}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              <span className="text-4xl font-bold opacity-20">JS</span>
            </div>
          )}
          {!inStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/60">
              <Badge variant="secondary" className="text-xs">
                Agotado
              </Badge>
            </div>
          )}
        </div>
        <CardContent className="p-3">
          {product.team && (
            <p className="mb-0.5 text-xs font-medium text-muted-foreground">
              {product.team}
            </p>
          )}
          <h3 className="text-sm font-semibold text-foreground leading-tight line-clamp-2">
            {product.name}
          </h3>
          <div className="mt-1.5 flex items-center justify-between">
            <span className="text-sm font-bold text-primary">
              ${Number(product.price).toFixed(2)}
            </span>
            <span className="text-[11px] text-muted-foreground">{product.code}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
