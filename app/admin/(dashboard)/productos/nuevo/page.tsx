import { ProductForm } from "@/components/product-form"

export default function NewProductPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">
        Nuevo Producto
      </h1>
      <ProductForm mode="create" />
    </div>
  )
}
