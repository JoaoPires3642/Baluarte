import { AdminNavbar } from "@/components/admin-navbar"
import { resolveServerAuthSession } from "@/lib/auth"
import { notFound, redirect } from "next/navigation"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const authSession = await resolveServerAuthSession()

  if (!authSession.isAuthenticated) {
    redirect("/sign-in?redirect_url=/admin")
  }

  if (!authSession.isAdmin) {
    notFound()
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
