import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"

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

    // Call the atomic function to create order and decrement stock
    const { data: orderId, error: rpcError } = await supabase.rpc("place_order_atomic", {
      p_customer_name: customer.name,
      p_customer_email: customer.email,
      p_customer_phone: customer.phone || null,
      p_customer_address: customer.address || null,
      p_total: total,
      p_notes: customer.notes || null,
      p_items: items, // items is already an array of objects
    })

    if (rpcError) {
      console.error("Atomic order error:", rpcError)
      return NextResponse.json(
        { error: rpcError.message || "Error al procesar el pedido o stock insuficiente" },
        { status: 400 }
      )
    }

    // Revalidate paths to ensure fresh data in store and catalog
    revalidatePath("/")
    revalidatePath("/catalogo/[category]", "page")
    revalidatePath("/admin")

    return NextResponse.json({ orderId })
  } catch (error) {
    console.error("Checkout error:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
