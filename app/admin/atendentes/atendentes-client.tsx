'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { createAtendenteAction, deleteAtendenteAction } from '@/lib/actions'
import { Plus, Trash2, User, X, Loader2 } from 'lucide-react'

type Atendente = {
  id: string
  user_id: string
  name: string
  role: string
  created_at: string
}

export default function AtendentesClient({ atendentes: initial }: { atendentes: Atendente[] }) {
  const [atendentes, setAtendentes] = useState(initial)
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)

    const result = await createAtendenteAction(formData)

    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success('Atendente criado com sucesso!')
      setShowModal(false)
      // Recarrega a página para refletir o novo atendente
      window.location.reload()
    }
    setLoading(false)
  }

  async function handleDelete(userId: string, name: string) {
    if (!confirm(`Remover atendente "${name}"? Esta ação não pode ser desfeita.`)) return

    setDeletingId(userId)
    const result = await deleteAtendenteAction(userId)

    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success('Atendente removido.')
      setAtendentes((prev) => prev.filter((a) => a.user_id !== userId))
    }
    setDeletingId(null)
  }

  return (
    <>
      {/* Botão Novo Atendente */}
      <div className="mt-4 mb-5">
        <button
          onClick={() => setShowModal(true)}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors"
        >
          <Plus size={20} />
          Novo Atendente
        </button>
      </div>

      {/* Lista de Atendentes */}
      {atendentes.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <User size={40} className="mx-auto mb-3 opacity-40" />
          <p>Nenhum atendente cadastrado ainda.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {atendentes.map((atendente) => (
            <div
              key={atendente.id}
              className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <User size={18} className="text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{atendente.name}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(atendente.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleDelete(atendente.user_id, atendente.name)}
                disabled={deletingId === atendente.user_id}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
              >
                {deletingId === atendente.user_id ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Trash2 size={18} />
                )}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal Novo Atendente */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Novo Atendente</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome</label>
                <input
                  name="name"
                  type="text"
                  required
                  minLength={2}
                  placeholder="Nome completo"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="email@exemplo.com"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Senha</label>
                <input
                  name="password"
                  type="password"
                  required
                  minLength={6}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                  {loading ? 'Criando...' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
