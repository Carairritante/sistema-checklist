import { createClient } from '@/lib/supabase/server'
import AtendentesClient from './atendentes-client'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function AtendentesPage() {
  const supabase = await createClient()

  // Busca todos os atendentes (não admin) junto com email do auth.users via view
  const { data: atendentes } = await supabase
    .from('profiles')
    .select('id, user_id, name, role, created_at')
    .eq('role', 'atendente')
    .order('created_at', { ascending: false })

  // Busca emails via admin client para exibir na tabela
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <Link href="/admin" className="text-gray-500 hover:text-gray-700 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Atendentes</h1>
            <p className="text-sm text-gray-500">{atendentes?.length ?? 0} cadastrado(s)</p>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto p-4">
        <AtendentesClient atendentes={atendentes ?? []} />
      </main>
    </div>
  )
}
