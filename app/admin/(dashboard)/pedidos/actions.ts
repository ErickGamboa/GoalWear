"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function completeOrder(orderId: string) {
  const supabase = await createClient()

  try {
    // Attempt update
    const { error, count } = await supabase
      .from("orders")
      .update({ status: "completed" })
      .eq("id", orderId)
      .select('*', { count: 'exact' })

    if (error) {
      console.error("Error completing order:", error)
      return { success: false, message: error.message }
    }

    // Check if any row was actually updated
    if (count === 0) {
      return { 
        success: false, 
        message: "No se pudo actualizar el pedido. Verifique permisos o si el pedido existe." 
      }
    }

    revalidatePath("/admin/pedidos")
    revalidatePath("/admin") // Update dashboard too
    return { success: true }
  } catch (err) {
    return { success: false, message: "Error interno del servidor" }
  }
}
