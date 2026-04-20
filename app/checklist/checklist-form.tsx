'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { submitChecklistAction } from '@/lib/actions'
import { CheckCircle2, AlertTriangle, Send, Loader2 } from 'lucide-react'

type Conta = { id: string; nome: string }
type Status = 'operavel' | 'restringida'

type ItemState = {
  status: Status
  observacao: string
}

export default function ChecklistForm({ contas }: { contas: Conta[] }) {
  const [items, setItems] = useState<Record<string, ItemState>>(
    Object.fromEntries(contas.map((c) => [c.id, { status: 'operavel', observacao: '' }]))
  )
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  function setStatus(contaId: string, status: Status) {
    setItems((prev) => ({
      ...prev,
      [contaId]: { ...prev[contaId], status },
    }))
  }

  function setObservacao(contaId: string, observacao: string) {
    setItems((prev) => ({
      ...prev,
      [contaId]: { ...prev[contaId], observacao },
    }))
  }

  async function handleSubmit() {
    setSubmitting(true)

    const payload = contas.map((c) => ({
      conta_id: c.id,
      conta_nome: c.nome,
      status: items[c.id].status,
      observacao: items[c.id].observacao || undefined,
    }))

    const result = await submitChecklistAction(payload)

    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success('✅ Checklist enviado! Notificação WhatsApp disparada.')
      setSubmitted(true)
    }
    setSubmitting(false)
  }

  const restringidas = contas.filter((c) => items[c.id]?.status === 'restringida')
  const operaveis = contas.filter((c) => items[c.id]?.status === 'operavel')

  // Estado: enviado com sucesso — permite novo envio
  if (submitted) {
    return (
      <div className="mt-8 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
          <CheckCircle2 size={40} className="text-green-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Checklist enviado!</h2>
        <p className="text-gray-500 mb-4">Relatório enviado com sucesso.</p>
        <button
          onClick={() => setSubmitted(false)}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors"
        >
          Novo envio
        </button>
      </div>
    )
  }

  return (
    <div className="mt-4 space-y-3 pb-24">
      {/* Resumo rápido */}
      <div className="flex gap-3 mb-5">
        <div className="flex-1 bg-green-50 border border-green-200 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-green-600">{operaveis.length}</p>
          <p className="text-xs text-green-700">Operáveis</p>
        </div>
        <div className="flex-1 bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-amber-600">{restringidas.length}</p>
          <p className="text-xs text-amber-700">Restringidas</p>
        </div>
      </div>

      {/* Cards de cada conta */}
      {contas.map((conta) => {
        const item = items[conta.id]
        const isRestringida = item.status === 'restringida'

        return (
          <div
            key={conta.id}
            className={`bg-white rounded-2xl border-2 shadow-sm transition-all ${
              isRestringida ? 'border-amber-300' : 'border-gray-100'
            }`}
          >
            {/* Nome da conta + toggles */}
            <div className="p-4">
              <p className="font-semibold text-gray-900 mb-3">{conta.nome}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setStatus(conta.id, 'operavel')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium text-sm transition-all ${
                    !isRestringida
                      ? 'bg-green-500 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-500 hover:bg-green-50'
                  }`}
                >
                  <CheckCircle2 size={16} />
                  Operável
                </button>
                <button
                  onClick={() => setStatus(conta.id, 'restringida')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium text-sm transition-all ${
                    isRestringida
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-500 hover:bg-amber-50'
                  }`}
                >
                  <AlertTriangle size={16} />
                  Restringida
                </button>
              </div>
            </div>

            {/* Textarea de observação (apenas se restringida) */}
            {isRestringida && (
              <div className="px-4 pb-4">
                <textarea
                  value={item.observacao}
                  onChange={(e) => setObservacao(conta.id, e.target.value)}
                  placeholder="Observação (opcional)..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl border border-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm text-gray-700 resize-none bg-amber-50 placeholder-amber-400"
                />
              </div>
            )}
          </div>
        )
      })}

      {/* Botão Enviar — fixo no rodapé */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-10">
        <div className="max-w-lg mx-auto">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-4 px-4 rounded-2xl transition-colors shadow-lg text-base"
          >
            {submitting ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send size={20} />
                Enviar Checklist ({contas.length} contas)
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
