-- =============================================================================
-- Wedding Fofinho — Schema completo + RLS + função de purge
-- Execute este script no SQL Editor do Supabase (uma vez).
-- =============================================================================

-- 1) Tabela weddings (casamento por usuário: owner_id = auth.uid())
create table if not exists public.weddings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name_1 text not null default '',
  name_2 text not null default '',
  wedding_date date,
  venue_name text,
  budget_total numeric(12,2),
  tier text not null default 'mid' check (tier in ('eco','mid','prem')),
  happened_at timestamptz,
  purge_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_weddings_owner on public.weddings(owner_id);
create index if not exists idx_weddings_purge on public.weddings(purge_at) where purge_at is not null;

-- 2) Tabela tasks
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  title text not null,
  done boolean not null default false,
  priority text check (priority in ('baixa','media','alta')),
  due_date date,
  assigned_to text,
  notes text,
  "order" int default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_tasks_wedding on public.tasks(wedding_id);

-- 3) Tabela guests
create table if not exists public.guests (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  name text not null,
  phone text,
  email text,
  "group" text,
  rsvp text check (rsvp in ('pendente','confirmado','recusado')),
  table_name text,
  dietary text,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_guests_wedding on public.guests(wedding_id);

-- 4) Tabela budget_items
create table if not exists public.budget_items (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  name text not null,
  category text,
  eco numeric(12,2) default 0,
  mid numeric(12,2) default 0,
  prem numeric(12,2) default 0,
  qty numeric(12,2) default 1,
  unit text,
  status text,
  vendor_name text,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_budget_items_wedding on public.budget_items(wedding_id);

-- 5) Tabela mood_refs
create table if not exists public.mood_refs (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  title text not null,
  category text,
  image_url text,
  link_url text,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_mood_refs_wedding on public.mood_refs(wedding_id);

-- =============================================================================
-- RLS (Row Level Security)
-- =============================================================================

alter table public.weddings enable row level security;
alter table public.tasks enable row level security;
alter table public.guests enable row level security;
alter table public.budget_items enable row level security;
alter table public.mood_refs enable row level security;

-- Weddings: só o dono vê/edita
drop policy if exists "weddings_select_owner" on public.weddings;
create policy "weddings_select_owner" on public.weddings for select using (auth.uid() = owner_id);
drop policy if exists "weddings_insert_owner" on public.weddings;
create policy "weddings_insert_owner" on public.weddings for insert with check (auth.uid() = owner_id);
drop policy if exists "weddings_update_owner" on public.weddings;
create policy "weddings_update_owner" on public.weddings for update using (auth.uid() = owner_id);
drop policy if exists "weddings_delete_owner" on public.weddings;
create policy "weddings_delete_owner" on public.weddings for delete using (auth.uid() = owner_id);

-- Filhas: só quem tem acesso ao wedding_id (dono do casamento)
create or replace function public.user_wedding_ids()
returns setof uuid
language sql
stable
security definer
as $$
  select id from public.weddings where owner_id = auth.uid();
$$;

-- tasks
drop policy if exists "tasks_select" on public.tasks;
create policy "tasks_select" on public.tasks for select using (wedding_id in (select public.user_wedding_ids()));
drop policy if exists "tasks_insert" on public.tasks;
create policy "tasks_insert" on public.tasks for insert with check (wedding_id in (select public.user_wedding_ids()));
drop policy if exists "tasks_update" on public.tasks;
create policy "tasks_update" on public.tasks for update using (wedding_id in (select public.user_wedding_ids()));
drop policy if exists "tasks_delete" on public.tasks;
create policy "tasks_delete" on public.tasks for delete using (wedding_id in (select public.user_wedding_ids()));

-- guests
drop policy if exists "guests_select" on public.guests;
create policy "guests_select" on public.guests for select using (wedding_id in (select public.user_wedding_ids()));
drop policy if exists "guests_insert" on public.guests;
create policy "guests_insert" on public.guests for insert with check (wedding_id in (select public.user_wedding_ids()));
drop policy if exists "guests_update" on public.guests;
create policy "guests_update" on public.guests for update using (wedding_id in (select public.user_wedding_ids()));
drop policy if exists "guests_delete" on public.guests;
create policy "guests_delete" on public.guests for delete using (wedding_id in (select public.user_wedding_ids()));

-- budget_items
drop policy if exists "budget_items_select" on public.budget_items;
create policy "budget_items_select" on public.budget_items for select using (wedding_id in (select public.user_wedding_ids()));
drop policy if exists "budget_items_insert" on public.budget_items;
create policy "budget_items_insert" on public.budget_items for insert with check (wedding_id in (select public.user_wedding_ids()));
drop policy if exists "budget_items_update" on public.budget_items;
create policy "budget_items_update" on public.budget_items for update using (wedding_id in (select public.user_wedding_ids()));
drop policy if exists "budget_items_delete" on public.budget_items;
create policy "budget_items_delete" on public.budget_items for delete using (wedding_id in (select public.user_wedding_ids()));

-- mood_refs
drop policy if exists "mood_refs_select" on public.mood_refs;
create policy "mood_refs_select" on public.mood_refs for select using (wedding_id in (select public.user_wedding_ids()));
drop policy if exists "mood_refs_insert" on public.mood_refs;
create policy "mood_refs_insert" on public.mood_refs for insert with check (wedding_id in (select public.user_wedding_ids()));
drop policy if exists "mood_refs_update" on public.mood_refs;
create policy "mood_refs_update" on public.mood_refs for update using (wedding_id in (select public.user_wedding_ids()));
drop policy if exists "mood_refs_delete" on public.mood_refs;
create policy "mood_refs_delete" on public.mood_refs for delete using (wedding_id in (select public.user_wedding_ids()));

-- =============================================================================
-- Função de purge (apaga casamentos com purge_at <= now())
-- =============================================================================

create or replace function public.purge_old_weddings()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  w record;
begin
  for w in
    select id from public.weddings
    where purge_at is not null and purge_at <= now()
  loop
    delete from public.tasks where wedding_id = w.id;
    delete from public.guests where wedding_id = w.id;
    delete from public.budget_items where wedding_id = w.id;
    delete from public.mood_refs where wedding_id = w.id;
    delete from public.weddings where id = w.id;
  end loop;
end;
$$;

grant execute on function public.purge_old_weddings() to postgres;
grant execute on function public.purge_old_weddings() to service_role;

-- =============================================================================
-- Realtime (opcional: habilitar para as tabelas que o app escuta)
-- Se der erro, ative em: Database > Replication > selecione tasks, guests, budget_items, mood_refs
-- =============================================================================

-- Realtime: se falhar, ative em Database > Replication para tasks, guests, budget_items, mood_refs
do $$
begin
  alter publication supabase_realtime add table public.tasks;
exception when others then null;
end $$;
do $$
begin
  alter publication supabase_realtime add table public.guests;
exception when others then null;
end $$;
do $$
begin
  alter publication supabase_realtime add table public.budget_items;
exception when others then null;
end $$;
do $$
begin
  alter publication supabase_realtime add table public.mood_refs;
exception when others then null;
end $$;
