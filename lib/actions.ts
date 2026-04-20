'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient, createAdminClient } from '@/lib/supabase/server'

// ── Auth ─────────────────────────────────────────────────────

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: 'Email ou senha inválidos.' }
  }

  // Busca role para decidir para onde redirecionar
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Erro ao obter usuário.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  redirect(profile?.role === 'admin' ? '/admin' : '/checklist')
}

export async function logoutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

// ── Atendentes (admin) ───────────────────────────────────────

const createAtendenteSchema = z.object({
  name: z.string().min(2, 'Nome deve ter ao menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter ao menos 6 caracteres'),
})

export async function createAtendenteAction(formData: FormData) {
  const parsed = createAtendenteSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  const { name, email, password } = parsed.data

  // Verifica se o solicitante é admin
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (profile?.role !== 'admin') return { error: 'Sem permissão.' }

  // Usa service_role para criar o usuário — NUNCA exposto no cliente
  const adminClient = createAdminClient()
  const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name, role: 'atendente' },
  })

  if (createError) {
    return { error: createError.message }
  }

  // O trigger já cria o profile — mas garantimos com upsert
  await adminClient.from('profiles').upsert({
    user_id: newUser.user.id,
    name,
    role: 'atendente',
  })

  revalidatePath('/admin/atendentes')
  return { success: true }
}

export async function deleteAtendenteAction(userId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (profile?.role !== 'admin') return { error: 'Sem permissão.' }

  const adminClient = createAdminClient()
  const { error } = await adminClient.auth.admin.deleteUser(userId)

  if (error) return { error: error.message }

  revalidatePath('/admin/atendentes')
  return { success: true }
}

// ── Contas (admin) ───────────────────────────────────────────

const contaSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(100),
})

export async function createContaAction(formData: FormData) {
  const parsed = contaSchema.safeParse({ nome: formData.get('nome') })
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const supabase = await createClient()
  const { error } = await supabase
    .from('contas')
    .insert({ nome: parsed.data.nome })

  if (error) return { error: error.message }

  revalidatePath('/admin/contas')
  return { success: true }
}

export async function updateContaAction(id: string, formData: FormData) {
  const parsed = contaSchema.safeParse({ nome: formData.get('nome') })
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const supabase = await createClient()
  const { error } = await supabase
    .from('contas')
    .update({ nome: parsed.data.nome })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/admin/contas')
  return { success: true }
}

export async function deleteContaAction(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('contas').delete().eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/admin/contas')
  return { success: true }
}

// ── Checklist ────────────────────────────────────────────────

type ChecklistItem = {
  conta_id: string
  conta_nome: string
  status: 'operavel' | 'restringida'
  observacao?: string
}

export async function submitChecklistAction(items: ChecklistItem[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('name')
    .eq('user_id', user.id)
    .single()


  // Insere o checklist
  const { data: checklist, error: checklistError } = await supabase
    .from('checklists')
    .insert({
      atendente_id: user.id,
      atendente_name: profile?.name ?? user.email,
      whatsapp_sent: false,
    })
    .select()
    .single()

  if (checklistError) return { error: checklistError.message }

  // Insere os itens
  const { error: itemsError } = await supabase.from('checklist_items').insert(
    items.map((item) => ({
      checklist_id: checklist.id,
      conta_id: item.conta_id,
      conta_nome: item.conta_nome,
      status: item.status,
      observacao: item.observacao ?? null,
    }))
  )

  if (itemsError) return { error: itemsError.message }

  // Monta mensagem
  const atendenteName = profile?.name ?? user.email ?? 'Atendente'
  const now = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' })
  const restringidas = items.filter((i) => i.status === 'restringida')
  const operaveis = items.filter((i) => i.status === 'operavel')

  let msg = `📋 *Checklist — ${atendenteName}*\n🕐 ${now}\n\n`
  items.forEach((i) => {
    if (i.status === 'operavel') {
      msg += `✅ ${i.conta_nome}\n`
    } else {
      msg += `❌ ${i.conta_nome}${i.observacao ? ` — ${i.observacao}` : ''}\n`
    }
  })
  msg += `\n✅ Operáveis: ${operaveis.length}   ❌ Restringidas: ${restringidas.length}`

  // Dispara notificação via serviço WhatsApp separado
  let whatsappSent = false
  try {
    const waUrl = process.env.WHATSAPP_SERVICE_URL
    if (waUrl) {
      const res = await fetch(`${waUrl}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg }),
      })
      whatsappSent = res.ok
    }
  } catch {
    // falha silenciosa — checklist já foi salvo
  }

  await supabase
    .from('checklists')
    .update({ whatsapp_sent: whatsappSent })
    .eq('id', checklist.id)

  revalidatePath('/checklist')
  return { success: true }
}

// ── Admin WhatsApp ───────────────────────────────────────────

const adminWhatsappSchema = z.object({
  numero: z.string().min(10, 'Número inválido'),
  nome: z.string().min(2, 'Nome deve ter ao menos 2 caracteres'),
})

export async function createAdminWhatsappAction(formData: FormData) {
  const parsed = adminWhatsappSchema.safeParse({
    numero: formData.get('numero'),
    nome: formData.get('nome'),
  })
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .single()
  if (profile?.role !== 'admin') return { error: 'Sem permissão.' }

  const adminClient = createAdminClient()
  const { error } = await adminClient
    .from('admin_whatsapp')
    .insert({ numero: parsed.data.numero, nome: parsed.data.nome })

  if (error) return { error: error.message }

  revalidatePath('/admin/whatsapp')
  return { success: true }
}

export async function deleteAdminWhatsappAction(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .single()
  if (profile?.role !== 'admin') return { error: 'Sem permissão.' }

  const adminClient = createAdminClient()
  const { error } = await adminClient.from('admin_whatsapp').delete().eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/admin/whatsapp')
  return { success: true }
}
