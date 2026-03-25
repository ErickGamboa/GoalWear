"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { SPORT_OPTIONS, SPORT_ID_TO_SLUG } from "@/lib/types"
import type { SoccerType, SportType } from "@/lib/types"

interface CatalogSportFilterProps {
  activeSport?: SportType | null
  activeSoccerType?: SoccerType | null
  category: string
}

const FILTERABLE_CATEGORIES = new Set(["immediate", "preorder"])

export function CatalogSportFilter({ activeSport, activeSoccerType, category }: CatalogSportFilterProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  if (!FILTERABLE_CATEGORIES.has(category)) {
    return null
  }

  const buildUrl = (nextSport: SportType, nextSoccerType?: SoccerType | null) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("sport", SPORT_ID_TO_SLUG[nextSport])

    if (nextSport === "soccer" && nextSoccerType) {
      params.set("soccerType", nextSoccerType)
    } else {
      params.delete("soccerType")
    }

    const query = params.toString()
    return query ? `${pathname}?${query}` : pathname
  }

  const handleSelect = (sport: SportType) => {
    if (activeSport === sport) return
    router.push(buildUrl(sport))
  }

  const handleSoccerTypeSelect = (soccerType: SoccerType | null) => {
    if (activeSport !== "soccer") return
    if (activeSoccerType === soccerType) return
    router.push(buildUrl("soccer", soccerType))
  }

  return (
    <section className="mb-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex items-center justify-between gap-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.4em] text-muted-foreground">
          Deporte
        </p>
      </div>

      <div className="mt-4 flex flex-wrap justify-center gap-3">
        {SPORT_OPTIONS.map((option) => {
          const isActive = activeSport === option.id
          const emoji = null

          const labelContent = option.id === "football"
            ? (
              <span className="flex items-center gap-2">
                <img
                  src="/icons/futbol-americano.png"
                  alt="Fútbol Americano"
                  className="h-6 w-6 object-contain"
                />
                <span>{option.label}</span>
              </span>
            )
            : option.id === "soccer" ? (
              <span className="flex items-center gap-2">
                <img
                  src="/icons/futbol.png"
                  alt="Fútbol"
                  className="h-6 w-6 object-contain"
                />
                <span>{option.label}</span>
              </span>
            )
            : option.id === "basketball" ? (
              <span className="flex items-center gap-2">
                <img
                  src="/icons/baloncesto.png"
                  alt="Basketball"
                  className="h-6 w-6 object-contain"
                />
                <span>{option.label}</span>
              </span>
            )
            : option.id === "formula1" ? (
              <span className="flex items-center gap-2">
                <img
                  src="/icons/formula-uno.png"
                  alt="Formula 1"
                  className="h-6 w-6 object-contain"
                />
                <span>{option.label}</span>
              </span>
            )
            : option.id === "baseball" ? (
              <span className="flex items-center gap-2">
                <img
                  src="/icons/beisbol.png"
                  alt="Baseball"
                  className="h-6 w-6 object-contain"
                />
                <span>{option.label}</span>
              </span>
            )
            : emoji ? (
              <span className="flex items-center gap-2">
                <span
                  aria-hidden
                  className={cn(
                    "text-lg leading-none",
                    isActive ? "opacity-100" : "opacity-80"
                  )}
                >
                  {emoji}
                </span>
                <span>{option.label}</span>
              </span>
            ) : option.label
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={isActive}
              onClick={() => handleSelect(option.id)}
              className={cn(
                "group flex items-center gap-3 rounded-2xl border px-6 py-4 transition-all duration-300",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-foreground/60",
                isActive
                  ? "border-foreground bg-foreground text-background"
                  : "border-border/60 bg-background text-foreground hover:border-foreground/70 hover:bg-muted/40"
              )}
              >
              <div className="text-left">
                <p className="text-xs font-bold uppercase tracking-[0.3em]">
                  {labelContent}
                </p>
              </div>
            </button>
          )
        })}
      </div>

      {activeSport === "soccer" && (
        <div className="mt-4 flex flex-wrap justify-center gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
          <button
            type="button"
            onClick={() => handleSoccerTypeSelect(null)}
            className={cn(
              "rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-200",
              !activeSoccerType
                ? "border-foreground bg-foreground text-background"
                : "border-border/70 bg-background text-foreground hover:border-foreground/70 hover:bg-muted/40"
            )}
          >
            Todos
          </button>

          <button
            type="button"
            onClick={() => handleSoccerTypeSelect("club")}
            className={cn(
              "rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-200",
              activeSoccerType === "club"
                ? "border-foreground bg-foreground text-background"
                : "border-border/70 bg-background text-foreground hover:border-foreground/70 hover:bg-muted/40"
            )}
          >
            Clubes
          </button>

          <button
            type="button"
            onClick={() => handleSoccerTypeSelect("selection")}
            className={cn(
              "rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-200",
              activeSoccerType === "selection"
                ? "border-foreground bg-foreground text-background"
                : "border-border/70 bg-background text-foreground hover:border-foreground/70 hover:bg-muted/40"
            )}
          >
            Selecciones
          </button>
        </div>
      )}
    </section>
  )
}
