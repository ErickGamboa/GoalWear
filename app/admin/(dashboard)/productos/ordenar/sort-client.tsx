"use client"

import { useState, useRef, useCallback } from "react"
import {
  GripVertical, Search, X, CheckCircle2, Loader2, AlertCircle,
  ChevronRight, ChevronDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CATEGORY_LABELS } from "@/lib/types"
import { updateProductSortOrder } from "../actions"
import { cn } from "@/lib/utils"

type SortableProduct = {
  id: string
  name: string
  team: string | null
  code: string
  category: string
  sort_order: number | null
}

type Group = {
  team: string
  products: SortableProduct[]
}

// Ref payload — always synchronous, avoids React state race on dragover
type DragPayload =
  | { type: "group"; team: string }
  | { type: "product"; id: string; team: string }

const SCROLL_THRESHOLD = 80
const SCROLL_MAX_SPEED = 14

function normalizeKey(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
}

function buildGroups(products: SortableProduct[]): Group[] {
  const seenKeys = new Set<string>()
  const groupMap = new Map<string, SortableProduct[]>()
  const keyToDisplay = new Map<string, string>()
  const keyOrder: string[] = []
  for (const p of products) {
    const display = p.team?.trim() || "Sin equipo"
    const key = p.team?.trim() ? normalizeKey(p.team) : "sin equipo"
    if (!seenKeys.has(key)) {
      seenKeys.add(key)
      groupMap.set(key, [])
      keyOrder.push(key)
      keyToDisplay.set(key, display)
    }
    groupMap.get(key)!.push(p)
  }
  return keyOrder.map((key) => ({ team: keyToDisplay.get(key)!, products: groupMap.get(key)! }))
}

