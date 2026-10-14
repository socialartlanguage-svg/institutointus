-- Instituto Intus — schema v6: link de cadastro para pacientes já ativas.
-- Rodar no SQL Editor do Supabase. Pode rodar de novo sem problema.
create table if not exists public.convites_cadastro (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);
alter table public.convites_cadastro enable row level security;
grant all on table public.convites_cadastro to service_role;
