import { Button } from "@/components/ui/button"
import { CheckCircle } from "lucide-react"
import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Pedido Confirmado | GoalWear",
}

export default function SuccessPage() {
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
      <Button asChild className="mt-8">
        <Link href="/">Volver a la Tienda</Link>
      </Button>
    </div>
  )
}
