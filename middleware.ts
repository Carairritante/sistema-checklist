import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  // Cria cliente Supabase que consegue atualizar os cookies de sessão
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh da sessão — obrigatório com @supabase/ssr
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Rotas públicas
  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon')) {
    return supabaseResponse
  }

  // Redireciona para /login se não autenticado
  if (!user) {
    if (pathname === '/login') return supabaseResponse
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Usuário autenticado — busca role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  const role = profile?.role ?? 'atendente'

  // /login com sessão ativa → redireciona para área certa
  if (pathname === '/login') {
    const url = request.nextUrl.clone()
    url.pathname = role === 'admin' ? '/admin' : '/checklist'
    return NextResponse.redirect(url)
  }

  // / → redireciona para área certa
  if (pathname === '/') {
    const url = request.nextUrl.clone()
    url.pathname = role === 'admin' ? '/admin' : '/checklist'
    return NextResponse.redirect(url)
  }

  // /admin/* e /qr-scan → apenas admin
  if ((pathname.startsWith('/admin') || pathname.startsWith('/qr-scan')) && role !== 'admin') {
    const url = request.nextUrl.clone()
    url.pathname = '/checklist'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
