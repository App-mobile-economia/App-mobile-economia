-- Cole este arquivo no Supabase: SQL Editor > New query > Run.

-- Tabela dos favoritos de cada usuário
create table public.favoritos (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  indicador text not null,
  nota text not null default '',
  created_at timestamptz not null default now(),
  unique (user_id, indicador)
);

-- RLS (Row Level Security): cada usuário só acessa as próprias linhas
alter table public.favoritos enable row level security;

create policy "ler os proprios favoritos" on public.favoritos
  for select using (auth.uid() = user_id);

create policy "criar os proprios favoritos" on public.favoritos
  for insert with check (auth.uid() = user_id);

create policy "editar os proprios favoritos" on public.favoritos
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "apagar os proprios favoritos" on public.favoritos
  for delete using (auth.uid() = user_id);
