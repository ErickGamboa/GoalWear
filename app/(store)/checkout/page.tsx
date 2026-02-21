import type { Metadata } from "next"
import { CheckoutForm } from "./checkout-form"

export const metadata: Metadata = {
  title: "Checkout | GoalWear",
  description: "Finaliza tu pedido - GoalWear",
}

export default function CheckoutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:py-16">
      <h1 className="animate-in fade-in slide-in-from-bottom-4 duration-500 mb-8 text-3xl font-black text-foreground md:text-4xl">
        Finalizar Pedido
      </h1>
      <CheckoutForm />
    </div>
  )
}
