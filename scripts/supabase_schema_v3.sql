-- Instituto Intus — schema v3: aceite do termo de compromisso.
-- Rodar UMA vez no SQL Editor do Supabase. Pode rodar de novo sem problema.

create table if not exists public.aceites_termo (
  id uuid primary key default gen_random_uuid(),
  paciente_id uuid not null references public.pacientes(id) on delete cascade,
  versao text not null,            -- ex.: 2026-10-v1
  texto text not null,             -- retrato do texto exato aceito
  texto_hash text not null,        -- SHA-256 desse texto
  nome_digitado text not null,
  aceito_em timestamptz not null default now(),
  ip text,
  user_agent text,
  unique (paciente_id, versao)
);

alter table public.aceites_termo enable row level security;
grant all on table public.aceites_termo to service_role;
