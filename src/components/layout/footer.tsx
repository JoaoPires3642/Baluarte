import Link from "next/link"
import { Camera, MessageCircle, PlayCircle, ShieldCheck } from "lucide-react"
import { Separator } from "@/components/ui/separator"

export function Footer() {
  return (
    <footer className="mt-16 border-t border-[#d9e2ef] bg-[#0f274d] text-white">
      <div className="container mx-auto px-4 py-10 sm:py-12">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="space-y-4 md:col-span-1">
            <div>
              <p className="text-3xl font-extrabold uppercase tracking-[-0.05em]">Baluarte</p>
              <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.24em] text-red-200">Artigos esportivos</p>
            </div>
            <p className="max-w-xs text-sm text-slate-300">
              Loja com curadoria premium, atendimento consultivo e coleções esportivas para quem veste o time com identidade.
            </p>
            <div className="flex items-center gap-3">
              <Link href="https://instagram.com" target="_blank" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 hover:text-white">
                <Camera className="h-4 w-4" />
              </Link>
              <Link href="https://facebook.com" target="_blank" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 hover:text-white">
                <MessageCircle className="h-4 w-4" />
              </Link>
              <Link href="https://youtube.com" target="_blank" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 hover:text-white">
                <PlayCircle className="h-4 w-4" />
              </Link>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-200">
              <ShieldCheck className="h-4 w-4 text-red-200" /> entrega em todo o Brasil
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-extrabold uppercase tracking-[0.18em] text-white">Categorias</h4>
            <ul className="space-y-2 text-sm font-medium text-slate-100">
              <li><Link href="/categorias/nacionais" className="text-slate-100 hover:text-red-100">Times Nacionais</Link></li>
              <li><Link href="/categorias/estrangeiros" className="text-slate-100 hover:text-red-100">Times Estrangeiros</Link></li>
              <li><Link href="/categorias/selecoes" className="text-slate-100 hover:text-red-100">Seleções</Link></li>
              <li><Link href="/categorias/treino" className="text-slate-100 hover:text-red-100">Treino</Link></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-extrabold uppercase tracking-[0.18em] text-white">Atendimento</h4>
            <ul className="space-y-2 text-sm font-medium text-slate-100">
              <li><Link href="/contato" className="text-slate-100 hover:text-red-100">Fale Conosco</Link></li>
              <li><Link href="/perguntas" className="text-slate-100 hover:text-red-100">Perguntas Frequentes</Link></li>
              <li><Link href="/trocas" className="text-slate-100 hover:text-red-100">Política de Trocas</Link></li>
              <li><Link href="/privacidade" className="text-slate-100 hover:text-red-100">Privacidade</Link></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-extrabold uppercase tracking-[0.18em] text-red-300">Contato</h4>
            <ul className="space-y-2 text-sm text-slate-300">
              <li>contato@baluarte.com.br</li>
              <li>(11) 99999-9999</li>
              <li>Seg a Sex, 9h às 18h</li>
            </ul>
          </div>
        </div>

        <Separator className="my-8 bg-white/10" />

        <div className="flex flex-col items-center justify-between gap-4 text-center text-sm text-slate-400 md:flex-row md:text-left">
          <p>© 2026 Baluarte. Todos os direitos reservados.</p>
          <div className="flex flex-wrap items-center justify-center gap-4 md:justify-end">
            <Link href="/termos" className="hover:text-white">Termos</Link>
            <Link href="/privacidade" className="hover:text-white">Privacidade</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
