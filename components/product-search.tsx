"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"

export function ProductSearch() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  const [query, setQuery] = useState(searchParams.get("q") || "")

  useEffect(() => {
    setQuery(searchParams.get("q") || "")
  }, [searchParams])

  const handleSearch = (value: string) => {
    setQuery(value)
    
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set("q", value)
    } else {
      params.delete("q")
    }
    
    router.push(`${pathname}?${params.toString()}`)
  }

  const clearSearch = () => {
    setQuery("")
    const params = new URLSearchParams(searchParams.toString())
    params.delete("q")
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="relative flex-1 md:max-w-[300px]">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors" />
      <Input
        type="text"
        placeholder="Buscar..."
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        className="h-10 w-full rounded-full border-border/50 bg-muted/30 pl-10 pr-10 text-sm transition-all duration-300 focus:border-foreground focus:bg-background"
      />
      {query && (
        <button
          onClick={clearSearch}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 hover:bg-muted transition-all duration-200 hover:scale-110 active:scale-90"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      )}
    </div>
  )
}
