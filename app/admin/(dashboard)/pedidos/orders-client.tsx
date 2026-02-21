"use client"

import React from "react"
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
import Link from "next/link"
import type { OrderWithItems } from "@/lib/types"
import { formatCurrency } from "@/lib/utils"
import { InventoryButton } from "./inventory-button"
import { TakeOrderButton } from "./take-order-button"
import { DeliverOrderButton } from "./deliver-order-button"

import { cn } from "@/lib/utils"

export function OrdersClient({ orders }: { orders: OrderWithItems[] }) {
  // Pending: Active orders (stock processed AND status = pending)
  const pendingOrders = orders.filter(o => o.status === 'pending' && o.inventory_processed)
  
  // History: Taken, Delivered, or Reverted orders
  const historyOrders = orders.filter(o => 
    o.status === 'taken' || 
    o.status === 'delivered' || 
    !o.inventory_processed
  )

  const renderTable = (orderList: OrderWithItems[], isHistory = false) => (
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
            {orderList.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
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
                    className={cn(
                      isTaken && "bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:hover:bg-yellow-900/40",
                      isDelivered && "bg-green-100 hover:bg-green-200 dark:bg-green-900/40 dark:hover:bg-green-900/50",
                      isReverted && "bg-red-100 hover:bg-red-200 dark:bg-red-900/40 dark:hover:bg-red-900/50"
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
                      <div className="flex items-center justify-end gap-2">
                        {!isHistory && (
                          <>
                            <TakeOrderButton order={order} />
                            <InventoryButton order={order} />
                          </>
                        )}
                        {isHistory && isTaken && (
                          <DeliverOrderButton order={order} />
                        )}
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
    <Tabs defaultValue="pending" className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Pedidos</h1>
        <TabsList>
          <TabsTrigger value="pending">Pendientes ({pendingOrders.length})</TabsTrigger>
          <TabsTrigger value="history">Historial ({historyOrders.length})</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="pending" className="space-y-4">
        {renderTable(pendingOrders)}
      </TabsContent>

      <TabsContent value="history" className="space-y-4">
        {renderTable(historyOrders, true)}
      </TabsContent>
    </Tabs>
  )
}
