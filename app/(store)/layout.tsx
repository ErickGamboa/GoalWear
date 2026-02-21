import React from "react"
import { StoreHeader } from "@/components/store-header"
import { StoreFooter } from "@/components/store-footer"
import { CartSheet } from "@/components/cart-sheet"
import { ThemeProvider } from "@/components/theme-provider"

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <div className="flex min-h-svh flex-col">
        <StoreHeader />
        <CartSheet />
        <main className="flex-1">{children}</main>
        <StoreFooter />
      </div>
    </ThemeProvider>
  )
}
