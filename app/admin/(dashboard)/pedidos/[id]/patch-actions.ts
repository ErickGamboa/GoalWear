"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function updateOrderItemPatch(
  orderItemId: string,
  patchIndex: number,
  newPatchName: string | null
) {
  const supabase = await createClient()

  // 1. Get current patches
  const { data: item, error: fetchError } = await supabase
    .from("order_items")
    .select("patches, order_id")
    .eq("id", orderItemId)
    .single()

  if (fetchError || !item) {
    return { error: "No se pudo encontrar el item del pedido" }
  }

  let updatedPatches = item.patches || []
  while (updatedPatches.length <= patchIndex) {
    updatedPatches.push(null)
  }

  updatedPatches[patchIndex] = newPatchName

  // 2. Update database
  const { error: updateError, data: updateData } = await supabase
    .from("order_items")
    .update({ patches: updatedPatches })
    .eq("id", orderItemId)
    .select()

  if (updateError) {
    console.error("Update error:", updateError)
    return { error: `Error de base de datos: ${updateError.message}` }
  }

  if (!updateData || updateData.length === 0) {
    return { error: "No se actualizó ninguna fila. Verifica los permisos." }
  }

  revalidatePath(`/admin/pedidos/${item.order_id}`)
  return { success: true }
}
