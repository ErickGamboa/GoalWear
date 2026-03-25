"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ShoppingCart, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCart } from "@/lib/cart-context"
import { useState, Suspense } from "react"
import { cn } from "@/lib/utils"
import { ProductSearch } from "./product-search"
import { ThemeToggle } from "./theme-toggle"

const NAV_LINKS = [
  { href: "/", label: "Inicio" },
  { href: "/catalogo/entrega-inmediata", label: "Entrega Inmediata" },
  { href: "/catalogo/pedido-previo", label: "Pedido Previo" },
  { href: "/catalogo/accesorios", label: "Accesorios" },
]

export function StoreHeader() {
  const { totalItems, setIsOpen } = useCart()
  const [menuOpen, setMenuOpen] = useState(false)
  const searchParams = useSearchParams()

  const isWorldCupMode =
    searchParams.get("sport") === "futbol" &&
    searchParams.get("soccerType") === "selection" &&
    (searchParams.get("worldCup") === "1" || searchParams.get("worldCup") === "true")

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl transition-all duration-700",
        isWorldCupMode &&
          "border-white/70 bg-[linear-gradient(90deg,rgba(0,104,71,0.24)_0%,rgba(255,255,255,0.88)_35%,rgba(206,17,38,0.22)_68%,rgba(60,59,110,0.24)_100%)]"
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:py-4">
        <Link href="/" className="mr-4 flex items-center gap-2.5 shrink-0 group">
          <div
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-xl bg-foreground transition-transform duration-300 group-hover:scale-105 md:h-10 md:w-10",
              isWorldCupMode &&
                "bg-gradient-to-br from-[#006847] via-[#ffffff] to-[#CE1126] text-[#3C3B6E] shadow-lg shadow-[#3C3B6E]/20"
            )}
          >
            <span className={cn("text-xs font-bold md:text-sm", isWorldCupMode ? "text-[#3C3B6E]" : "text-background")}>GW</span>
          </div>
          <span className={cn("hidden text-lg font-bold text-foreground sm:block", isWorldCupMode && "text-[#1f2a44]") }>
            {isWorldCupMode ? "GOΛLWEΛR MUNDIAL" : "GOΛLWEΛR"}
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-all duration-300 hover:bg-foreground hover:text-background whitespace-nowrap"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex flex-1 items-center justify-end gap-2 md:gap-4">
          <Suspense fallback={<div className="h-10 w-full md:max-w-[300px]" />}>
            <ProductSearch />
          </Suspense>
          <div className="flex items-center gap-1 md:gap-2">
            <ThemeToggle />
            <Button
              variant="outline"
              size="icon"
              className="relative h-10 w-10 rounded-full border-border/50 bg-transparent transition-all duration-300 hover:bg-foreground hover:text-background hover:border-foreground"
              onClick={() => setIsOpen(true)}
              aria-label="Abrir carrito"
            >
              <ShoppingCart className="h-4 w-4 md:h-5 md:w-5" />
              {totalItems > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-[10px] font-bold text-background animate-in zoom-in duration-200">
                  {totalItems}
                </span>
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full transition-all duration-300 hover:bg-foreground hover:text-background lg:hidden"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Menu"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      <div className={`overflow-hidden transition-all duration-300 ease-in-out lg:hidden ${menuOpen ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="border-t border-border/50 bg-background/95 backdrop-blur-xl px-4 py-2">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground transition-all duration-300 hover:bg-foreground hover:text-background"
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </header>
  )
}
