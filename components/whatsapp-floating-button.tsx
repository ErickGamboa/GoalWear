"use client"

import { useEffect, useRef, useState } from "react"
import type { MouseEvent } from "react"

const WHATSAPP_PHONE = "50662411934"
const WHATSAPP_MESSAGE = "Hola, no encontre lo que buscaba y quiero mas informacion."

const WHATSAPP_URL = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`

export function WhatsAppFloatingButton() {
  const [showMobileHint, setShowMobileHint] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const timeoutRef = useRef<number | null>(null)

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 768px)")

    const updateIsMobile = () => {
      setIsMobile(mediaQuery.matches)
      if (!mediaQuery.matches) {
        setShowMobileHint(false)
      }
    }

    updateIsMobile()
    mediaQuery.addEventListener("change", updateIsMobile)

    return () => {
      mediaQuery.removeEventListener("change", updateIsMobile)
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!isMobile) return

    if (!showMobileHint) {
      event.preventDefault()
      setShowMobileHint(true)

      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = window.setTimeout(() => {
        setShowMobileHint(false)
      }, 2500)
    }
  }

  return (
    <div className="group fixed bottom-4 right-4 z-50">
      <a
        href={WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Contactar por WhatsApp"
        onClick={handleClick}
        className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-lg transition-all duration-300 hover:scale-[1.04] hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#25D366] text-white">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-5 w-5"
            aria-hidden="true"
          >
            <path d="M20.52 3.48A11.9 11.9 0 0 0 12.03 0C5.41 0 .03 5.38.03 12c0 2.12.56 4.2 1.62 6.03L0 24l6.18-1.62a11.96 11.96 0 0 0 5.85 1.5h.01c6.62 0 12-5.38 12-12 0-3.2-1.25-6.2-3.52-8.4ZM12.04 21.86h-.01a9.95 9.95 0 0 1-5.08-1.39l-.36-.21-3.67.96.98-3.58-.24-.37A9.92 9.92 0 0 1 2.03 12c0-5.51 4.49-10 10-10 2.67 0 5.17 1.03 7.05 2.9A9.93 9.93 0 0 1 22.03 12c0 5.51-4.48 9.99-9.99 9.99Zm5.48-7.49c-.3-.15-1.77-.87-2.04-.97-.27-.1-.46-.15-.66.15-.2.3-.76.97-.93 1.17-.17.2-.34.22-.64.07-.3-.15-1.25-.46-2.37-1.47-.87-.78-1.46-1.75-1.63-2.05-.17-.3-.02-.46.13-.61.13-.13.3-.34.45-.51.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.66-1.59-.9-2.18-.24-.57-.48-.49-.66-.5h-.56c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.06 2.87 1.21 3.07c.15.2 2.08 3.18 5.04 4.46.7.3 1.24.48 1.67.62.7.22 1.33.19 1.83.12.56-.08 1.77-.72 2.01-1.41.25-.69.25-1.28.17-1.4-.07-.12-.27-.2-.57-.35Z" />
          </svg>
        </span>
      </a>

      <div
        className={`pointer-events-none absolute right-[calc(100%+0.5rem)] top-1/2 w-max -translate-y-1/2 rounded-xl border border-border bg-card px-3 py-2 text-left text-[11px] font-semibold leading-tight text-card-foreground shadow-md transition-all duration-300 sm:text-xs ${
          showMobileHint
            ? "translate-x-0 opacity-100"
            : "translate-x-1 opacity-0 md:group-hover:translate-x-0 md:group-hover:opacity-100 md:group-focus-within:translate-x-0 md:group-focus-within:opacity-100"
        }`}
      >
        <p>¿No lo encontraste?</p>
        <p className="text-center">Escríbenos</p>
      </div>
    </div>
  )
}
