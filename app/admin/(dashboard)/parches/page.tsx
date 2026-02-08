import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Patch } from "@/lib/types"
import { PatchForm } from "./patch-form"
import { PatchList } from "./patch-list"

export default async function PatchesPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("patches")
    .select("*")
    .order("name")

  const patches = (data ?? []) as Patch[]

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">Parches</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground">Agregar Parche</CardTitle>
          </CardHeader>
          <CardContent>
            <PatchForm />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-foreground">
              Parches Existentes ({patches.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PatchList patches={patches} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
