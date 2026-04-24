"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import Link from "next/link"
import { Plus, Search, X, ArrowUpDown } from "lucide-react"
import { CATEGORY_LABELS, SPORT_LABELS } from "@/lib/types"
import type { Product } from "@/lib/types"
import { DeleteProductButton } from "./delete-product-button"
import { formatCurrency } from "@/lib/utils"

export function ProductsClient({ products }: { products: Product[] }) {
  const [search, setSearch] = useState("")

  const q = search.trim().toLowerCase()
  const filtered = q
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.code.toLowerCase().includes(q) ||
          (p.team && p.team.toLowerCase().includes(q)) ||
          CATEGORY_LABELS[p.category]?.toLowerCase().includes(q) ||
          SPORT_LABELS[p.sport]?.toLowerCase().includes(q)
      )
    : products

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Productos</h1>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/productos/ordenar">
              <ArrowUpDown className="mr-2 h-4 w-4" />
              Ordenar
            </Link>
          </Button>
          <Button asChild>
            <Link href="/admin/productos/nuevo">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Producto
            </Link>
          </Button>
        </div>
      </div>

      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          placeholder="Buscar por nombre, código, equipo, categoría o deporte..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-border bg-background pl-9 pr-9 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {q && (
        <p className="mb-3 text-xs text-muted-foreground">
          {filtered.length} resultado{filtered.length !== 1 ? "s" : ""} para &quot;{search.trim()}&quot;
        </p>
      )}

      <div className="rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Codigo</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Equipo</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Deporte</TableHead>
                <TableHead className="text-right">Precio</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                    {q ? `No hay productos que coincidan con "${search.trim()}"` : "No hay productos"}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-mono text-sm whitespace-nowrap">
                      {product.code}
                    </TableCell>
                    <TableCell className="font-medium text-foreground whitespace-nowrap">
                      {product.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap">
                      {product.team || "-"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Badge variant="secondary" className="text-xs">
                        {CATEGORY_LABELS[product.category]}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Badge variant="outline" className="text-xs">
                        {SPORT_LABELS[product.sport]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium whitespace-nowrap">
                      {formatCurrency(Number(product.price))}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/admin/productos/${product.id}`}>Editar</Link>
                        </Button>
                        <DeleteProductButton productId={product.id} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
