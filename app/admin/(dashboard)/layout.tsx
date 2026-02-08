import React from "react"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AdminSidebar } from "@/components/admin-sidebar"

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
    <div className="flex min-h-svh bg-background">
      <AdminSidebar userEmail={user.email || ""} />
      <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8">
        {children}
      </main>
    </div>
  )
}
