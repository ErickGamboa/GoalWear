import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, ShoppingBag, Coins, Layers } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  const [productsRes, ordersRes, patchesRes] = await Promise.all([
    supabase.from("products").select("id", { count: "exact", head: true }),
    supabase.from("orders").select("id, total, status"),
    supabase.from("patches").select("id", { count: "exact", head: true }),
  ])

  const productCount = productsRes.count ?? 0
  const orders = ordersRes.data ?? []
  const orderCount = orders.length
  const totalRevenue = orders
    .filter(order => order.status === 'delivered')
    .reduce(
      (sum, order) => sum + Number(order.total),
      0
    )
  const patchCount = patchesRes.count ?? 0

  const stats = [
    {
      label: "Productos",
      value: productCount.toString(),
      icon: Package,
    },
    {
      label: "Pedidos",
      value: orderCount.toString(),
      icon: ShoppingBag,
    },
    {
      label: "Ingresos",
      value: formatCurrency(totalRevenue),
      icon: Coins,
    },
    {
      label: "Parches",
      value: patchCount.toString(),
      icon: Layers,
    },
  ]

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-foreground">
                  {stat.value}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
