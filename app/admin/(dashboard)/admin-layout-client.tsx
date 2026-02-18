"use client"

import React, { useState } from "react"
import { AdminSidebar } from "@/components/admin-sidebar"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

export function AdminLayoutClient({
  children,
  userEmail,
}: {
  children: React.ReactNode
  userEmail: string
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="flex min-h-svh bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden w-60 shrink-0 border-r border-border bg-card md:flex">
        <AdminSidebar userEmail={userEmail} />
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="flex h-14 items-center gap-4 border-b border-border bg-card px-4 md:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-60">
              <AdminSidebar userEmail={userEmail} onSelect={() => setOpen(false)} />
            </SheetContent>
          </Sheet>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded bg-primary">
              <span className="text-[10px] font-bold text-primary-foreground">GW</span>
            </div>
            <span className="text-sm font-bold text-foreground">Admin</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8">
          {children}
        </main>
      </div>
    </div>
  )
}
