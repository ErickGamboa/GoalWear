import React from "react"
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'sonner'
import { CartProvider } from '@/lib/cart-context'

import './globals.css'

const _inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'JerseyStore - Camisetas Deportivas',
  description: 'Tu tienda de camisetas deportivas. Entrega inmediata, pedidos personalizados y accesorios.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <body className="font-sans antialiased">
        <CartProvider>
          {children}
          <Toaster position="bottom-right" />
        </CartProvider>
      </body>
    </html>
  )
}
