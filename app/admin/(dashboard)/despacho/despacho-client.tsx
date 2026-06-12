"use client"

import React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import Link from "next/link"
import { Truck, Search } from "lucide-react"
import type { OrderWithItems } from "@/lib/types"
import { formatCurrency, cn } from "@/lib/utils"

type Props = {
  orders: OrderWithItems[]
}

// Date filter is persisted here so it survives navigating into an order and back,
// avoiding rework (the user keeps the same range while dispatching).
const FROM_KEY = "despacho:fromDate"
const TO_KEY = "despacho:toDate"

export function DespachoClient({ orders }: Props) {
  const [fromDate, setFromDate] = React.useState("")
  const [toDate, setToDate] = React.useState("")
  const [search, setSearch] = React.useState("")
  const [hydrated, setHydrated] = React.useState(false)

  // Restore the filter on mount.
  React.useEffect(() => {
    setFromDate(sessionStorage.getItem(FROM_KEY) ?? "")
    setToDate(sessionStorage.getItem(TO_KEY) ?? "")
    setHydrated(true)
  }, [])

  // Persist on every change.
  React.useEffect(() => {
    if (!hydrated) return
    sessionStorage.setItem(FROM_KEY, fromDate)
    sessionStorage.setItem(TO_KEY, toDate)
  }, [fromDate, toDate, hydrated])

  const isDateInRange = React.useCallback(
    (createdAt: string) => {
      const date = new Date(createdAt)
      if (fromDate) {
        const from = new Date(`${fromDate}T00:00:00`)
        if (date < from) return false
      }
      if (toDate) {
        const to = new Date(`${toDate}T23:59:59.999`)
        if (date > to) return false
      }
      return true
    },
    [fromDate, toDate]
  )

  const matchesSearch = React.useCallback(
    (order: OrderWithItems) => {
      const q = search.trim().toLowerCase()
      if (!q) return true
      return (
        order.customer_name.toLowerCase().includes(q) ||
        order.customer_email.toLowerCase().includes(q) ||
        (order.customer_phone ?? "").toLowerCase().includes(q)
      )
    },
    [search]
  )

  const filteredOrders = orders.filter(
    (order) => isDateInRange(order.created_at) && matchesSearch(order)
  )

  const clearFilter = () => {
    setFromDate("")
    setToDate("")
    setSearch("")
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Despacho</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pedidos tomados (amarillo) pendientes de entregar. Filtra por fecha, alista y entrega.
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div>
            <Label htmlFor="search">Buscar</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="search"
                type="text"
                placeholder="Cliente, email o telefono"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-[240px] pl-9"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="from-date">Del</Label>
            <Input
              id="from-date"
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-[170px]"
            />
          </div>
          <div>
            <Label htmlFor="to-date">Hasta</Label>
            <Input
              id="to-date"
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-[170px]"
            />
          </div>
          {(fromDate || toDate || search) && (
            <Button type="button" variant="ghost" onClick={clearFilter}>
              Limpiar filtros
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap">Fecha</TableHead>
                <TableHead className="whitespace-nowrap">Cliente</TableHead>
                <TableHead className="whitespace-nowrap">Email</TableHead>
                <TableHead className="whitespace-nowrap">Telefono</TableHead>
                <TableHead className="text-right whitespace-nowrap">Total</TableHead>
                <TableHead className="text-right whitespace-nowrap">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    No hay pedidos pendientes de despacho
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => (
                  <TableRow
                    key={order.id}
                    className={cn(
                      "bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:hover:bg-yellow-900/40"
                    )}
                  >
                    <TableCell className="text-muted-foreground whitespace-nowrap">
                      {new Date(order.created_at).toLocaleDateString("es-MX", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell className="font-medium text-foreground whitespace-nowrap">
                      {order.customer_name}
                    </TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap">
                      {order.customer_email}
                    </TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap">
                      {order.customer_phone || "-"}
                    </TableCell>
                    <TableCell className="text-right font-bold text-foreground whitespace-nowrap">
                      {formatCurrency(Number(order.total))}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="sm">
                        <Link href={`/admin/despacho/${order.id}`}>
                          <Truck className="mr-1 h-4 w-4" />
                          Despachar
                        </Link>
                      </Button>
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
