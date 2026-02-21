"use client"

import { useEffect, useRef, useState } from "react"
import { ProductCard } from "@/components/product-card"
import type { Product } from "@/lib/types"

interface AnimatedProductGridProps {
  products: Product[]
}

export function AnimatedProductGrid({ products }: AnimatedProductGridProps) {
  const [visibleCards, setVisibleCards] = useState<Set<string>>(new Set())
  const gridRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const id = entry.target.getAttribute("data-product-id")
          if (id && entry.isIntersecting) {
            setVisibleCards((prev) => new Set(prev).add(id))
          }
        })
      },
      { 
        threshold: 0.1, 
        rootMargin: "0px 0px -50px 0px" 
      }
    )

    const cards = gridRef.current?.querySelectorAll("[data-product-id]")
    cards?.forEach((card) => observer.observe(card))

    return () => observer.disconnect()
  }, [products])

  return (
    <div ref={gridRef} className="grid grid-cols-2 gap-4 md:gap-6 md:grid-cols-4 overflow-hidden">
      {products.map((product, index) => {
        const isVisible = visibleCards.has(product.id)
        return (
          <div
            key={product.id}
            data-product-id={product.id}
            className="transition-all duration-700 ease-out"
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible 
                ? "translateY(0) scale(1)" 
                : "translateY(40px) scale(0.95)",
              transitionDelay: `${index * 80}ms`,
            }}
          >
            <ProductCard product={product} />
          </div>
        )
      })}
    </div>
  )
}
