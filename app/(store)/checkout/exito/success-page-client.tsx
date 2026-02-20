"use client"

import { Button } from "@/components/ui/button"
import { CheckCircle } from "lucide-react"

export default function SuccessPageClient() {
  const handleReturn = () => {
    // Hard refresh to clear any cached stock data and ensure fresh state
    window.location.href = "/"
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-20 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
        <CheckCircle className="h-8 w-8 text-primary" />
      </div>
      <h1 className="mt-6 text-2xl font-bold text-foreground">
        Pedido Confirmado
      </h1>
      <p className="mt-3 text-muted-foreground">
        Tu pedido ha sido recibido exitosamente. Nos pondremos en contacto
        contigo pronto para confirmar los detalles de envio.
      </p>
      <p className="mt-2 text-xs text-muted-foreground">
        Si seleccionaste envio a domicilio, el costo de envio ya ha sido incluido en el total de tu pedido.
      </p>
      <Button onClick={handleReturn} className="mt-8">
        Volver a la Tienda
      </Button>
    </div>
  )
}
