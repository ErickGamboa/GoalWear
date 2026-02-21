"use client"

import { Button } from "@/components/ui/button"
import { CheckCircle } from "lucide-react"
import Link from "next/link"

export default function SuccessPageClient() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-20 text-center">
      <div className="animate-in zoom-in-50 duration-500 flex h-20 w-20 items-center justify-center rounded-full bg-foreground">
        <CheckCircle className="h-10 w-10 text-background" />
      </div>
      <h1 className="mt-8 text-3xl font-black text-foreground">
        Pedido Confirmado
      </h1>
      <p className="mt-4 text-muted-foreground max-w-md">
        Tu pedido ha sido recibido exitosamente. Nos pondremos en contacto contigo pronto para confirmar los detalles de envio.
      </p>
      <p className="mt-2 text-xs text-muted-foreground">
        Si seleccionaste envio a domicilio, el costo de envio ya ha sido incluido en el total de tu pedido.
      </p>
      <Button asChild className="mt-8 rounded-full h-12 px-8 font-bold uppercase tracking-widest transition-all duration-300 hover:scale-105 active:scale-95">
        <Link href="/">
          Volver a la Tienda
        </Link>
      </Button>
    </div>
  )
}
