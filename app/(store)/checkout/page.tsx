import type { Metadata } from "next"
import { CheckoutForm } from "./checkout-form"

export const metadata: Metadata = {
  title: "Checkout | JerseyStore",
  description: "Finaliza tu pedido - JerseyStore",
}

export default function CheckoutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:py-12">
      <h1 className="mb-8 text-2xl font-bold text-foreground">
        Finalizar Pedido
      </h1>
      <CheckoutForm />
    </div>
  )
}
