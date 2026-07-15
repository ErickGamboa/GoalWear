import Link from "next/link"
import { ACCESSORY_SECTIONS, CATEGORY_SLUGS } from "@/lib/types"

export function StoreFooter() {
  return (
    <footer className="border-t border-border/50 bg-background">
      <div className="mx-auto max-w-7xl px-4 py-10 md:py-12">
        <div className="flex flex-col items-center gap-6 md:flex-row md:justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-foreground transition-transform duration-300 group-hover:scale-105">
              <span className="text-xs font-bold text-background">GW</span>
            </div>
            <span className="text-base font-bold text-foreground">GOΛLWEΛR</span>
          </Link>
          <nav className="flex flex-wrap justify-center gap-6 md:gap-8">
            <Link
              href="/catalogo/entrega-inmediata"
              className="text-sm text-muted-foreground transition-all duration-300 hover:text-foreground hover:underline underline-offset-4"
            >
              Entrega Inmediata
            </Link>
            <Link
              href="/catalogo/pedido-previo"
              className="text-sm text-muted-foreground transition-all duration-300 hover:text-foreground hover:underline underline-offset-4"
            >
              Pedido Previo
            </Link>
            {ACCESSORY_SECTIONS.map((s) => (
              <Link
                key={s.category}
                href={`/catalogo/${CATEGORY_SLUGS[s.category]}`}
                className="text-sm text-muted-foreground transition-all duration-300 hover:text-foreground hover:underline underline-offset-4"
              >
                {s.title}
              </Link>
            ))}
          </nav>
          <p className="text-xs text-muted-foreground">
            GOΛLWEΛR {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </footer>
  )
}
