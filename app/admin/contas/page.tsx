import { createClient } from '@/lib/supabase/server'
import ContasClient from './contas-client'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function ContasPage() {
  const supabase = await createClient()

  const { data: contas } = await supabase
    .from('contas')
    .select('id, nome, created_at')
    .order('created_at', { ascending: true })

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <Link href="/admin" className="text-gray-500 hover:text-gray-700 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Contas</h1>
            <p className="text-sm text-gray-500">{contas?.length ?? 0} conta(s) cadastrada(s)</p>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto p-4">
        <ContasClient contas={contas ?? []} />
      </main>
    </div>
  )
}
