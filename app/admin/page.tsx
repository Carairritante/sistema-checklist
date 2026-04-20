import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { logoutAction } from '@/lib/actions'
import { Users, ListChecks, LogOut, ChevronRight, Smartphone } from 'lucide-react'

export default async function AdminDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('name')
    .eq('user_id', user?.id)
    .single()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">WhatsChecklist</h1>
            <p className="text-sm text-gray-500">Olá, {profile?.name ?? 'Admin'} 👋</p>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-500 transition-colors"
            >
              <LogOut size={16} />
              Sair
            </button>
          </form>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="max-w-lg mx-auto p-4 mt-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-700 px-1">Painel do Administrador</h2>

        <Link
          href="/admin/atendentes"
          className="flex items-center justify-between bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
              <Users className="text-blue-600" size={22} />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Gerenciar Atendentes</p>
              <p className="text-sm text-gray-500">Criar e remover atendentes</p>
            </div>
          </div>
          <ChevronRight className="text-gray-400 group-hover:text-blue-500 transition-colors" size={20} />
        </Link>

        <Link
          href="/admin/contas"
          className="flex items-center justify-between bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:border-green-200 hover:shadow-md transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center group-hover:bg-green-200 transition-colors">
              <ListChecks className="text-green-600" size={22} />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Gerenciar Contas</p>
              <p className="text-sm text-gray-500">Adicionar e editar contas do checklist</p>
            </div>
          </div>
          <ChevronRight className="text-gray-400 group-hover:text-green-500 transition-colors" size={20} />
        </Link>

        <Link
          href="/admin/whatsapp"
          className="flex items-center justify-between bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:border-emerald-200 hover:shadow-md transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
              <Smartphone className="text-emerald-600" size={22} />
            </div>
            <div>
              <p className="font-semibold text-gray-900">WhatsApp Admins</p>
              <p className="text-sm text-gray-500">Números que recebem os relatórios</p>
            </div>
          </div>
          <ChevronRight className="text-gray-400 group-hover:text-emerald-500 transition-colors" size={20} />
        </Link>
      </main>
    </div>
  )
}
