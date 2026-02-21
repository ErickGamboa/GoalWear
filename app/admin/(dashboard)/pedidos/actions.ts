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

