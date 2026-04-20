-- ============================================================
-- WhatsChecklist — Schema completo para Supabase
-- Execute este SQL no SQL Editor do seu projeto Supabase
-- ============================================================

-- ── 1. Tabela de perfis (complementa auth.users) ────────────
create table if not exists public.profiles (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null unique references auth.users(id) on delete cascade,
  name        text not null,
  role        text not null default 'atendente' check (role in ('admin', 'atendente')),
  created_at  timestamptz not null default now()
);

-- ── 2. Tabela de contas do checklist ────────────────────────
create table if not exists public.contas (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null,
  created_at  timestamptz not null default now()
);

-- ── 3. Tabela de checklists enviados ────────────────────────
create table if not exists public.checklists (
  id              uuid primary key default gen_random_uuid(),
  atendente_id    uuid not null references auth.users(id) on delete cascade,
  atendente_name  text not null,
  whatsapp_sent   boolean not null default false,
  created_at      timestamptz not null default now()
);

-- ── 4. Tabela de itens do checklist ─────────────────────────
create table if not exists public.checklist_items (
  id           uuid primary key default gen_random_uuid(),
  checklist_id uuid not null references public.checklists(id) on delete cascade,
  conta_id     uuid references public.contas(id) on delete set null,
  conta_nome   text not null,
  status       text not null check (status in ('operavel', 'restringida')),
  observacao   text,
  created_at   timestamptz not null default now()
);

-- ── 5. Função auxiliar: verifica se usuário atual é admin ───
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.profiles
    where user_id = auth.uid()
      and role = 'admin'
  );
$$;

-- ── 6. Trigger: cria profile automaticamente ao criar usuário
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', new.email),
    coalesce(new.raw_user_meta_data->>'role', 'atendente')
  );
  return new;
end;
$$;

-- Remove trigger se já existir e recria
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── 7. Row Level Security ────────────────────────────────────
alter table public.profiles       enable row level security;
alter table public.contas         enable row level security;
alter table public.checklists     enable row level security;
alter table public.checklist_items enable row level security;

-- profiles: cada um vê o próprio; admin vê todos
create policy "profiles_select_own_or_admin"
  on public.profiles for select
  using (user_id = auth.uid() or public.is_admin());

create policy "profiles_insert_trigger"
  on public.profiles for insert
  with check (true); -- inserção feita pelo trigger (security definer)

create policy "profiles_update_admin"
  on public.profiles for update
  using (public.is_admin());

create policy "profiles_delete_admin"
  on public.profiles for delete
  using (public.is_admin());

-- contas: qualquer autenticado lê; apenas admin cria/edita/deleta
create policy "contas_select_auth"
  on public.contas for select
  using (auth.uid() is not null);

create policy "contas_insert_admin"
  on public.contas for insert
  with check (public.is_admin());

create policy "contas_update_admin"
  on public.contas for update
  using (public.is_admin());

create policy "contas_delete_admin"
  on public.contas for delete
  using (public.is_admin());

-- checklists: cada atendente vê os próprios; admin vê todos
create policy "checklists_select_own_or_admin"
  on public.checklists for select
  using (atendente_id = auth.uid() or public.is_admin());

create policy "checklists_insert_own"
  on public.checklists for insert
  with check (atendente_id = auth.uid());

-- checklist_items: visibilidade via join com checklists
create policy "checklist_items_select_own_or_admin"
  on public.checklist_items for select
  using (
    exists (
      select 1 from public.checklists c
      where c.id = checklist_items.checklist_id
        and (c.atendente_id = auth.uid() or public.is_admin())
    )
  );

create policy "checklist_items_insert_own"
  on public.checklist_items for insert
  with check (
    exists (
      select 1 from public.checklists c
      where c.id = checklist_items.checklist_id
        and c.atendente_id = auth.uid()
    )
  );

-- ── 8. Tabela de admins WhatsApp ────────────────────────────
create table if not exists public.admin_whatsapp (
  id         uuid primary key default gen_random_uuid(),
  numero     text not null,
  nome       text not null,
  ativo      boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.admin_whatsapp enable row level security;

-- Apenas admin pode ler/escrever números
create policy "admin_whatsapp_select_admin"
  on public.admin_whatsapp for select
  using (public.is_admin());

create policy "admin_whatsapp_insert_admin"
  on public.admin_whatsapp for insert
  with check (public.is_admin());

create policy "admin_whatsapp_delete_admin"
  on public.admin_whatsapp for delete
  using (public.is_admin());

-- O service_role (whatsapp-server) lê via bypass de RLS
-- Não precisa de policy extra pois service_role ignora RLS

-- ── 9. Índices para performance ─────────────────────────────
create index if not exists idx_profiles_user_id       on public.profiles(user_id);
create index if not exists idx_checklists_atendente   on public.checklists(atendente_id);
create index if not exists idx_checklists_created     on public.checklists(created_at);
create index if not exists idx_items_checklist_id     on public.checklist_items(checklist_id);
create index if not exists idx_admin_whatsapp_ativo   on public.admin_whatsapp(ativo);

-- ============================================================
-- APÓS rodar este SQL, crie seu primeiro admin manualmente:
--
-- 1. Vá em Authentication > Users no Supabase Dashboard
-- 2. Clique "Add User" e crie o usuário admin
-- 3. Copie o UUID gerado
-- 4. Execute no SQL Editor:
--    UPDATE public.profiles SET role = 'admin' WHERE user_id = '<UUID_AQUI>';
-- ============================================================
