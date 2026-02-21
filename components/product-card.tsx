"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Product } from "@/lib/types"
import { CATEGORY_SLUGS } from "@/lib/types"
import { cn, formatCurrency } from "@/lib/utils"

export function ProductCard({ product }: { product: Product }) {
  const images = [
    product.image_url,
    product.image_url_2,
    product.image_url_3,
  ].filter(Boolean) as string[]

  const slug = CATEGORY_SLUGS[product.category]
  const inStock = product.has_stock

  return (
    <Link href={`/catalogo/${slug}/${product.id}`}>
      <article className="group relative overflow-hidden rounded-xl border border-border/50 bg-card transition-[transform,box-shadow,border-color] duration-300 ease-out will-change-transform hover:-translate-y-1.5 hover:shadow-lg hover:shadow-black/5 hover:border-border">
        <div className="relative aspect-[4/5] overflow-hidden bg-muted/50">
          <img
            src={images[0] || "/placeholder.svg"}
            alt={product.name}
            className="h-full w-full object-cover"
          />
          
          {!inStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-[2px]">
              <Badge className="bg-foreground text-background px-3 py-1 uppercase text-xs font-bold tracking-wider">
                Sin Stock
              </Badge>
            </div>
          )}
        </div>
        
        <CardContent className="p-4">
          {product.team && (
            <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {product.team}
            </p>
          )}
          <h3 className="text-sm font-semibold text-foreground leading-tight line-clamp-1">
            {product.name}
          </h3>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-base font-black text-foreground">
              {formatCurrency(Number(product.price))}
            </span>
            <span className="text-[10px] font-mono text-muted-foreground/50">{product.code}</span>
          </div>
        </CardContent>
      </article>
    </Link>
  )
}
