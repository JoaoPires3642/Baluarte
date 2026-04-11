"use client"

import { usePathname, useSearchParams } from "next/navigation"
import { useEffect, type ReactNode } from "react"

declare global {
  interface Window {
    gtag?: (command: "config", targetId: string, config: { page_path: string }) => void
  }
}

export function Analytics() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    const url = pathname + (searchParams?.toString() ? `?${searchParams}` : "")
    console.log("[Analytics] Page view:", url)
    
    window.gtag?.("config", "GA_MEASUREMENT_ID", {
      page_path: url,
    })
  }, [pathname, searchParams])

  return null
}

export function AnalyticsProvider({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <Analytics />
    </>
  )
}
