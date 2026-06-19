import { NextResponse } from "next/server"
import { getBrowserSafeApiBaseUrl } from "@/lib/api-base"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

type ProbeResult = {
  url: string
  ok: boolean
  status?: number
  durationMs: number
  error?: string
  errorCode?: string
  bodyHead?: string
}

async function probe(url: string, timeoutMs = 10000): Promise<ProbeResult> {
  const start = Date.now()
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch(url, {
      cache: "no-store",
      signal: controller.signal,
      headers: { Accept: "application/json" },
    })
    const text = await res.text()
    return {
      url,
      ok: res.ok,
      status: res.status,
      durationMs: Date.now() - start,
      bodyHead: text.slice(0, 300),
    }
  } catch (err) {
    const cause = (err as { cause?: { code?: string; message?: string } }).cause
    return {
      url,
      ok: false,
      durationMs: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
      errorCode: cause?.code,
    }
  } finally {
    clearTimeout(timeoutId)
  }
}

export async function GET() {
  const baseUrl = getBrowserSafeApiBaseUrl()
  const targets = [
    `${baseUrl}/catalog/featured?limit=1`,
    `${baseUrl}/catalog/categories?limit=1`,
  ]

  const results = await Promise.all(targets.map((url) => probe(url)))

  return NextResponse.json(
    {
      timestamp: new Date().toISOString(),
      runtime: "nodejs",
      baseUrl,
      results,
    },
    { status: 200 }
  )
}
