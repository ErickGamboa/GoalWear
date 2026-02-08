import React from "react"
import { StoreHeader } from "@/components/store-header"
import { StoreFooter } from "@/components/store-footer"
import { CartSheet } from "@/components/cart-sheet"

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-svh flex-col">
      <StoreHeader />
      <CartSheet />
      <main className="flex-1">{children}</main>
      <StoreFooter />
    </div>
  )
}
