import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const faqs = [
  {
    question: "Como posso acompanhar meu pedido?",
    answer: "Após a confirmação do pagamento, você receberá um código de rastreamento por email. Você também pode acompanhar pelo painel 'Meus Pedidos' em sua conta.",
  },
  {
    question: "Qual o prazo de entrega?",
    answer: "O prazo varia de 5 a 15 dias úteis depending on sua localização. Para capitais, o prazo é geralmente de 5 a 7 dias úteis.",
  },
  {
    question: "Como funciona a personalização?",
    answer: "Você pode adicionar seu nome na camisa durante a compra. A personalização tem custo adicional de R$ 20,00 e prazo adicional de 2 dias úteis.",
  },
  {
    question: "Qual a política de trocas?",
    answer: "Aceitamos trocas em até 30 dias após o recebimento, desde que o produto esteja sem uso e com tags. O custo do frete de retorno é por conta do cliente.",
  },
  {
    question: "Os produtos são originais?",
    answer: "Sim, trabalhamos apenas com produtos originais e oficiais dos clubes. Todos os produtos acompanham certificado de autenticidade.",
  },
  {
    question: "Quais formas de pagamento?",
    answer: "Aceitamos PIX, cartão de crédito (em até 12x) e boleto bancário. Para cartões, sujeito à aprovação do crédito.",
  },
]

export default function FaqPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="page-intro mb-10">
        <p className="eyebrow">Dúvidas</p>
        <h1 className="mt-4 text-3xl font-bold">Perguntas Frequentes</h1>
        <p className="mt-3 text-slate-500">Cards mais limpos e leitura mais profissional para suporte e pós-venda.</p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        {faqs.map((faq, idx) => (
          <Card key={idx} className="h-full">
            <CardHeader>
              <CardTitle className="text-lg">{faq.question}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{faq.answer}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
