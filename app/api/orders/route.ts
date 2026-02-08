import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { customer, items } = body

    if (!customer?.name || !customer?.email || !items?.length) {
      return NextResponse.json(
        { error: "Faltan datos requeridos" },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Calculate total
    const total = items.reduce(
      (sum: number, item: { unitPrice: number; quantity: number }) =>
        sum + item.unitPrice * item.quantity,
      0
    )

    // Create order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        customer_name: customer.name,
        customer_email: customer.email,
        customer_phone: customer.phone || null,
        customer_address: customer.address || null,
        total,
        notes: customer.notes || null,
      })
      .select()
      .single()

    if (orderError) {
      console.error("Order creation error:", orderError)
      return NextResponse.json(
        { error: "Error al crear el pedido" },
        { status: 500 }
      )
    }

    // Create order items
    const orderItems = items.map(
      (item: {
        productId: string
        productCode: string
        productName: string
        quantity: number
        size: string
        customName?: string
        customNumber?: string
        patches?: string[]
        unitPrice: number
        category: string
      }) => ({
        order_id: order.id,
        product_id: item.productId,
        product_code: item.productCode,
        product_name: item.productName,
        quantity: item.quantity,
        size: item.size || null,
        custom_name: item.customName || null,
        custom_number: item.customNumber || null,
        patches: item.patches || null,
        unit_price: item.unitPrice,
        subtotal: item.unitPrice * item.quantity,
        category: item.category,
      })
    )

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems)

    if (itemsError) {
      console.error("Order items error:", itemsError)
      return NextResponse.json(
        { error: "Error al guardar los productos del pedido" },
        { status: 500 }
      )
    }

    // Decrement stock for immediate delivery items
    for (const item of items) {
      if (item.category === "immediate" && item.size) {
        await supabase.rpc("decrement_stock", {
          p_product_id: item.productId,
          p_size: item.size,
          p_quantity: item.quantity,
        })
      }
    }

    return NextResponse.json({ orderId: order.id })
  } catch (error) {
    console.error("Checkout error:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
