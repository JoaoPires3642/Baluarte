"use client"

import { useEffect, useState } from "react"

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const [pulse, setPulse] = useState(false)
  const [dots, setDots] = useState("")

  useEffect(() => {
    const i = setInterval(() => setPulse(v => !v), 1500)
    return () => clearInterval(i)
  }, [])

  useEffect(() => {
    const states = ["", ".", "..", "..."]
    let idx = 0
    const i = setInterval(() => {
      idx = (idx + 1) % states.length
      setDots(states[idx])
    }, 500)
    return () => clearInterval(i)
  }, [])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-white px-4">
      <style>
        {`
          @keyframes glitch {
            0% { transform: translate(0); }
            20% { transform: translate(-2px, 2px); }
            40% { transform: translate(2px, -1px); }
            60% { transform: translate(-1px, -2px); }
            80% { transform: translate(1px, 1px); }
            100% { transform: translate(0); }
          }
          @keyframes breathe {
            0%, 100% { box-shadow: 0 0 20px rgba(239, 68, 68, 0.1); }
            50% { box-shadow: 0 0 40px rgba(239, 68, 68, 0.3); }
          }
          @keyframes fadeSlideUp {
            0% { opacity: 0; transform: translateY(20px); }
            100% { opacity: 1; transform: translateY(0); }
          }
          .anim-glitch { animation: glitch 0.3s ease-in-out infinite; }
          .anim-breathe { animation: breathe 2s ease-in-out infinite; }
          .anim-fade-in { animation: fadeSlideUp 0.6s ease-out both; }
          .anim-delay-1 { animation-delay: 0.15s; }
          .anim-delay-2 { animation-delay: 0.3s; }
          .anim-delay-3 { animation-delay: 0.45s; }
        `}
      </style>

      <div
        className={`anim-breathe flex h-28 w-28 items-center justify-center rounded-full border-2 border-red-200 bg-red-50 text-6xl transition-transform ${pulse ? "scale-110" : "scale-100"}`}
      >
        <span className={`${pulse ? "anim-glitch" : ""}`} style={{ display: "inline-block" }}>
          !
        </span>
      </div>

      <h1 className="anim-fade-in mt-6 text-2xl font-bold text-slate-800 sm:text-3xl">
        Algo deu errado
      </h1>

      <p className="anim-fade-in anim-delay-1 mt-3 max-w-md text-center text-sm text-slate-500 sm:text-base">
        Um erro inesperado aconteceu. Nosso time já foi notificado
        {dots}
      </p>

      <div className="anim-fade-in anim-delay-2 mt-8 flex gap-4">
        <button
          onClick={reset}
          className="rounded-2xl bg-[#0f274d] px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#1a3f7a] hover:shadow-md active:scale-[0.97]"
        >
          Tentar novamente
        </button>
        <a
          href="/"
          className="rounded-2xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-slate-400 hover:shadow-md active:scale-[0.97]"
        >
          Voltar ao início
        </a>
      </div>

      {process.env.NODE_ENV === "development" && (
        <pre className="anim-fade-in anim-delay-3 mt-8 max-w-2xl overflow-auto rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-700">
          {error.message}
        </pre>
      )}
    </div>
  )
}
