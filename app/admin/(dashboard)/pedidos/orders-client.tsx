"use client"

import React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2, Hand, RotateCcw, Search } from "lucide-react"
import type { OrderWithItems } from "@/lib/types"
import { formatCurrency } from "@/lib/utils"
import { takeOrders, declineOrders } from "./actions"

import { cn } from "@/lib/utils"

type OrderItemWithImage = OrderWithItems["order_items"][number] & {
  products?: { image_url: string | null } | null
}

type OrderWithItemsAndImages = Omit<OrderWithItems, "order_items"> & {
  order_items: OrderItemWithImage[]
}

type Props = {
  orders: OrderWithItemsAndImages[]
  patchMap: Record<string, string | null>
}

const KIDS_SIZE_DISPLAY: Record<string, string> = {
  XXS: "16 = 2-3 años",
  XS: "18 = 4-5 años",
  S: "20 = 6-7 años",
  M: "22 = 7-8 años",
  L: "24 = 8-9 años",
  XL: "26 = 9-10 años",
  XXL: "28 = 11-12 años",
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function toAbsoluteUrl(url: string) {
  if (/^https?:\/\//i.test(url)) return url
  if (url.startsWith("/")) return `${window.location.origin}${url}`
  return `${window.location.origin}/${url}`
}

function formatSize(productName: string, size: string | null) {
  if (!size) return "-"
  const isKids = productName.toLowerCase().includes("niñ")
  if (isKids && KIDS_SIZE_DISPLAY[size]) {
    return KIDS_SIZE_DISPLAY[size]
  }
  return size
}

export function OrdersClient({ orders, patchMap }: Props) {
  const router = useRouter()
  const [activeTab, setActiveTab] = React.useState<"pending" | "history">("pending")
  const [fromDate, setFromDate] = React.useState("")
  const [toDate, setToDate] = React.useState("")
  const [search, setSearch] = React.useState("")
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set())
  const [bulkLoading, setBulkLoading] = React.useState<null | "take" | "decline">(null)

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

  // Pending: Active orders (stock processed AND status = pending)
  const pendingOrders = orders.filter((o) => o.status === "pending" && o.inventory_processed)

  // History: Delivered (green) or Reverted (red). Taken/yellow orders live in Despacho.
  const historyOrders = orders.filter((o) =>
    o.status === "delivered" ||
    !o.inventory_processed
  )

  const filteredPendingOrders = pendingOrders.filter(
    (order) => isDateInRange(order.created_at) && matchesSearch(order)
  )
  const filteredHistoryOrders = historyOrders.filter(
    (order) => isDateInRange(order.created_at) && matchesSearch(order)
  )
  const visibleOrders = activeTab === "pending" ? filteredPendingOrders : filteredHistoryOrders

  const exportOrders = React.useMemo(() => {
    if (selectedIds.size === 0) return visibleOrders
    return visibleOrders.filter((o) => selectedIds.has(o.id))
  }, [visibleOrders, selectedIds])

  const visiblePreorderRows = React.useMemo(
    () =>
      exportOrders.flatMap((order) =>
        order.order_items
          .filter((item) => item.category === "preorder")
          .map((item) => ({ order, item }))
      ),
    [exportOrders]
  )

  const visibleIds = React.useMemo(() => visibleOrders.map((o) => o.id), [visibleOrders])
  const visibleSelectedCount = React.useMemo(
    () => visibleIds.filter((id) => selectedIds.has(id)).length,
    [visibleIds, selectedIds]
  )
  const allVisibleSelected = visibleIds.length > 0 && visibleSelectedCount === visibleIds.length
  const someVisibleSelected = visibleSelectedCount > 0 && !allVisibleSelected

  const toggleSelectAllVisible = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (allVisibleSelected) {
        visibleIds.forEach((id) => next.delete(id))
      } else {
        visibleIds.forEach((id) => next.add(id))
      }
      return next
    })
  }

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const clearSelection = () => setSelectedIds(new Set())

  // Bulk take/decline only act on selected orders that are currently pending.
  const selectedPendingIds = React.useMemo(
    () => filteredPendingOrders.filter((o) => selectedIds.has(o.id)).map((o) => o.id),
    [filteredPendingOrders, selectedIds]
  )

  // If there is a selection, a row action applies to all selected pending orders;
  // otherwise it applies only to the row that was clicked.
  const targetsFor = (orderId: string) =>
    selectedPendingIds.length > 0 ? selectedPendingIds : [orderId]

  const runTake = async (ids: string[]) => {
    setBulkLoading("take")
    try {
      const result = await takeOrders(ids)
      if (!result.success) throw new Error(result.message)
      toast.success(`${result.count} pedido(s) tomado(s)`)
      clearSelection()
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al tomar pedidos")
    } finally {
      setBulkLoading(null)
    }
  }

  const runDecline = async (ids: string[]) => {
    setBulkLoading("decline")
    try {
      const result = await declineOrders(ids)
      if (!result.success) throw new Error(result.message)
      toast.success(`${result.count} pedido(s) declinado(s)`)
      clearSelection()
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al declinar pedidos")
    } finally {
      setBulkLoading(null)
    }
  }

  const renderPendingActions = (order: OrderWithItems) => {
    const targets = targetsFor(order.id)
    const isBulk = selectedPendingIds.length > 0
    const noun = isBulk ? `${targets.length} pedido(s)` : "el pedido"

    return (
      <>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
              title={isBulk ? `Tomar ${targets.length} seleccionados` : "Tomar pedido"}
              disabled={bulkLoading !== null}
            >
              {bulkLoading === "take" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Hand className="h-4 w-4" />
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Tomar {noun}?</AlertDialogTitle>
              <AlertDialogDescription>
                {isBulk
                  ? "Los pedidos seleccionados se moverán a Despacho en amarillo, listos para entregar."
                  : "El pedido se moverá a Despacho en amarillo, listo para entregar."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => runTake(targets)}
                className="bg-yellow-600 hover:bg-yellow-700"
              >
                Confirmar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
              title={isBulk ? `Declinar ${targets.length} seleccionados` : "Declinar pedido"}
              disabled={bulkLoading !== null}
            >
              {bulkLoading === "decline" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RotateCcw className="h-4 w-4" />
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Declinar {noun}?</AlertDialogTitle>
              <AlertDialogDescription>
                Se devolverá el stock de entrega inmediata y {isBulk ? "los pedidos pasarán" : "el pedido pasará"} al historial en rojo.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => runDecline(targets)}
                className="bg-orange-600 hover:bg-orange-700"
              >
                Confirmar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    )
  }

  const handleExportPdf = () => {
    if (visiblePreorderRows.length === 0) {
      return
    }

    const exportedAt = new Date().toLocaleString("es-MX", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })

    const rangeLabel = `${fromDate || "inicio"} - ${toDate || "hoy"}`

    const rowsHtml = visiblePreorderRows
      .map(({ order, item }) => {
        const productImage = item.products?.image_url
          ? `<img src="${escapeHtml(toAbsoluteUrl(item.products.image_url))}" alt="${escapeHtml(item.product_name)}" class="product-image" />`
          : `<div class="placeholder">Sin imagen</div>`

        const patches = (item.patches ?? [])
          .filter((patchName): patchName is string => !!patchName && patchName in patchMap)
          .slice(0, 2)
          .map((patchName) => {
            const patchImage = patchMap[patchName]
            if (patchImage) {
              return `<div class="patch-card"><img src="${escapeHtml(toAbsoluteUrl(patchImage))}" alt="${escapeHtml(patchName)}" class="patch-image" /><div class="patch-label">${escapeHtml(patchName)}</div></div>`
            }
            return `<div class="patch-card patch-fallback"><div class="patch-label">${escapeHtml(patchName)}</div></div>`
          })
          .join("")

        const isPlayerVersion = item.product_name.toLowerCase().includes("player")

        return `
          <tr>
            <td>
              <div class="product-name">${escapeHtml(item.product_name)}</div>
              <div class="product-code">${escapeHtml(item.product_code)}</div>
              <div class="order-meta">Pedido: ${escapeHtml(order.id)} | ${new Date(order.created_at).toLocaleDateString("es-MX")}</div>
            </td>
            <td>${productImage}</td>
            <td><div class="patch-grid">${patches || "<span class='muted'>Sin parche</span>"}</div></td>
            <td><div class="custom-name">${escapeHtml(item.custom_name || "-")}</div></td>
            <td>
              <div class="characteristics">
                <div><span>Size:</span> ${escapeHtml(formatSize(item.product_name, item.size))}</div>
                <div><span>Version:</span> <strong>${isPlayerVersion ? "Player" : "Fan"}</strong></div>
                <div><span>Numero:</span> <strong>${escapeHtml(item.custom_number || "N/A")}</strong></div>
                <div><span>Cantidad:</span> <strong>${item.quantity}</strong></div>
              </div>
            </td>
          </tr>
        `
      })
      .join("")

    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    const html = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Pedido Previo - Exportación</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 24px; color: #111827; }
            .header { margin-bottom: 18px; }
            .header h1 { margin: 0; font-size: 22px; }
            .meta { margin-top: 6px; color: #4b5563; font-size: 12px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th, td { border: 1px solid #d1d5db; padding: 10px; vertical-align: top; }
            th { background: #f3f4f6; text-align: left; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; }
            .product-name { font-size: 16px; font-weight: 800; margin-bottom: 2px; }
            .product-code { font-family: monospace; color: #6b7280; margin-bottom: 4px; }
            .order-meta { color: #6b7280; font-size: 11px; }
            .product-image { width: 170px; height: 170px; object-fit: contain; border: 1px solid #d1d5db; border-radius: 8px; background: #fff; }
            .placeholder { width: 170px; height: 170px; display: flex; align-items: center; justify-content: center; border: 1px dashed #d1d5db; border-radius: 8px; color: #6b7280; }
            .patch-grid { display: flex; flex-wrap: wrap; gap: 8px; }
            .patch-card { width: 100px; border: 1px solid #d1d5db; border-radius: 8px; padding: 6px; text-align: center; background: #fff; }
            .patch-image { width: 80px; height: 80px; object-fit: contain; }
            .patch-label { margin-top: 4px; font-size: 10px; font-weight: 700; }
            .patch-fallback { display: flex; align-items: center; justify-content: center; min-height: 94px; }
            .custom-name { font-size: 20px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; }
            .characteristics { display: grid; gap: 8px; font-size: 15px; }
            .characteristics span { color: #6b7280; margin-right: 6px; font-size: 14px; }
            .characteristics strong { font-size: 18px; font-weight: 800; }
            .muted { color: #6b7280; }
            @media print { body { margin: 12px; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Pedido Previo - Exportación PDF</h1>
            <div class="meta">Rango: ${escapeHtml(rangeLabel)} | Exportado: ${escapeHtml(exportedAt)} | Pedidos exportados: ${exportOrders.length}${selectedIds.size > 0 ? " (seleccionados)" : ""}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Producto</th>
                <th>IMAGE OF T-SHIRT</th>
                <th>Patch</th>
                <th>Name</th>
                <th>Characteristics</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml || `<tr><td colspan="5" class="muted">No hay filas para exportar.</td></tr>`}
            </tbody>
          </table>
        </body>
      </html>
    `

    printWindow.document.open()
    printWindow.document.write(html)
    printWindow.document.close()

    printWindow.onload = () => {
      printWindow.focus()
      printWindow.print()
    }
  }

  const renderTable = (orderList: OrderWithItems[], isHistory = false) => (
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={allVisibleSelected ? true : someVisibleSelected ? "indeterminate" : false}
                  onCheckedChange={toggleSelectAllVisible}
                  disabled={orderList.length === 0}
                  aria-label="Seleccionar todos los visibles"
                />
              </TableHead>
              <TableHead className="whitespace-nowrap">Fecha</TableHead>
              <TableHead className="whitespace-nowrap">Cliente</TableHead>
              <TableHead className="whitespace-nowrap">Email</TableHead>
              <TableHead className="whitespace-nowrap">Telefono</TableHead>
              <TableHead className="text-right whitespace-nowrap">Total</TableHead>
              <TableHead className="text-right whitespace-nowrap">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orderList.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-8 text-center text-muted-foreground"
                >
                  No hay pedidos en esta lista
                </TableCell>
              </TableRow>
            ) : (
              orderList.map((order) => {
                const isTaken = order.status === 'taken'
                const isDelivered = order.status === 'delivered'
                const isReverted = !order.inventory_processed
                
                return (
                  <TableRow
                    key={order.id}
                    data-state={selectedIds.has(order.id) ? "selected" : undefined}
                    className={cn(
                      isTaken && "bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:hover:bg-yellow-900/40",
                      isDelivered && "bg-green-100 hover:bg-green-200 dark:bg-green-900/40 dark:hover:bg-green-900/50",
                      isReverted && "bg-red-100 hover:bg-red-200 dark:bg-red-900/40 dark:hover:bg-red-900/50"
                    )}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(order.id)}
                        onCheckedChange={() => toggleSelectOne(order.id)}
                        aria-label={`Seleccionar pedido ${order.id}`}
                      />
                    </TableCell>
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
                      <div className="flex items-center justify-end gap-2">
                        {!isHistory && renderPendingActions(order)}
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/admin/pedidos/${order.id}`}>Ver</Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )

  return (
    <Tabs
      defaultValue="pending"
      className="space-y-6"
      onValueChange={(value) => setActiveTab(value as "pending" | "history")}
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pedidos</h1>
          <p className="mt-1 text-sm text-muted-foreground">Filtra por fecha y exporta solo Pedido Previo visible.</p>
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
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setFromDate("")
                setToDate("")
                setSearch("")
              }}
            >
              Limpiar filtros
            </Button>
          )}
          {selectedIds.size > 0 && (
            <Button
              type="button"
              variant="ghost"
              onClick={clearSelection}
            >
              Limpiar seleccion ({selectedIds.size})
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={handleExportPdf}
            disabled={visiblePreorderRows.length === 0}
          >
            {selectedIds.size > 0
              ? `Exportar PDF (${selectedIds.size} seleccionados)`
              : "Exportar Pedido Previo PDF"}
          </Button>
        </div>

        <TabsList>
          <TabsTrigger value="pending">Pendientes ({filteredPendingOrders.length})</TabsTrigger>
          <TabsTrigger value="history">Historial ({filteredHistoryOrders.length})</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="pending" className="space-y-4">
        {renderTable(filteredPendingOrders)}
      </TabsContent>

      <TabsContent value="history" className="space-y-4">
        {renderTable(filteredHistoryOrders, true)}
      </TabsContent>
    </Tabs>
  )
}
