"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { SPORT_OPTIONS, SPORT_ID_TO_SLUG } from "@/lib/types"
import type { SoccerType, SportType } from "@/lib/types"

interface CatalogSportFilterProps {
  activeSport?: SportType | null
  activeSoccerType?: SoccerType | null
  activeWorldCupMode?: boolean
  category: string
  availableSizes?: string[]
  selectedSizes?: string[]
  selectedKidsSizes?: string[]
}

const FILTERABLE_CATEGORIES = new Set(["immediate", "preorder"])

export function CatalogSportFilter({
  activeSport,
  activeSoccerType,
  activeWorldCupMode,
  category,
  availableSizes = [],
  selectedSizes = [],
  selectedKidsSizes = [],
}: CatalogSportFilterProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  if (!FILTERABLE_CATEGORIES.has(category)) {
    return null
  }

  const buildUrl = (
    nextSport: SportType,
    nextSoccerType?: SoccerType | null,
    nextWorldCupMode?: boolean
  ) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("sport", SPORT_ID_TO_SLUG[nextSport])
    params.delete("sizes")
    params.delete("page")

    if (nextSport === "soccer" && nextSoccerType) {
      params.set("soccerType", nextSoccerType)
    } else {
      params.delete("soccerType")
    }

    if (nextSport === "soccer" && nextSoccerType === "selection" && nextWorldCupMode) {
      params.set("worldCup", "1")
    } else {
      params.delete("worldCup")
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
    const nextWorldCupMode = soccerType === "selection" ? Boolean(activeWorldCupMode) : false
    router.push(buildUrl("soccer", soccerType, nextWorldCupMode))
  }

  const handleWorldCupToggle = (checked: boolean) => {
    if (activeSport !== "soccer" || activeSoccerType !== "selection") return
    router.push(buildUrl("soccer", "selection", checked))
  }

  const handleSizeToggle = (size: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete("page")
    const next = selectedSizes.includes(size)
      ? selectedSizes.filter((s) => s !== size)
      : [...selectedSizes, size]
    if (next.length > 0) {
      params.set("sizes", next.join(","))
    } else {
      params.delete("sizes")
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  const handleKidsSizeToggle = (size: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete("page")
    const next = selectedKidsSizes.includes(size)
      ? selectedKidsSizes.filter((s) => s !== size)
      : [...selectedKidsSizes, size]
    if (next.length > 0) {
      params.set("kSizes", next.join(","))
    } else {
      params.delete("kSizes")
    }
    router.push(`${pathname}?${params.toString()}`)
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

          {activeSoccerType === "selection" && (
            <div
              className={cn(
                "ml-1 inline-flex items-center gap-3 rounded-full border px-4 py-2",
                "transition-all duration-300",
                activeWorldCupMode
                  ? "border-white/80 bg-[linear-gradient(90deg,rgba(0,104,71,0.18)_0%,rgba(255,255,255,0.92)_36%,rgba(206,17,38,0.16)_68%,rgba(60,59,110,0.18)_100%)] shadow-lg shadow-[#3C3B6E]/20"
                  : "border-border/70 bg-background"
              )}
            >
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#1f2a44]">
                Modo Mundial
              </span>
              <Switch
                checked={Boolean(activeWorldCupMode)}
                onCheckedChange={handleWorldCupToggle}
                aria-label="Activar modo mundial"
                className={cn(
                  activeWorldCupMode &&
                    "data-[state=checked]:bg-[#3C3B6E] data-[state=unchecked]:bg-input"
                )}
              />
            </div>
          )}
        </div>
      )}

      {category === "immediate" && availableSizes.length > 0 && (
        <div className="mt-6 animate-in fade-in slide-in-from-top-2 duration-300">
          {(() => {
            const KIDS_SIZE_DISPLAY: Record<string, string> = {
              XXS: "16 = 2-3 años",
              XS: "18 = 4-5 años",
              S: "20 = 6-7 años",
              M: "22 = 7-8 años",
              L: "24 = 8-9 años",
              XL: "26 = 9-10 años",
              XXL: "28 = 11-12 años",
            }
            const KIDS_SIZES = new Set(["XXS", "XS", "S", "M", "L", "XL", "XXL"])
            const ADULT_SIZES = new Set(["S", "M", "L", "XL", "2XL", "3XL", "4XL"])
            const kidsSizes = availableSizes.filter((s) => KIDS_SIZES.has(s))
            const adultSizes = availableSizes.filter((s) => ADULT_SIZES.has(s))
            return (
              <div className="flex items-start justify-between gap-6">
                {kidsSizes.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                      <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground/70">
                        Tallas niños:
                      </p>
                      {selectedKidsSizes.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            const params = new URLSearchParams(searchParams.toString())
                            params.delete("kSizes")
                            params.delete("page")
                            router.push(`${pathname}?${params.toString()}`)
                          }}
                          className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
                        >
                          Limpiar
                        </button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {kidsSizes.map((size) => {
                        const isActive = selectedKidsSizes.includes(size)
                        return (
                          <button
                            key={size}
                            type="button"
                            onClick={() => handleKidsSizeToggle(size)}
                            aria-pressed={isActive}
                            className={cn(
                              "h-10 rounded-xl border-2 px-3 text-xs font-bold transition-all duration-200",
                              isActive
                                ? "border-foreground bg-foreground text-background shadow-md scale-105"
                                : "border-border/60 bg-background text-foreground hover:border-foreground/60 hover:scale-105"
                            )}
                          >
                            {KIDS_SIZE_DISPLAY[size]}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
                {adultSizes.length > 0 && (
                  <div className="flex flex-col gap-2 ml-auto items-end">
                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground/70">
                      Tallas adultos:
                    </p>
                    <div className="flex flex-wrap gap-2 justify-end">
                      {adultSizes.map((size) => {
                        const isActive = selectedSizes.includes(size)
                        return (
                          <button
                            key={`adult-${size}`}
                            type="button"
                            onClick={() => handleSizeToggle(size)}
                            aria-pressed={isActive}
                            className={cn(
                              "h-10 min-w-[44px] rounded-xl border-2 px-3 text-xs font-bold uppercase tracking-wide transition-all duration-200",
                              isActive
                                ? "border-foreground bg-foreground text-background shadow-md scale-105"
                                : "border-border/60 bg-background text-foreground hover:border-foreground/60 hover:scale-105"
                            )}
                          >
                            {size}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          })()}
        </div>
      )}
    </section>
  )
}
