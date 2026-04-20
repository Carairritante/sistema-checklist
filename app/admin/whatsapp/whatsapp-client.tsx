'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { createAdminWhatsappAction, deleteAdminWhatsappAction } from '@/lib/actions'
import { Plus, Trash2, Smartphone, X, Loader2 } from 'lucide-react'
import Link from 'next/link'

type AdminWA = {
  id: string
  numero: string
  nome: string
  ativo: boolean
  created_at: string
}

export default function WhatsappClient({ admins: initial }: { admins: AdminWA[] }) {
  const [admins, setAdmins] = useState(initial)
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const result = await createAdminWhatsappAction(formData)
    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success('Número adicionado!')
      setShowModal(false)
      window.location.reload()
    }
    setLoading(false)
  }

  async function handleDelete(id: string, nome: string) {
    if (!confirm(`Remover "${nome}"? Esta ação não pode ser desfeita.`)) return
    setDeletingId(id)
    const result = await deleteAdminWhatsappAction(id)
    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success('Número removido.')
      setAdmins((prev) => prev.filter((a) => a.id !== id))
    }
    setDeletingId(null)
  }

  return (
    <>
      <div className="mt-4 mb-3">
        <Link
          href="/qr-scan"
          className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors mb-3"
        >
          <Smartphone size={20} />
          Escanear QR Code (conectar número)
        </Link>
        <button
          onClick={() => setShowModal(true)}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors"
        >
          <Plus size={20} />
          Adicionar Número Admin
        </button>
      </div>

      {admins.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Smartphone size={40} className="mx-auto mb-3 opacity-40" />
          <p>Nenhum número admin cadastrado ainda.</p>
          <p className="text-sm mt-1">Adicione os números que receberão os relatórios.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {admins.map((admin) => (
            <div
              key={admin.id}
              className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Smartphone size={18} className="text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{admin.nome}</p>
                  <p className="text-sm text-gray-500">{admin.numero}</p>
                </div>
              </div>
              <button
                onClick={() => handleDelete(admin.id, admin.nome)}
                disabled={deletingId === admin.id}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
              >
                {deletingId === admin.id ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Trash2 size={18} />
                )}
              </button>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Novo Número Admin</h2>
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
                  name="nome"
                  type="text"
                  required
                  minLength={2}
                  placeholder="Ex: João Admin"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Número WhatsApp
                </label>
                <input
                  name="numero"
                  type="text"
                  required
                  placeholder="5511999998888 (com código do país)"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Formato: 55 + DDD + número (sem espaços ou traços)
                </p>
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
                  {loading ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
