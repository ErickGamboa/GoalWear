"use client"

import Link from "next/link"
import { ShoppingCart, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCart } from "@/lib/cart-context"
import { useState } from "react"
import { ProductSearch } from "./product-search"

const NAV_LINKS = [
  { href: "/", label: "Inicio" },
  { href: "/catalogo/entrega-inmediata", label: "Entrega Inmediata" },
  { href: "/catalogo/pedido-previo", label: "Pedido Previo" },
  { href: "/catalogo/accesorios", label: "Accesorios" },
]

export function StoreHeader() {
  const { totalItems, setIsOpen } = useCart()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link href="/" className="mr-4 flex items-center gap-2 shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary md:h-9 md:w-9">
            <span className="text-[10px] font-bold text-primary-foreground md:text-sm">GW</span>
          </div>
          <span className="hidden text-lg font-bold text-foreground sm:block">GoalWear</span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground whitespace-nowrap"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex flex-1 items-center justify-end gap-2 md:gap-4">
          <ProductSearch />
          <div className="flex items-center gap-1 md:gap-2">
            <Button
              variant="outline"
              size="icon"
              className="relative h-9 w-9 bg-transparent"
              onClick={() => setIsOpen(true)}
              aria-label="Abrir carrito"
            >
              <ShoppingCart className="h-4 w-4 md:h-5 md:w-5" />
              {totalItems > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground md:h-5 md:w-5 md:text-[11px]">
                  {totalItems}
                </span>
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 lg:hidden"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Menu"
            >
              {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>

      {menuOpen && (
        <div className="border-t border-border bg-card px-4 py-2 lg:hidden">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  )
}
