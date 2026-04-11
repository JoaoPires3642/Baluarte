import Link from "next/link"
import { redirect } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
import { Button } from "@/components/ui/button"
import { resolveServerAuthSession } from "@/lib/auth"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth()

  if (!userId) {
    redirect("/sign-in?redirect_url=/admin")
  }

  const authSession = await resolveServerAuthSession()

  if (!authSession.isAdmin) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-2xl rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-xl shadow-slate-900/5">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.24em] text-[#dc2626]">Area restrita</p>
          <h1 className="mt-3 font-[family-name:var(--font-heading)] text-4xl font-extrabold uppercase tracking-[-0.04em] text-slate-900">
            Acesso admin negado
          </h1>
          <p className="mt-4 text-slate-600">
            Sua conta Clerk autenticou no frontend, mas o backend nao retornou perfil administrador para este usuario.
          </p>
          <div className="mt-6 flex justify-center">
            <Button asChild className="rounded-full bg-[#dc2626] px-6">
              <Link href="/">Voltar para a loja</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] bg-transparent">
      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="mb-6 rounded-[2rem] border border-[#d9e2ef] bg-white/90 p-4 shadow-sm shadow-slate-900/5 backdrop-blur sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="eyebrow">Baluarte admin</p>
              <p className="mt-3 text-sm text-slate-500">Gestão visual alinhada com a nova identidade da loja.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href="/admin">Dashboard</Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/admin/produtos">Produtos</Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/admin/pedidos">Pedidos</Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/admin/categorias">Categorias</Link>
              </Button>
            </div>
          </div>
        </div>
        {children}
      </div>
    </div>
  )
}
