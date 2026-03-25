"use client"

import { useEffect, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"

type FallingIcon = {
  id: number
  src: string
  left: number
  duration: number
  delay: number
}

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
]

const CELEBRATION_PRODUCE_MS = 10000
const ICON_SPAWN_MS = 220
const INITIAL_BURST = 10

function getRandomIcon() {
  return WORLD_CUP_ICONS[Math.floor(Math.random() * WORLD_CUP_ICONS.length)]
}

function createFallingIcon(id: number): FallingIcon {
  return {
    id,
    src: getRandomIcon(),
    left: Math.random() * 100,
    duration: 5 + Math.random() * 2.4,
    delay: Math.random() * 0.55,
  }
}

export function WorldCupOverlay() {
  const searchParams = useSearchParams()
  const [isProducingIcons, setIsProducingIcons] = useState(false)
  const [fallingIcons, setFallingIcons] = useState<FallingIcon[]>([])
  const idRef = useRef(0)

  const sport = searchParams.get("sport")
  const soccerType = searchParams.get("soccerType")
  const worldCup = searchParams.get("worldCup")

  const isActive =
    sport === "futbol" &&
    soccerType === "selection" &&
    (worldCup === "1" || worldCup === "true")

  useEffect(() => {
    if (!isActive) {
      setIsProducingIcons(false)
      setFallingIcons([])
      return
    }

    setIsProducingIcons(true)

    setFallingIcons(() => {
      const burst = [] as FallingIcon[]
      for (let i = 0; i < INITIAL_BURST; i += 1) {
        idRef.current += 1
        burst.push(createFallingIcon(idRef.current))
      }
      return burst
    })

    const spawnInterval = window.setInterval(() => {
      idRef.current += 1
      setFallingIcons((prev) => [...prev, createFallingIcon(idRef.current)])
    }, ICON_SPAWN_MS)

    const stopProducingTimer = window.setTimeout(() => {
      setIsProducingIcons(false)
      window.clearInterval(spawnInterval)
    }, CELEBRATION_PRODUCE_MS)

    return () => {
      window.clearInterval(spawnInterval)
      window.clearTimeout(stopProducingTimer)
    }
  }, [isActive])

  const handleIconEnd = (id: number) => {
    setFallingIcons((prev) => prev.filter((icon) => icon.id !== id))
  }

  const showAtmosphere = isProducingIcons || fallingIcons.length > 0

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-0 z-[60] transition-all duration-700",
        isActive && showAtmosphere ? "opacity-100 visible" : "opacity-0 invisible"
      )}
      aria-hidden
    >
      {showAtmosphere && <div className="world-cup-screen-wash" />}

      {fallingIcons.length > 0 && (
        <div className="world-cup-fall-layer">
          {fallingIcons.map((icon) => (
            <img
              key={icon.id}
              src={icon.src}
              alt=""
              className="world-cup-drop"
              style={{
                left: `${icon.left}%`,
                animationDelay: `${icon.delay}s`,
                animationDuration: `${icon.duration}s`,
              }}
              onAnimationEnd={() => handleIconEnd(icon.id)}
            />
          ))}
        </div>
      )}

      {showAtmosphere && <div className="world-cup-glow" />}
    </div>
  )
}
