import { redirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@clerk/nextjs/server"
import { AdminNavbar } from "@/components/admin-navbar"
import { resolveServerAuthSession } from "@/lib/auth"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth()

  if (!userId) {
    redirect("/sign-in?redirect_url=/admin")
  }

  const authSession = await resolveServerAuthSession()

  if (!authSession.isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xl">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <span className="text-xl font-bold text-red-600">!</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">Acesso negado</h1>
          <p className="mt-2 text-sm text-slate-500">
            Sua conta não tem permissão de administrador.
          </p>
          <Link href="/" className="mt-4 inline-block text-sm font-medium text-red-600 hover:underline">
            Voltar para a loja
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminNavbar />
      <main className="mx-auto max-w-7xl px-4 py-6">
        {children}
      </main>
    </div>
  )
}
