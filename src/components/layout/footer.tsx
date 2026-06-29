import Link from "next/link"
import type { ReactNode } from "react"
import { ShieldCheck } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { fetchSiteContactSettings, type SiteContactSettings } from "@/lib/api"

const fallbackSettings: SiteContactSettings = {
  footerMessage: "Loja com curadoria premium, atendimento consultivo e coleções esportivas para quem veste o time com identidade.",
  email: "contato@baluarte.com.br",
  phone: "(11) 99999-9999",
  whatsapp: "(11) 99999-9999",
  businessHours: "Seg a Sex, 9h às 18h",
  instagramUrl: "https://instagram.com",
  youtubeUrl: "https://youtube.com",
  whatsappMessage: "Ola! Gostaria de mais informacoes sobre os produtos da Baluarte.",
}

export async function Footer() {
  const settings = await loadContactSettings()
  const whatsappHref = buildWhatsappHref(settings.whatsapp, settings.whatsappMessage)
  const hasSocialLinks = !!(settings.instagramUrl || whatsappHref || settings.youtubeUrl)
  const hasContactInfo = !!(settings.email || settings.phone || settings.whatsapp || settings.businessHours)

  return (
    <footer className="mt-16 border-t border-[#d9e2ef] bg-[#0f274d] text-white">
      <div className="container mx-auto px-4 py-10 sm:py-12">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="space-y-4 md:col-span-1">
            <div>
              <p className="text-3xl font-extrabold uppercase tracking-[-0.05em]">Baluarte</p>
              <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.24em] text-red-200">Artigos esportivos</p>
            </div>
            {settings.footerMessage && <p className="max-w-xs text-sm text-slate-300">{settings.footerMessage}</p>}
            {hasSocialLinks && (
              <div className="flex items-center gap-3">
                {settings.instagramUrl && <SocialLink href={settings.instagramUrl} label="Instagram" icon={<InstagramIcon />} />}
                {whatsappHref && <SocialLink href={whatsappHref} label="WhatsApp" icon={<WhatsAppIcon />} />}
                {settings.youtubeUrl && <SocialLink href={settings.youtubeUrl} label="YouTube" icon={<YouTubeIcon />} />}
              </div>
            )}
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

          {hasContactInfo && (
            <div className="space-y-4">
              <h4 className="text-sm font-extrabold uppercase tracking-[0.18em] text-red-300">Contato</h4>
              <ul className="space-y-2 text-sm text-slate-300">
                {settings.email && <li>{settings.email}</li>}
                {settings.phone && <li>{settings.phone}</li>}
                {settings.whatsapp && <li>WhatsApp: {settings.whatsapp}</li>}
                {settings.businessHours && <li>{settings.businessHours}</li>}
              </ul>
            </div>
          )}
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

async function loadContactSettings() {
  try {
    const response = await fetchSiteContactSettings()
    return response.data
  } catch {
    return fallbackSettings
  }
}

function SocialLink({ href, label, icon }: { href: string; label: string; icon: ReactNode }) {
  return (
    <Link
      href={href}
      target="_blank"
      aria-label={label}
      className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 hover:text-white"
    >
      {icon}
    </Link>
  )
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  )
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
      <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1" />
    </svg>
  )
}

function YouTubeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.94 2C5.12 20 12 20 12 20s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" />
      <polygon points="9.75 8.5 9.75 15.5 16 12 9.75 8.5" fill="currentColor" stroke="none" />
    </svg>
  )
}

function buildWhatsappHref(value?: string | null, message?: string | null) {
  if (!value) return null
  if (value.startsWith("http://") || value.startsWith("https://")) return value
  const digits = value.replace(/\D/g, "")
  if (!digits) return null
  const countryCode = digits.startsWith("55") ? digits : `55${digits}`
  const base = `https://wa.me/${countryCode}`
  if (message) return `${base}?text=${encodeURIComponent(message)}`
  return base
}
