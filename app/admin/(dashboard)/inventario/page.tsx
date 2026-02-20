"use client"

import React, { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Search, Loader2, MinusCircle, RefreshCcw } from "lucide-react"
import { toast } from "sonner"
import { formatCurrency, cn } from "@/lib/utils"
import { Combobox } from "@/components/ui/combobox"

export default function InventoryPage() {
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [products, setProducts] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  
  // Manual adjustment form state
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null)
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [amount, setAmount] = useState("1")

  const supabase = createClient()

  const fetchInventory = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("products")
        .select(`
          id,
          name,
          code,
          price,
          product_sizes (
            id,
            size,
            stock
          )
        `)
        .eq("category", "immediate")
        .order("name")

      if (error) throw error
      setProducts(data || [])
    } catch (err) {
      toast.error("Error al cargar inventario")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInventory()
  }, [])

  const handleManualDecrement = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProduct || !selectedSize || !amount) {
      toast.error("Por favor completa todos los campos")
      return
    }

    const val = parseInt(amount)
    if (isNaN(val) || val <= 0) {
      toast.error("La cantidad debe ser mayor a 0")
      return
    }

    setActionLoading(true)
    try {
      // Use the safe decrement function we created in the migration
      const { data: success, error } = await supabase.rpc("decrement_stock", {
        p_product_id: selectedProduct,
        p_size: selectedSize,
        p_amount: val
      })

      if (error) throw error

      if (success) {
        toast.success("Inventario actualizado correctamente")
        setAmount("1")
        fetchInventory() // Refresh list
      } else {
        toast.error("No hay suficiente stock o el producto no existe")
      }
    } catch (err) {
      toast.error("Error al procesar el descuento")
    } finally {
      setActionLoading(false)
    }
  }

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.code.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const currentProductData = products.find(p => p.id === selectedProduct)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Control de Inventario</h1>
        <Button variant="outline" size="sm" onClick={fetchInventory} disabled={loading}>
          <RefreshCcw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
          Actualizar
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Manual Adjustment Form */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Descuento Manual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleManualDecrement} className="space-y-4">
              <div className="space-y-2">
                <Label>Producto</Label>
                <Combobox 
                  value={selectedProduct || ""}
                  onValueChange={(val) => {
                    setSelectedProduct(val)
                    setSelectedSize(null)
                  }}
                  options={products.map(p => ({
                    label: `${p.code} - ${p.name}`,
                    value: p.id
                  }))}
                  placeholder="Seleccionar producto"
                  searchPlaceholder="Buscar por nombre o código..."
                />
              </div>

              {selectedProduct && (
                <div className="space-y-2">
                  <Label>Talla</Label>
                  <Select value={selectedSize || ""} onValueChange={setSelectedSize}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar talla" />
                    </SelectTrigger>
                    <SelectContent>
                      {currentProductData?.product_sizes.map((s: any) => (
                        <SelectItem key={s.id} value={s.size}>
                          {s.size} (Stock: {s.stock})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="amount">Cantidad a descontar</Label>
                <Input
                  id="amount"
                  type="number"
                  min="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>

              <Button type="submit" className="w-full" disabled={actionLoading || !selectedProduct || !selectedSize}>
                {actionLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <MinusCircle className="mr-2 h-4 w-4" />
                )}
                Descontar de Inventario
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Inventory List */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Stock Entrega Inmediata
              </CardTitle>
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre o código..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead className="text-center w-24">Talla</TableHead>
                    <TableHead className="text-center w-24">Stock</TableHead>
                    <TableHead className="text-right">Precio</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="py-20 text-center">
                        <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  ) : filteredProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="py-20 text-center text-muted-foreground">
                        No se encontraron productos de entrega inmediata
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProducts.map((product) => (
                      product.product_sizes.map((s: any, idx: number) => (
                        <TableRow key={`${product.id}-${s.size}`}>
                          {idx === 0 && (
                            <TableCell rowSpan={product.product_sizes.length} className="font-medium align-top">
                              <div className="flex flex-col">
                                <span>{product.name}</span>
                                <span className="text-[10px] text-muted-foreground font-mono">{product.code}</span>
                              </div>
                            </TableCell>
                          )}
                          <TableCell className="text-center">
                            <Badge variant="outline" className="w-12 justify-center">{s.size}</Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className={cn(
                              "font-bold inline-block w-8",
                              s.stock <= 2 ? "text-destructive" : "text-foreground"
                            )}>
                              {s.stock}
                            </span>
                          </TableCell>
                          {idx === 0 && (
                            <TableCell rowSpan={product.product_sizes.length} className="text-right align-top">
                              {formatCurrency(Number(product.price))}
                            </TableCell>
                          )}
                        </TableRow>
                      ))
                    )).flat()
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
