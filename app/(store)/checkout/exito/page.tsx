import SuccessPageClient from "./success-page-client"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Pedido Confirmado | GoalWear",
}

export default function SuccessPage() {
  return <SuccessPageClient />
}
