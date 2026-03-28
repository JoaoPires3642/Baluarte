import Link from "next/link";
import { Instagram, Facebook, Twitter } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-background text-foreground">
      {/* Main Footer */}
      <div className="mx-auto max-w-7xl px-4 py-12 md:py-16">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-primary shadow-sm">
                <span className="text-primary-foreground font-black text-sm">B</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-black tracking-tight uppercase leading-none">Baluarte</span>
                <span className="text-[9px] text-muted-foreground tracking-widest uppercase">Artigos Esportivos</span>
              </div>
            </Link>
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
              A melhor loja de camisas de times do Brasil. Qualidade e originalidade garantidas.
            </p>
            <div className="flex gap-4 mt-6">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>
          
          {/* Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider mb-4 text-primary">Categorias</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/categoria/nacionais" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Times Nacionais
                </Link>
              </li>
              <li>
                <Link href="/categoria/internacionais" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Times Internacionais
                </Link>
              </li>
              <li>
                <Link href="/categoria/selecoes" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Selecoes
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider mb-4 text-primary">Ajuda</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/contato" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Fale Conosco
                </Link>
              </li>
              <li>
                <Link href="/trocas" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Trocas e Devolucoes
                </Link>
              </li>
              <li>
                <Link href="/rastreio" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Rastrear Pedido
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Duvidas Frequentes
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider mb-4 text-primary">Atendimento</h4>
            <ul className="space-y-3">
              <li className="text-sm text-muted-foreground">
                Seg - Sex: 9h as 18h
              </li>
              <li className="text-sm text-muted-foreground">
                contato@baluarte.com.br
              </li>
              <li className="text-sm text-muted-foreground">
                (11) 99999-9999
              </li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* Bottom Bar */}
      <div className="border-t border-border">
        <div className="mx-auto max-w-7xl px-4 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            2024 Baluarte Artigos Esportivos. Todos os direitos reservados.
          </p>
          <div className="flex gap-6">
            <Link href="/privacidade" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Privacidade
            </Link>
            <Link href="/termos" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Termos de Uso
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
