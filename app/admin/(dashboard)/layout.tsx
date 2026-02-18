import React from "react"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AdminLayoutClient } from "./admin-layout-client"

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/admin/login")

  return (
    <AdminLayoutClient userEmail={user.email || ""}>
      {children}
    </AdminLayoutClient>
  )
}
