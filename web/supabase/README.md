# Supabase — Wedding Fofinho

## 1. Schema base (uma vez)

1. Abra o [Supabase Dashboard](https://supabase.com/dashboard) do seu projeto.
2. Vá em **SQL Editor** e crie uma nova query.
3. Copie todo o conteúdo de `schema.sql` e cole na query.
4. Clique em **Run**.

Se der erro em alguma parte (por exemplo Realtime), você pode comentar as linhas do `do $$ ... end $$` e ativar Realtime depois em **Database > Replication**, marcando as tabelas `tasks`, `guests`, `budget_items`, `mood_refs`.

## 2. Migrações (compartilhamento noiva + noivo)

Depois do schema base, rode a migração de compartilhamento.

### Opção A — Supabase CLI (recomendado)

Na pasta `web`:

```bash
npx supabase login
npx supabase link --project-ref SEU_PROJECT_REF
npm run db:migrate
```

(O **Project ref** fica na URL do projeto: `https://supabase.com/dashboard/project/XXXXX` → use `XXXXX`.)

### Opção B — SQL no Dashboard

1. No **SQL Editor** do Supabase, crie uma nova query.
2. Copie todo o conteúdo de `migrations/20250317_wedding_sharing.sql`.
3. Cole e clique em **Run**.

## 3. Agendar a limpeza automática (purge em 30 dias)

O app grava `purge_at` quando o casal clica em **“O casamento aconteceu”**. Para apagar de fato os dados após 30 dias, é preciso chamar a função `purge_old_weddings()` periodicamente.

### Opção A — pg_cron (recomendado, se disponível)

No **SQL Editor**, execute (uma vez):

```sql
-- Requer extensão pg_cron (em projetos Supabase pode estar em "Database > Extensions")
select cron.schedule(
  'purge-old-weddings',
  '0 3 * * *',  -- todo dia às 3h
  'select public.purge_old_weddings();'
);
```

### Opção B — Edge Function + cron externo

Se não tiver pg_cron, crie uma Edge Function que chame a API do Supabase com a **service_role key** e execute:

```sql
select public.purge_old_weddings();
```

Agende essa função em um serviço de cron (ex.: Vercel Cron, GitHub Actions, ou outro) para rodar uma vez por dia.

### Opção C — Executar manualmente

No **SQL Editor**, de tempos em tempos:

```sql
select public.purge_old_weddings();
```

## 4. Resumo do que o schema faz

- Cria as tabelas: `weddings`, `tasks`, `guests`, `budget_items`, `mood_refs`.
- Ativa RLS: cada usuário só acessa o próprio casamento (`owner_id = auth.uid()`).
- Função `purge_old_weddings()`: apaga casamentos com `purge_at <= now()` e todos os dados relacionados.

Depois de rodar o `schema.sql`, o app pode criar casamentos, tarefas, convidados, orçamento e moodboard normalmente.
