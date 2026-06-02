"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

type ItemDetailsInput = {
  customName: string | null
  customNumber: string | null
  size: string | null
  quantity: number
}

export async function updateOrderItemDetails(
  orderItemId: string,
  input: ItemDetailsInput
) {
  const supabase = await createClient()

  const quantity = Math.max(1, Math.floor(Number(input.quantity) || 1))

  const { data: item, error: fetchError } = await supabase
    .from("order_items")
    .select("id, order_id, unit_price, quantity, subtotal")
    .eq("id", orderItemId)
    .single()

  if (fetchError || !item) {
    return { error: "No se pudo encontrar el item del pedido" }
  }

  const unitPrice = Number(item.unit_price) || 0
  const newSubtotal = Number((unitPrice * quantity).toFixed(2))
  const prevSubtotal = Number(item.subtotal) || 0
  const subtotalDelta = Number((newSubtotal - prevSubtotal).toFixed(2))

  const { error: updateError, data: updateData } = await supabase
    .from("order_items")
    .update({
      custom_name: input.customName?.trim() || null,
      custom_number: input.customNumber?.trim() || null,
      size: input.size?.trim() || null,
      quantity,
      subtotal: newSubtotal,
    })
    .eq("id", orderItemId)
    .select()

  if (updateError) {
    return { error: `Error de base de datos: ${updateError.message}` }
  }

  if (!updateData || updateData.length === 0) {
    return { error: "No se actualizó ninguna fila. Verifica los permisos." }
  }

  if (subtotalDelta !== 0) {
    const { data: orderRow, error: orderFetchError } = await supabase
      .from("orders")
      .select("total")
      .eq("id", item.order_id)
      .single()

    if (orderFetchError) {
      return { error: `Error de base de datos: ${orderFetchError.message}` }
    }

    const newTotal = Number((Number(orderRow?.total ?? 0) + subtotalDelta).toFixed(2))

    const { error: orderUpdateError } = await supabase
      .from("orders")
      .update({ total: newTotal })
      .eq("id", item.order_id)

    if (orderUpdateError) {
      return { error: `Error de base de datos: ${orderUpdateError.message}` }
    }
  }

  revalidatePath(`/admin/pedidos/${item.order_id}`)
  revalidatePath("/admin/pedidos")
  revalidatePath("/admin")

  return { success: true }
}
