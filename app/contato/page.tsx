"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/context/toast-context"
import { fetchSiteContactSettings, type SiteContactSettings } from "@/lib/api"
import { Mail, Phone, MapPin, Clock, MessageCircle } from "lucide-react"

export default function ContactPage() {
  const { showToast } = useToast()
  const [settings, setSettings] = useState<SiteContactSettings | null>(null)
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" })

  useEffect(() => {
    fetchSiteContactSettings()
      .then(res => { setSettings(res.data); })
      .catch(() => {})
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    showToast("Mensagem enviada com sucesso! Retornaremos em breve.", "success")
    setForm({ name: "", email: "", subject: "", message: "" })
  }

  const whatsappDigits = settings?.whatsapp?.replace(/\D/g, "") || ""
  const whatsappNumber = whatsappDigits.startsWith("55") ? whatsappDigits : `55${whatsappDigits}`
  const whatsappQuery = settings?.whatsappMessage ? `?text=${encodeURIComponent(settings.whatsappMessage)}` : ""
  const whatsappUrl = whatsappNumber
    ? `https://wa.me/${whatsappNumber}${whatsappQuery}`
    : null

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="page-intro mb-10">
        <p className="eyebrow">Atendimento</p>
        <h1 className="mt-4 text-3xl font-bold">Fale Conosco</h1>
        <p className="mt-3 text-slate-500">Estamos prontos para atender voce.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Envie uma Mensagem</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input id="name" placeholder="Seu nome" value={form.name}
                  onChange={(e) => { setForm({ ...form, name: e.target.value }); }} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="seu@email.com" value={form.email}
                  onChange={(e) => { setForm({ ...form, email: e.target.value }); }} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Assunto</Label>
                <Input id="subject" placeholder="Sobre o que quer falar?" value={form.subject}
                  onChange={(e) => { setForm({ ...form, subject: e.target.value }); }} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Mensagem</Label>
                <Textarea id="message" placeholder="Sua mensagem..." rows={5} value={form.message}
                  onChange={(e) => { setForm({ ...form, message: e.target.value }); }} required />
              </div>
              <Button type="submit" className="w-full">Enviar Mensagem</Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardContent className="p-6 space-y-4">
              {settings?.email && (
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium">Email</p>
                    <p className="text-muted-foreground">{settings.email}</p>
                  </div>
                </div>
              )}
              {settings?.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium">Telefone</p>
                    <p className="text-muted-foreground">{settings.phone}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium">Endereco</p>
                  <p className="text-muted-foreground">Rua Example, 123 - Sao Paulo, SP</p>
                </div>
              </div>
              {settings?.businessHours && (
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium">Horario de Atendimento</p>
                    <p className="text-muted-foreground">{settings.businessHours}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {whatsappUrl && (
            <Card>
              <CardHeader>
                <CardTitle>Fale pelo WhatsApp</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-muted-foreground">
                  Clique no botao abaixo para iniciar uma conversa no WhatsApp com a mensagem ja pre-preenchida.
                </p>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#25D366] px-6 py-3 text-sm font-bold text-white hover:bg-[#20bd5a] transition-colors"
                >
                  <MessageCircle className="h-5 w-5" />
                  Falar no WhatsApp
                </a>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
