"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { Sparkles } from "lucide-react"

export function HomeFilters({
  isWorldCup,
  isMujeres,
}: {
  isWorldCup: boolean
  isMujeres: boolean
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const toggle = (key: "worldCup" | "mujeres") => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete("q")
    params.delete("worldCup")
    params.delete("mujeres")
    params.delete("sport")
    params.delete("soccerType")
    const currentlyActive = key === "worldCup" ? isWorldCup : isMujeres
    if (!currentlyActive) {
      if (key === "worldCup") {
        params.set("sport", "futbol")
        params.set("soccerType", "selection")
        params.set("worldCup", "1")
      } else {
        params.set("mujeres", "1")
      }
    }
    const qs = params.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname)
  }

  return (
    <section className="mb-14 px-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <p className="text-center text-[10px] font-bold uppercase tracking-[0.5em] text-muted-foreground mb-5">
        Explorar
      </p>

      <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-2xl mx-auto">

        {/* ── Modo Mundial ── */}
        <button
          type="button"
          onClick={() => toggle("worldCup")}
          className={cn(
            "group relative flex-1 overflow-hidden rounded-2xl border-2 px-6 py-5 text-left transition-all duration-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
            isWorldCup
              ? "border-white/50 shadow-2xl scale-[1.02]"
              : "border-border/50 bg-muted/10 hover:border-foreground/20 hover:shadow-lg hover:scale-[1.02]"
          )}
          style={
            isWorldCup
              ? {
                  background:
                    "linear-gradient(135deg, rgba(0,104,71,0.88) 0%, rgba(255,255,255,0.96) 48%, rgba(206,17,38,0.88) 100%)",
                }
              : undefined
          }
        >
          <div className="flex items-center gap-4">
            <div
              className={cn(
                "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-colors",
                isWorldCup ? "bg-white/50" : "bg-muted"
              )}
            >
              <Image
                src="/world-cup/trophy_1106986.png"
                alt="Copa"
                width={30}
                height={30}
                className="object-contain"
              />
            </div>
            <div className="min-w-0">
              <p
                className={cn(
                  "text-sm font-black uppercase tracking-widest leading-tight",
                  isWorldCup ? "text-[#1f2a44]" : "text-foreground"
                )}
              >
                Modo Mundial
              </p>
              <p
                className={cn(
                  "text-[11px] mt-0.5 leading-tight",
                  isWorldCup ? "text-[#1f2a44]/65" : "text-muted-foreground"
                )}
              >
                Copa del Mundo · Selecciones
              </p>
            </div>
          </div>


          {/* shimmer on hover when inactive */}
          {!isWorldCup && (
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
          )}
        </button>

        {/* ── Colección Femenina ── */}
        <button
          type="button"
          onClick={() => toggle("mujeres")}
          className={cn(
            "group relative flex-1 overflow-hidden rounded-2xl border-2 px-6 py-5 text-left transition-all duration-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
            isMujeres
              ? "shadow-2xl shadow-rose-300/30 scale-[1.02]"
              : "border-border/50 bg-muted/10 hover:border-foreground/20 hover:shadow-lg hover:scale-[1.02]"
          )}
          style={
            isMujeres
              ? {
                  background:
                    "linear-gradient(135deg, rgba(244,63,94,0.13) 0%, rgba(236,72,153,0.10) 50%, rgba(168,85,247,0.13) 100%)",
                  borderColor: "rgba(244,63,94,0.35)",
                }
              : undefined
          }
        >
          <div className="flex items-center gap-4">
            <div
              className={cn(
                "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-colors",
                isMujeres
                  ? "bg-gradient-to-br from-rose-100 to-purple-100"
                  : "bg-muted"
              )}
            >
              <Sparkles
                className={cn(
                  "h-6 w-6 transition-colors",
                  isMujeres ? "text-rose-500" : "text-muted-foreground"
                )}
              />
            </div>
            <div className="min-w-0">
              <p
                className={cn(
                  "text-sm font-black uppercase tracking-widest leading-tight",
                  isMujeres
                    ? "bg-gradient-to-r from-rose-500 to-purple-500 bg-clip-text text-transparent"
                    : "text-foreground"
                )}
              >
                Colección Femenina
              </p>
              <p
                className={cn(
                  "text-[11px] mt-0.5 leading-tight",
                  isMujeres ? "text-rose-400/80" : "text-muted-foreground"
                )}
              >
                Camisetas mujer · Todas las categorías
              </p>
            </div>
          </div>

          {isMujeres && (
            <div className="absolute top-3 right-3 opacity-60">
              <Sparkles className="h-4 w-4 text-rose-400" />
            </div>
          )}

          {!isMujeres && (
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
          )}
        </button>

      </div>
    </section>
  )
}
