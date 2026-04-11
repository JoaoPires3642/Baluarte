"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useDebounce } from "@/hooks/use-debounce"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

type SearchBoxProps = {
  className?: string
  inputClassName?: string
}

export function SearchBox({ className, inputClassName }: SearchBoxProps) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  useDebounce(query, 300)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.length >= 2) {
      router.push(`/busca?q=${encodeURIComponent(query)}`)
    }
  }

  return (
    <form onSubmit={handleSearch} className={className || "relative w-full md:max-w-md"}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <Input
        placeholder="Buscar camisas, coleções e times"
        className={inputClassName || "h-11 w-full rounded-full border-[#d9e2ef] bg-white pl-9 pr-4 shadow-sm"}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
    </form>
  )
}
