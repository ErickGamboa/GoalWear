"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

type ItemDetailsInput = {
  customName: string | null
  customNumber: string | null
  size: string | null
  quantity: number
  /** When set, the order item is switched to a different product. */
  productId?: string | null
}

/**
 * Lightweight product list for the item editor's product picker.
 * No images — just name and identifier so the admin can search and swap.
 */
export async function listProductsForPicker() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("products")
    .select("id, code, name, price, category")
    .order("name", { ascending: true })

  if (error) {
    return { error: `Error de base de datos: ${error.message}`, products: [] }
  }

  return { products: data ?? [] }
}

export async function updateOrderItemDetails(
  orderItemId: string,
  input: ItemDetailsInput
) {
  const supabase = await createClient()

  const quantity = Math.max(1, Math.floor(Number(input.quantity) || 1))

  const { data: item, error: fetchError } = await supabase
    .from("order_items")
    .select("id, order_id, product_id, unit_price, quantity, subtotal")
    .eq("id", orderItemId)
    .single()

  if (fetchError || !item) {
    return { error: "No se pudo encontrar el item del pedido" }
  }

  // Optionally switch the product. We denormalize the product's identity
  // (code, name, category, price) onto the order item, matching how orders
  // are created — product_id is only a reference.
  let productUpdate: {
    product_id: string
    product_code: string
    product_name: string
    category: string
  } | null = null
  let unitPrice = Number(item.unit_price) || 0

  if (input.productId && input.productId !== item.product_id) {
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id, code, name, category, price")
      .eq("id", input.productId)
      .single()

    if (productError || !product) {
      return { error: "No se pudo encontrar el producto seleccionado" }
    }

    productUpdate = {
      product_id: product.id,
      product_code: product.code,
      product_name: product.name,
      category: product.category,
    }
    unitPrice = Number(product.price) || 0
  }

  const newSubtotal = Number((unitPrice * quantity).toFixed(2))
  const prevSubtotal = Number(item.subtotal) || 0
  const subtotalDelta = Number((newSubtotal - prevSubtotal).toFixed(2))

  const { error: updateError, data: updateData } = await supabase
    .from("order_items")
    .update({
      ...(productUpdate ?? {}),
      custom_name: input.customName?.trim() || null,
      custom_number: input.customNumber?.trim() || null,
      size: input.size?.trim() || null,
      quantity,
      unit_price: unitPrice,
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
