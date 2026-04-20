import { createAdminClient } from '@/lib/supabase/server'
import WhatsappClient from './whatsapp-client'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function AdminWhatsappPage() {
  const adminClient = createAdminClient()
  const { data: admins } = await adminClient
    .from('admin_whatsapp')
    .select('id, numero, nome, ativo, created_at')
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <Link href="/admin" className="text-gray-500 hover:text-gray-700 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">WhatsApp Admin</h1>
            <p className="text-sm text-gray-500">
              {admins?.length ?? 0} número(s) cadastrado(s)
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto p-4">
        <WhatsappClient admins={admins ?? []} />
      </main>
    </div>
  )
}
