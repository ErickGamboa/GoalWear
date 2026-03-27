import React from "react"
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'sonner'
import { CartProvider } from '@/lib/cart-context'
import { WhatsAppFloatingButton } from '@/components/whatsapp-floating-button'

import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'GOΛLWEΛRCR',
  description: 'Tu tienda de camisetas deportivas. Entrega inmediata, pedidos personalizados y accesorios.',
  icons: {
    icon: '/favicon.svg',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <body className={`${inter.className} antialiased`}>
        <CartProvider>
          {children}
          <WhatsAppFloatingButton />
          <Toaster position="bottom-right" />
        </CartProvider>
      </body>
    </html>
  )
}
