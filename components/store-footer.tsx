import Link from "next/link"

export function StoreFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-col items-center gap-4 md:flex-row md:justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <span className="text-xs font-bold text-primary-foreground">GW</span>
            </div>
            <span className="text-sm font-semibold text-foreground">GoalWear</span>
          </div>
          <nav className="flex gap-6">
            <Link
              href="/catalogo/entrega-inmediata"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Entrega Inmediata
            </Link>
            <Link
              href="/catalogo/pedido-previo"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Pedido Previo
            </Link>
            <Link
              href="/catalogo/accesorios"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Accesorios
            </Link>
          </nav>
          <p className="text-xs text-muted-foreground">
            GoalWear {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </footer>
  )
}
