-- Instituto Intus — schema v9: agenda pública de palestras e eventos da Renata.
create table if not exists public.eventos (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  data_hora timestamptz not null,
  local text,
  descricao text,
  link text,
  criado_em timestamptz not null default now()
);
alter table public.eventos enable row level security;
grant all on table public.eventos to service_role;
