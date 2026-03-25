"use client"

import { useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"

const WORLD_CUP_ICONS = [
  "/world-cup/trophy_1106986.png",
  "/world-cup/trophy_1106986.png",
  "/world-cup/trophy_1106986.png",
  "/world-cup/trophy_1106986.png",
  "/world-cup/trophy_1106986.png",
  "/world-cup/trophy_1106986.png",
  "/world-cup/trophy_1106986.png",
  "/world-cup/trophy_1106986.png",
  "/world-cup/canada.png",
  "/world-cup/estados-unidos-de-america.png",
  "/world-cup/golden-glove_250606.png",
  "/world-cup/mundo.png",
  "/world-cup/trophy_1106986.png",
]

const TOTAL_DROPS = 24

export function WorldCupOverlay() {
  const searchParams = useSearchParams()
  const sport = searchParams.get("sport")
  const soccerType = searchParams.get("soccerType")
  const worldCup = searchParams.get("worldCup")

  const isActive =
    sport === "futbol" &&
    soccerType === "selection" &&
    (worldCup === "1" || worldCup === "true")

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-0 z-[60] transition-all duration-700",
        isActive ? "opacity-100 visible" : "opacity-0 invisible"
      )}
      aria-hidden
    >
      <div className="world-cup-screen-wash" />

      <div className="world-cup-fall-layer">
        {Array.from({ length: TOTAL_DROPS }).map((_, index) => {
          const icon = WORLD_CUP_ICONS[index % WORLD_CUP_ICONS.length]
          return (
            <img
              key={`world-cup-drop-${index}`}
              src={icon}
              alt=""
              className="world-cup-drop"
              style={{
                left: `${(index * 100) / TOTAL_DROPS}%`,
                animationDelay: `${(index % 8) * 0.28}s`,
                animationDuration: `${6 + (index % 5) * 0.9}s`,
              }}
            />
          )
        })}
      </div>

      <div className="world-cup-glow" />
    </div>
  )
}
