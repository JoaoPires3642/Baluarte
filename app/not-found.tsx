import Link from "next/link"

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-white px-4">
      <style>
        {`
          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(-2deg); }
            50% { transform: translateY(-16px) rotate(2deg); }
          }
          @keyframes shimmer {
            0% { background-position: -200% center; }
            100% { background-position: 200% center; }
          }
          @keyframes fadeSlideUp {
            0% { opacity: 0; transform: translateY(20px); }
            100% { opacity: 1; transform: translateY(0); }
          }
          .anim-float { animation: float 3s ease-in-out infinite; }
          .anim-shimmer {
            background: linear-gradient(90deg, #0f274d 0%, #1a3f7a 25%, #0f274d 50%, #1a3f7a 75%, #0f274d 100%);
            background-size: 200% auto;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            animation: shimmer 4s linear infinite;
          }
          .anim-fade-in { animation: fadeSlideUp 0.6s ease-out both; }
          .anim-delay-1 { animation-delay: 0.15s; }
          .anim-delay-2 { animation-delay: 0.3s; }
          .anim-delay-3 { animation-delay: 0.45s; }
        `}
      </style>

      <div className="anim-float text-8xl font-black leading-none sm:text-9xl">
        <span className="anim-shimmer">404</span>
      </div>

      <h1 className="anim-fade-in mt-6 text-2xl font-bold text-slate-800 sm:text-3xl">
        Página não encontrada
      </h1>

      <p className="anim-fade-in anim-delay-1 mt-3 max-w-md text-center text-sm text-slate-500 sm:text-base">
        O caminho que você seguiu não leva a lugar nenhum.
        Que tal voltar e tentar de novo?
      </p>

      <div className="anim-fade-in anim-delay-2 mt-8 flex gap-4">
        <Link
          href="/"
          className="rounded-2xl bg-[#0f274d] px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#1a3f7a] hover:shadow-md active:scale-[0.97]"
        >
          Voltar ao início
        </Link>
        <Link
          href="/categorias"
          className="rounded-2xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-slate-400 hover:shadow-md active:scale-[0.97]"
        >
          Ver categorias
        </Link>
      </div>

      <div className="anim-fade-in anim-delay-3 mt-16 flex gap-6">
        <Dot />
        <Dot />
        <Dot />
      </div>
    </div>
  )
}

function Dot() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" className="text-slate-300">
      <circle cx="6" cy="6" r="4" fill="currentColor">
        <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite" />
      </circle>
    </svg>
  )
}
