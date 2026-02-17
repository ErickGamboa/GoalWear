"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Product } from "@/lib/types"
import { CATEGORY_SLUGS } from "@/lib/types"
import { cn, formatCurrency } from "@/lib/utils"

export function ProductCard({ product }: { product: Product }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  
  const images = [
    product.image_url,
    product.image_url_2,
    product.image_url_3,
  ].filter(Boolean) as string[]

  const slug = CATEGORY_SLUGS[product.category]
  const inStock = product.has_stock

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isHovered && images.length > 1) {
      interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % images.length)
      }, 1500)
    } else {
      setCurrentIndex(0)
    }
    return () => clearInterval(interval)
  }, [isHovered, images.length])

  return (
    <Link href={`/catalogo/${slug}/${product.id}`}>
      <Card 
        className="group overflow-hidden border-border transition-all hover:shadow-md"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative aspect-[4/5] overflow-hidden bg-muted">
          {images.length > 0 ? (
            <>
              <img
                src={images[currentIndex] || "/placeholder.svg"}
                alt={product.name}
                className="h-full w-full object-cover transition-all duration-500"
              />
              
              {/* Dots Indicators */}
              {images.length > 1 && (
                <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5 px-2">
                  {images.map((_, i) => (
                    <div
                      key={i}
                      onClick={(e) => {
                        e.preventDefault()
                        setCurrentIndex(i)
                      }}
                      className={cn(
                        "h-1 rounded-full transition-all duration-300",
                        currentIndex === i 
                          ? "w-4 bg-primary" 
                          : "w-1 bg-white/60 hover:bg-white"
                      )}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              <span className="text-4xl font-bold opacity-20">GW</span>
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
            <p className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
              {product.team}
            </p>
          )}
          <h3 className="text-sm font-semibold text-foreground leading-tight line-clamp-1 group-hover:text-primary transition-colors">
            {product.name}
          </h3>
          <div className="mt-1.5 flex items-center justify-between">
            <span className="text-sm font-bold text-foreground">
              {formatCurrency(Number(product.price))}
            </span>
            <span className="text-[10px] font-medium text-muted-foreground uppercase">{product.code}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
