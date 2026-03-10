"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { SPORT_OPTIONS, SPORT_ID_TO_SLUG } from "@/lib/types"
import type { SportType } from "@/lib/types"

interface CatalogSportFilterProps {
  activeSport?: SportType | null
  category: string
}

const FILTERABLE_CATEGORIES = new Set(["immediate", "preorder"])

export function CatalogSportFilter({ activeSport, category }: CatalogSportFilterProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  if (!FILTERABLE_CATEGORIES.has(category)) {
    return null
  }

  const buildUrl = (nextSport: SportType) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("sport", SPORT_ID_TO_SLUG[nextSport])
    const query = params.toString()
    return query ? `${pathname}?${query}` : pathname
  }

  const handleSelect = (sport: SportType) => {
    if (activeSport === sport) return
    router.push(buildUrl(sport))
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
          const emoji = option.id === "soccer"
            ? "⚽"
            : option.id === "basketball"
              ? "🏀"
              : option.id === "football"
                ? "🏈"
                : option.id === "formula1"
                  ? "🏎️"
                  : option.id === "baseball"
                    ? "⚾"
                    : null
          const labelContent = emoji ? (
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
    </section>
  )
}
