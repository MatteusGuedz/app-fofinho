-- =============================================================================
-- Wedding Fofinho — Compartilhamento (noiva + noivo)
-- Tabelas: wedding_members, wedding_invites
-- Função: user_wedding_ids passa a incluir casamentos onde o usuário é membro
-- =============================================================================

-- 1) Membros do casamento (parceiro/a convidado)
create table if not exists public.wedding_members (
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'partner' check (role in ('owner','partner')),
  created_at timestamptz not null default now(),
  primary key (wedding_id, user_id)
);

create index if not exists idx_wedding_members_user on public.wedding_members(user_id);
create index if not exists idx_wedding_members_wedding on public.wedding_members(wedding_id);

-- 2) Convites por link (token único; dono gera, parceiro aceita)
create table if not exists public.wedding_invites (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  token text not null unique,
  created_at timestamptz not null default now(),
  expires_at timestamptz
);

create index if not exists idx_wedding_invites_token on public.wedding_invites(token);
create index if not exists idx_wedding_invites_wedding on public.wedding_invites(wedding_id);

-- 3) user_wedding_ids: casamentos onde sou dono OU onde sou membro
create or replace function public.user_wedding_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.weddings where owner_id = auth.uid()
  union
  select wedding_id from public.wedding_members where user_id = auth.uid();
$$;

-- 4) RLS weddings: dono OU membro pode select/update (delete só dono)
drop policy if exists "weddings_select_owner" on public.weddings;
create policy "weddings_select_owner" on public.weddings for select using (
  owner_id = auth.uid() or id in (select wedding_id from public.wedding_members where user_id = auth.uid())
);
drop policy if exists "weddings_update_owner" on public.weddings;
create policy "weddings_update_owner" on public.weddings for update using (
  owner_id = auth.uid() or id in (select wedding_id from public.wedding_members where user_id = auth.uid())
);
-- insert/delete: só dono (quem cria é owner_id; só owner pode apagar)
-- já existem weddings_insert_owner e weddings_delete_owner

-- 5) RLS wedding_members
alter table public.wedding_members enable row level security;

-- Dono do casamento pode ver todos os membros; membro pode ver os membros do mesmo casamento
create policy "wedding_members_select" on public.wedding_members for select using (
  wedding_id in (select public.user_wedding_ids())
);
-- Só dono do casamento pode inserir (convidar) — via RPC o parceiro se adiciona
create policy "wedding_members_insert_owner" on public.wedding_members for insert with check (
  wedding_id in (select id from public.weddings where owner_id = auth.uid())
);
-- Parceiro pode inserir a si mesmo ao aceitar convite (via RPC security definer)
-- RPC accept_invite fará o insert; não precisamos policy de insert para user_id = auth.uid() aqui
-- Remover membro: dono pode deletar; membro pode se remover
create policy "wedding_members_delete" on public.wedding_members for delete using (
  wedding_id in (select id from public.weddings where owner_id = auth.uid())
  or user_id = auth.uid()
);

-- 6) RLS wedding_invites: só dono do casamento vê/cria/apaga convites
alter table public.wedding_invites enable row level security;

create policy "wedding_invites_select_owner" on public.wedding_invites for select using (
  wedding_id in (select id from public.weddings where owner_id = auth.uid())
);
create policy "wedding_invites_insert_owner" on public.wedding_invites for insert with check (
  wedding_id in (select id from public.weddings where owner_id = auth.uid())
);
create policy "wedding_invites_delete_owner" on public.wedding_invites for delete using (
  wedding_id in (select id from public.weddings where owner_id = auth.uid())
);

-- 7) RPC: obter dados do convite pelo token (público, para exibir "Casamento X & Y te convidou")
create or replace function public.get_invite_by_token(invite_token text)
returns table (wedding_id uuid, name_1 text, name_2 text)
language sql
stable
security definer
set search_path = public
as $$
  select w.id, w.name_1, w.name_2
  from public.wedding_invites i
  join public.weddings w on w.id = i.wedding_id
  where i.token = invite_token
    and (i.expires_at is null or i.expires_at > now());
$$;

-- 8) RPC: aceitar convite (usuário logado; adiciona como partner e remove o convite)
create or replace function public.accept_invite(invite_token text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_wedding_id uuid;
  v_exists boolean;
begin
  if auth.uid() is null then
    raise exception 'Não autenticado';
  end if;

  select i.wedding_id into v_wedding_id
  from public.wedding_invites i
  where i.token = invite_token
    and (i.expires_at is null or i.expires_at > now())
  limit 1;

  if v_wedding_id is null then
    raise exception 'Convite inválido ou expirado';
  end if;

  -- Já é membro?
  select exists(select 1 from public.wedding_members where wedding_id = v_wedding_id and user_id = auth.uid()) into v_exists;
  if v_exists then
    delete from public.wedding_invites where token = invite_token;
    return v_wedding_id;
  end if;

  -- É o dono? Não precisa ser membro.
  if exists(select 1 from public.weddings where id = v_wedding_id and owner_id = auth.uid()) then
    delete from public.wedding_invites where token = invite_token;
    return v_wedding_id;
  end if;

  insert into public.wedding_members (wedding_id, user_id, role)
  values (v_wedding_id, auth.uid(), 'partner');

  delete from public.wedding_invites where token = invite_token;
  return v_wedding_id;
end;
$$;

grant execute on function public.get_invite_by_token(text) to anon;
grant execute on function public.get_invite_by_token(text) to authenticated;
grant execute on function public.accept_invite(text) to authenticated;