export function SortClient({ initialProducts }: { initialProducts: SortableProduct[] }) {
  const [groups, setGroups] = useState<Group[]>(() => buildGroups(initialProducts))
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState("")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // State drives visual highlights only
  const [draggingGroupTeam, setDraggingGroupTeam] = useState<string | null>(null)
  const [dragOverGroupTeam, setDragOverGroupTeam] = useState<string | null>(null)
  const [draggingProductId, setDraggingProductId] = useState<string | null>(null)
  const [dragOverProductId, setDragOverProductId] = useState<string | null>(null)

  // Ref drives drag logic — always in sync, no React render race
  const draggingRef = useRef<DragPayload | null>(null)
  const dragYRef = useRef(0)
  const rafRef = useRef<number | null>(null)

  const stopAutoScroll = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [])

  const startAutoScroll = useCallback(() => {
    stopAutoScroll()
    const tick = () => {
      const y = dragYRef.current
      const vh = window.innerHeight
      let speed = 0
      if (y < SCROLL_THRESHOLD) speed = -SCROLL_MAX_SPEED * (1 - y / SCROLL_THRESHOLD)
      else if (y > vh - SCROLL_THRESHOLD) speed = SCROLL_MAX_SPEED * (1 - (vh - y) / SCROLL_THRESHOLD)
      if (speed !== 0) window.scrollBy(0, speed)
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [stopAutoScroll])

  function resetDragState() {
    draggingRef.current = null
    setDraggingGroupTeam(null)
    setDragOverGroupTeam(null)
    setDraggingProductId(null)
    setDragOverProductId(null)
    stopAutoScroll()
  }

  const q = search.trim().toLowerCase()

  const visibleGroups = q
    ? groups
        .map((g) => {
          const teamMatches = normalizeKey(g.team).includes(normalizeKey(q))
          const matchingProducts = g.products.filter(
            (p) =>
              p.name.toLowerCase().includes(q) ||
              normalizeKey(p.name).includes(normalizeKey(q)) ||
              p.code.toLowerCase().includes(q)
          )
          return { ...g, products: teamMatches ? g.products : matchingProducts }
        })
        .filter((g) => g.products.length > 0)
    : groups

  function isExpanded(team: string) {
    return q ? true : expanded.has(team)
  }

  function toggleExpand(e: React.MouseEvent, team: string) {
    e.stopPropagation()
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(team) ? next.delete(team) : next.add(team)
      return next
    })
  }

  // ── Group drag ──────────────────────────────────────────────────────────

  function handleGroupDragStart(e: React.DragEvent, team: string) {
    draggingRef.current = { type: "group", team }
    setDraggingGroupTeam(team)
    e.dataTransfer.effectAllowed = "move"
    dragYRef.current = e.clientY
    startAutoScroll()
  }

  function handleGroupContainerDragOver(e: React.DragEvent, team: string) {
    if (draggingRef.current?.type !== "group") return
    e.preventDefault()
    dragYRef.current = e.clientY
    if (team !== draggingRef.current.team) setDragOverGroupTeam(team)
  }

  function handleGroupContainerDrop(e: React.DragEvent, targetTeam: string) {
    const d = draggingRef.current
    if (d?.type !== "group" || d.team === targetTeam) { resetDragState(); return }
    setGroups((prev) => {
      const arr = [...prev]
      const fromIdx = arr.findIndex((g) => g.team === d.team)
      const toIdx = arr.findIndex((g) => g.team === targetTeam)
      const [item] = arr.splice(fromIdx, 1)
      arr.splice(toIdx, 0, item)
      return arr
    })
    setSaved(false)
    setError(null)
    resetDragState()
  }

  // ── Product drag ────────────────────────────────────────────────────────

  function handleProductDragStart(e: React.DragEvent, id: string, team: string) {
    e.stopPropagation()
    draggingRef.current = { type: "product", id, team }
    setDraggingProductId(id)
    e.dataTransfer.effectAllowed = "move"
    dragYRef.current = e.clientY
    startAutoScroll()
  }

  function handleProductDragOver(e: React.DragEvent, id: string, team: string) {
    const d = draggingRef.current
    if (d?.type !== "product") return  // let bubble to group container
    e.preventDefault()
    e.stopPropagation()
    dragYRef.current = e.clientY
    if (id !== d.id && team === d.team) setDragOverProductId(id)
  }

  function handleProductDrop(e: React.DragEvent, targetId: string, targetTeam: string) {
    const d = draggingRef.current
    if (d?.type !== "product") return  // let bubble to group container
    e.stopPropagation()
    if (d.id === targetId || d.team !== targetTeam) { resetDragState(); return }
    setGroups((prev) =>
      prev.map((g) => {
        if (g.team !== targetTeam) return g
        const arr = [...g.products]
        const fromIdx = arr.findIndex((p) => p.id === d.id)
        const toIdx = arr.findIndex((p) => p.id === targetId)
        const [item] = arr.splice(fromIdx, 1)
        arr.splice(toIdx, 0, item)
        return { ...g, products: arr }
      })
    )
    setSaved(false)
    setError(null)
    resetDragState()
  }

  // ── Save ────────────────────────────────────────────────────────────────

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      const orderedIds = groups.flatMap((g) => g.products.map((p) => p.id))
      const result = await updateProductSortOrder(orderedIds)
      if (result.success) {
        setSaved(true)
      } else {
        setError(result.message ?? "Error al guardar")
      }
    } catch {
      setError("Error inesperado al guardar")
    } finally {
      setSaving(false)
    }
  }

  const totalProducts = groups.reduce((sum, g) => sum + g.products.length, 0)

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-4 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar equipo, producto o código..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setSaved(false) }}
            className="w-full rounded-lg border border-border bg-background pl-9 pr-9 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button onClick={handleSave} disabled={saving} className="whitespace-nowrap">
          {saving ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Guardando...</>
          ) : saved ? (
            <><CheckCircle2 className="mr-2 h-4 w-4" />Guardado</>
          ) : (
            "Guardar orden"
          )}
        </Button>
      </div>

      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {q && (
        <p className="mb-3 text-xs text-muted-foreground">
          {visibleGroups.length} grupo{visibleGroups.length !== 1 ? "s" : ""} para &quot;{search.trim()}&quot;
          {visibleGroups.length > 0 && " — arrastrá headers para reordenar grupos"}
        </p>
      )}

      {/* Groups */}
      <div className="rounded-lg border border-border overflow-hidden">
        {groups.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">No hay productos cargados</div>
        ) : visibleGroups.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No hay grupos que coincidan con &quot;{search.trim()}&quot;
          </div>
        ) : (
          visibleGroups.map((group) => {
            const exp = isExpanded(group.team)
            const isDraggingThis = draggingGroupTeam === group.team
            const isDragOver = dragOverGroupTeam === group.team && draggingGroupTeam !== group.team

            return (
              <div
                key={group.team}
                onDragOver={(e) => handleGroupContainerDragOver(e, group.team)}
                onDrop={(e) => handleGroupContainerDrop(e, group.team)}
                className={cn(
                  "border-b last:border-b-0 transition-colors",
                  isDragOver && "border-l-4 border-l-primary bg-primary/5"
                )}
              >
                {/* Group header */}
                <div
                  draggable
                  onDragStart={(e) => handleGroupDragStart(e, group.team)}
                  onDragEnd={resetDragState}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3.5 bg-muted/40 hover:bg-muted/60 cursor-grab active:cursor-grabbing select-none transition-colors",
                    isDraggingThis && "opacity-40"
                  )}
                >
                  <GripVertical className="h-5 w-5 text-muted-foreground shrink-0" />
                  <span className="font-semibold text-foreground flex-1 truncate">{group.team}</span>
                  <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                    {group.products.length} producto{group.products.length !== 1 ? "s" : ""}
                  </span>
                  {!q && (
                    <button
                      type="button"
                      onClick={(e) => toggleExpand(e, group.team)}
                      onMouseDown={(e) => e.stopPropagation()}
                      className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors shrink-0"
                      aria-label={exp ? "Colapsar" : "Expandir"}
                    >
                      {exp ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </button>
                  )}
                </div>

                {/* Product rows */}
                {exp && (
                  <div>
                    {group.products.map((product, index) => {
                      const isDraggingProd = draggingProductId === product.id
                      const isDragOverProd = dragOverProductId === product.id && draggingProductId !== product.id

                      return (
                        <div
                          key={product.id}
                          draggable={!q}
                          onDragStart={(e) => handleProductDragStart(e, product.id, group.team)}
                          onDragOver={(e) => handleProductDragOver(e, product.id, group.team)}
                          onDrop={(e) => handleProductDrop(e, product.id, group.team)}
                          onDragEnd={resetDragState}
                          className={cn(
                            "flex items-center gap-3 px-4 py-2.5 pl-12 border-t border-border/40 bg-background select-none transition-colors",
                            !q && "cursor-grab active:cursor-grabbing",
                            isDraggingProd && "opacity-40",
                            isDragOverProd && "border-l-4 border-l-primary bg-primary/5"
                          )}
                        >
                          <GripVertical className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                          <span className="text-xs text-muted-foreground font-mono w-5 shrink-0 text-right">
                            {index + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{product.name}</p>
                            <p className="text-xs text-muted-foreground">{product.code}</p>
                          </div>
                          <Badge variant="secondary" className="text-xs shrink-0">
                            {CATEGORY_LABELS[product.category]}
                          </Badge>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        {groups.length} equipo{groups.length !== 1 ? "s" : ""} · {totalProducts} producto{totalProducts !== 1 ? "s" : ""}
        {q && ` · mostrando ${visibleGroups.length} filtrado${visibleGroups.length !== 1 ? "s" : ""}`}
      </p>
    </div>
  )
}
