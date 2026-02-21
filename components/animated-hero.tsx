"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import Link from "next/link"

export function AnimatedHero() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50)
    return () => clearTimeout(timer)
  }, [])

  return (
    <section className="relative flex min-h-[80vh] items-center justify-center overflow-hidden bg-background px-4 py-24 md:py-32">
      <div className="text-center">
        <h1 
          className="text-[12vw] font-black uppercase tracking-tight text-foreground leading-none md:text-[10vw] lg:text-[8vw] transition-all duration-1000 ease-out"
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? "translateY(0) scale(1)" : "translateY(60px) scale(0.9)",
          }}
        >
          GOALWEAR
        </h1>
        <p 
          className="mt-6 max-w-md mx-auto text-balance text-base text-muted-foreground md:text-lg transition-all duration-700 ease-out"
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? "translateY(0)" : "translateY(30px)",
            transitionDelay: "200ms",
          }}
        >
          Las mejores camisetas de futbol. Entrega inmediata y personalizacion premium.
        </p>
        <div 
          className="mt-10 flex flex-wrap items-center justify-center gap-3 transition-all duration-700 ease-out"
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? "translateY(0)" : "translateY(30px)",
            transitionDelay: "400ms",
          }}
        >
          <Button asChild size="lg" className="rounded-full h-12 px-8 font-bold uppercase tracking-widest transition-all duration-300 hover:scale-105 active:scale-95">
            <Link href="/catalogo/entrega-inmediata">
              Ver Catalogo
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="rounded-full h-12 px-8 font-bold uppercase tracking-widest transition-all duration-300 hover:bg-foreground hover:text-background hover:scale-105 active:scale-95"
          >
            <Link href="/catalogo/pedido-previo">Personalizar</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
