import { createClient } from "@/lib/supabase/server"
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
import type { Order } from "@/lib/types"
import { formatCurrency } from "@/lib/utils"

export default async function OrdersPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })

  const orders = (data ?? []) as Order[]

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">Pedidos</h1>

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
                <TableHead className="text-right whitespace-nowrap">Detalles</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-8 text-center text-muted-foreground"
                  >
                    No hay pedidos
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => (
                  <TableRow key={order.id}>
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
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/admin/pedidos/${order.id}`}>Ver</Link>
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
