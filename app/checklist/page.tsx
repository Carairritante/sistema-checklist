import { createClient } from '@/lib/supabase/server'
import ChecklistForm from './checklist-form'
import { logoutAction } from '@/lib/actions'
import { LogOut } from 'lucide-react'

export default async function ChecklistPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [profileResult, contasResult] = await Promise.all([
    supabase.from('profiles').select('name, role').eq('user_id', user?.id).single(),
    supabase.from('contas').select('id, nome').order('created_at', { ascending: true }),
  ])

  const profile = profileResult.data
  const contas = contasResult.data ?? []

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">📋 WhatsChecklist</h1>
            <p className="text-sm text-gray-500">
              Olá, {profile?.name ?? 'Atendente'} 👋
            </p>
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

      <main className="max-w-lg mx-auto p-4">
        {contas.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">📭</p>
            <p className="font-medium">Nenhuma conta cadastrada.</p>
            <p className="text-sm mt-1">Peça ao administrador para adicionar contas.</p>
          </div>
        ) : (
          <ChecklistForm contas={contas} />
        )}
      </main>
    </div>
  )
}
