import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const waUrl = process.env.WHATSAPP_SERVICE_URL
  if (!waUrl) {
    return NextResponse.json({ connected: false, qr: null, message: 'Serviço WhatsApp não configurado' })
  }

  try {
    const res = await fetch(`${waUrl}/qr`, { cache: 'no-store' })
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ connected: false, qr: null, message: 'Serviço WhatsApp indisponível' })
  }
}
