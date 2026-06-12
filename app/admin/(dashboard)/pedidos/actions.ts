"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function takeOrder(orderId: string) {
  const supabase = await createClient()

  try {
    const { error, count } = await supabase
      .from("orders")
      .update({ status: "taken" })
      .eq("id", orderId)
      .select('*', { count: 'exact' })

    if (error) {
      console.error("Error taking order:", error)
      return { success: false, message: error.message }
    }

    if (count === 0) {
      return { 
        success: false, 
        message: "No se pudo actualizar el pedido. Verifique permisos o si el pedido existe." 
      }
    }

    revalidatePath("/admin/pedidos")
    revalidatePath("/admin/despacho")
    revalidatePath("/admin")
    return { success: true }
  } catch (err) {
    return { success: false, message: "Error interno del servidor" }
  }
}

export async function deliverOrder(orderId: string) {
  const supabase = await createClient()

  try {
    const { error, count } = await supabase
      .from("orders")
      .update({ status: "delivered" })
      .eq("id", orderId)
      .select('*', { count: 'exact' })

    if (error) {
      console.error("Error delivering order:", error)
      return { success: false, message: error.message }
    }

    if (count === 0) {
      return { 
        success: false, 
        message: "No se pudo actualizar el pedido. Verifique permisos o si el pedido existe." 
      }
    }

    revalidatePath("/admin/pedidos")
    revalidatePath("/admin/despacho")
    revalidatePath("/admin")
    return { success: true }
  } catch (err) {
    return { success: false, message: "Error interno del servidor" }
  }
}

// Keep for backwards compatibility, now calls takeOrder
export async function completeOrder(orderId: string) {
  return takeOrder(orderId)
}

// Bulk: take all given pending orders (status -> taken).
export async function takeOrders(orderIds: string[]) {
  if (!orderIds.length) return { success: false, message: "No hay pedidos seleccionados" }

  const supabase = await createClient()

  try {
    const { error, count } = await supabase
      .from("orders")
      .update({ status: "taken" })
      .in("id", orderIds)
      .eq("status", "pending")
      .select("*", { count: "exact" })

    if (error) {
      console.error("Error taking orders:", error)
      return { success: false, message: error.message }
    }

    revalidatePath("/admin/pedidos")
    revalidatePath("/admin/despacho")
    revalidatePath("/admin")
    return { success: true, count: count ?? 0 }
  } catch (err) {
    return { success: false, message: "Error interno del servidor" }
  }
}

// Bulk: decline all given orders (revert stock + mark as reverted/red).
export async function declineOrders(orderIds: string[]) {
  if (!orderIds.length) return { success: false, message: "No hay pedidos seleccionados" }

  const supabase = await createClient()

  let declined = 0
  const errors: string[] = []

  for (const orderId of orderIds) {
    const { data: success, error } = await supabase.rpc("revert_order_stock_atomic", {
      p_order_id: orderId,
    })
    if (error) {
      errors.push(error.message)
    } else if (success) {
      declined++
    }
  }

  revalidatePath("/admin/pedidos")
  revalidatePath("/admin/despacho")
  revalidatePath("/admin")

  if (errors.length && declined === 0) {
    return { success: false, message: errors[0] }
  }

  return { success: true, count: declined }
}

