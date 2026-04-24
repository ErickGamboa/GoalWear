"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function updateProductSortOrder(
  orderedIds: string[]
): Promise<{ success: boolean; message?: string }> {
  const supabase = await createClient()
  const updates = orderedIds.map((id, i) => ({ id, sort_order: i + 1 }))

  // Run updates in parallel batches of 50 to avoid overwhelming the connection
  const BATCH = 50
  for (let i = 0; i < updates.length; i += BATCH) {
    const results = await Promise.all(
      updates.slice(i, i + BATCH).map(({ id, sort_order }) =>
        supabase.from("products").update({ sort_order }).eq("id", id)
      )
    )
    const failed = results.find((r) => r.error)
    if (failed?.error) {
      console.error("Error updating sort order:", failed.error)
      return { success: false, message: "Error al guardar el orden." }
    }
  }

  revalidatePath("/admin/productos")
  revalidatePath("/")
  revalidatePath("/catalogo/entrega-inmediata")
  revalidatePath("/catalogo/pedido-previo")
  revalidatePath("/catalogo/accesorios")
  return { success: true }
}

export async function deleteProduct(
  productId: string
): Promise<{ success: boolean; message?: string }> {
  const supabase = await createClient()

  try {
    // Step 1: get all order_items that reference this product
    const { data: linkedItems, error: itemsError } = await supabase
      .from("order_items")
      .select("order_id")
      .eq("product_id", productId)

    if (itemsError) {
      console.error("Error checking order_items:", itemsError)
      return { success: false, message: "Error al verificar pedidos" }
    }

    // Step 2: if any linked items exist, check if any belong to a pending order
    if (linkedItems && linkedItems.length > 0) {
      const orderIds = linkedItems.map((item) => item.order_id)

      const { data: pendingOrders, error: ordersError } = await supabase
        .from("orders")
        .select("id")
        .in("id", orderIds)
        .eq("status", "pending")
        .eq("inventory_processed", true)
        .limit(1)

      if (ordersError) {
        console.error("Error checking pending orders:", ordersError)
        return { success: false, message: "Error al verificar pedidos pendientes" }
      }

      if (pendingOrders && pendingOrders.length > 0) {
        return {
          success: false,
          message:
            "No se puede eliminar: el producto está incluido en un pedido pendiente.",
        }
      }
    }

    // Safe to delete — ON DELETE SET NULL handles historical order_items
    const { error: deleteError } = await supabase
      .from("products")
      .delete()
      .eq("id", productId)

    if (deleteError) {
      console.error("Error deleting product:", deleteError)
      return { success: false, message: "Error al eliminar el producto" }
    }

    revalidatePath("/admin/productos")
    return { success: true }
  } catch (err) {
    console.error("Unexpected error in deleteProduct:", err)
    return { success: false, message: "Error interno del servidor" }
  }
}
