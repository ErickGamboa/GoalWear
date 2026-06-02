import React, { Suspense } from "react"
import { StoreHeader } from "@/components/store-header"
import { StoreFooter } from "@/components/store-footer"
import { CartSheet } from "@/components/cart-sheet"
import { ThemeProvider } from "@/components/theme-provider"
import { WorldCupOverlay } from "@/components/world-cup-overlay"

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark">
      <div className="store-hero-bg" aria-hidden="true" />
      <div className="store-hero-overlay" aria-hidden="true" />
      <div className="relative z-10 flex min-h-svh flex-col">
        <Suspense fallback={null}>
          <WorldCupOverlay />
        </Suspense>
        <Suspense fallback={null}>
          <StoreHeader />
        </Suspense>
        <CartSheet />
        <main className="flex-1">{children}</main>
        <StoreFooter />
      </div>
    </ThemeProvider>
  )
}
