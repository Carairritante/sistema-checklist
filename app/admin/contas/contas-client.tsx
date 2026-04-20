'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { createContaAction, updateContaAction, deleteContaAction } from '@/lib/actions'
import { Plus, Trash2, Pencil, Check, X, Loader2, Building2 } from 'lucide-react'

type Conta = { id: string; nome: string; created_at: string }

export default function ContasClient({ contas: initial }: { contas: Conta[] }) {
  const [contas, setContas] = useState(initial)
  const [newNome, setNewNome] = useState('')
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editNome, setEditNome] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)

  async function handleCreate() {
    if (!newNome.trim()) return
    setAdding(true)
    const fd = new FormData()
    fd.append('nome', newNome.trim())
    const result = await createContaAction(fd)

    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success('Conta criada!')
      setNewNome('')
      window.location.reload()
    }
    setAdding(false)
  }

  async function handleUpdate(id: string) {
    if (!editNome.trim()) return
    setSavingId(id)
    const fd = new FormData()
    fd.append('nome', editNome.trim())
    const result = await updateContaAction(id, fd)

    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success('Conta atualizada!')
      setContas((prev) => prev.map((c) => (c.id === id ? { ...c, nome: editNome.trim() } : c)))
      setEditingId(null)
    }
    setSavingId(null)
  }

  async function handleDelete(id: string, nome: string) {
    if (!confirm(`Remover a conta "${nome}"?`)) return
    setDeletingId(id)
    const result = await deleteContaAction(id)

    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success('Conta removida.')
      setContas((prev) => prev.filter((c) => c.id !== id))
    }
    setDeletingId(null)
  }

  function startEdit(conta: Conta) {
    setEditingId(conta.id)
    setEditNome(conta.nome)
  }

  return (
    <>
      {/* Formulário de Nova Conta */}
      <div className="mt-4 mb-5 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <p className="text-sm font-medium text-gray-700 mb-3">Adicionar nova conta</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={newNome}
            onChange={(e) => setNewNome(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            placeholder="Nome da conta"
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 text-sm"
          />
          <button
            onClick={handleCreate}
            disabled={adding || !newNome.trim()}
            className="px-4 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white rounded-xl transition-colors flex items-center gap-1.5"
          >
            {adding ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            Adicionar
          </button>
        </div>
      </div>

      {/* Lista de Contas */}
      {contas.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Building2 size={40} className="mx-auto mb-3 opacity-40" />
          <p>Nenhuma conta cadastrada ainda.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {contas.map((conta) => (
            <div
              key={conta.id}
              className="bg-white rounded-2xl px-4 py-3.5 shadow-sm border border-gray-100 flex items-center justify-between gap-3"
            >
              {editingId === conta.id ? (
                // Modo de edição inline
                <div className="flex items-center gap-2 flex-1">
                  <input
                    value={editNome}
                    onChange={(e) => setEditNome(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleUpdate(conta.id)}
                    autoFocus
                    className="flex-1 px-3 py-1.5 rounded-lg border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 text-sm"
                  />
                  <button
                    onClick={() => handleUpdate(conta.id)}
                    disabled={savingId === conta.id}
                    className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                  >
                    {savingId === conta.id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Check size={16} />
                    )}
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="p-1.5 text-gray-400 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                // Modo de visualização
                <>
                  <span className="font-medium text-gray-900 flex-1">{conta.nome}</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => startEdit(conta)}
                      className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(conta.id, conta.nome)}
                      disabled={deletingId === conta.id}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {deletingId === conta.id ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  )
}
