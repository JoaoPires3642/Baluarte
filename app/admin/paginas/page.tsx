"use client"

import { useEffect, useState } from "react"
import { useAdminApi } from "@/lib/use-admin-api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type SitePage = {
  slug: string
  title: string
  content: string
  updatedAt: string | null
}

export default function AdminPagesPage() {
  const { authedFetch } = useAdminApi()
  const [pages, setPages] = useState<SitePage[]>([])
  const [editing, setEditing] = useState<string | null>(null)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")

  const loadPages = async () => {
    try {
      const data = await authedFetch("/admin/pages") as { data: SitePage[] }
      setPages(data.data)
    } catch {
      setPages([])
    }
  }

  useEffect(() => { loadPages() }, [])

  const startEdit = (page: SitePage) => {
    setEditing(page.slug)
    setTitle(page.title)
    setContent(page.content)
    setMessage("")
  }

  const save = async () => {
    if (!editing) return
    setSaving(true)
    setMessage("")
    try {
      await authedFetch(`/admin/pages/${editing}`, {
        method: "PUT",
        body: JSON.stringify({ title, content }),
      })
      setMessage("Pagina salva com sucesso!")
      await loadPages()
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : "Erro ao salvar")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 py-6">
      <div>
        <h1 className="text-2xl font-bold">Páginas do Site</h1>
      </div>

      {pages.length === 0 && !message && (
        <p className="text-sm text-slate-500">Carregando paginas...</p>
      )}

      {pages.map((page) => (
        <Card key={page.slug}>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">{page.title}</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => startEdit(page)}
            >
              Editar
            </Button>
          </CardHeader>
          {page.updatedAt && (
            <CardContent className="pt-0">
              <p className="text-xs text-slate-400">
                Ultima atualizacao: {new Date(page.updatedAt).toLocaleString("pt-BR")}
              </p>
            </CardContent>
          )}
        </Card>
      ))}

      {editing && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Editando: {pages.find(p => p.slug === editing)?.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Titulo</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Conteudo</label>
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                rows={15}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono"
              />
              <p className="mt-1 text-xs text-slate-400">Suporta HTML basico.</p>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={save} disabled={saving}>
                {saving ? "Salvando..." : "Salvar"}
              </Button>
              <Button variant="outline" onClick={() => { setEditing(null); setMessage(""); }}>
                Cancelar
              </Button>
              {message && (
                <span className={`text-sm ${message.includes("sucesso") ? "text-green-600" : "text-red-500"}`}>
                  {message}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
