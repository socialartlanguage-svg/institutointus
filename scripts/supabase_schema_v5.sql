-- Instituto Intus — schema v5: duração do pacote (1 mês ou 3 meses).
-- Rodar no SQL Editor do Supabase. Pode rodar de novo sem problema.
-- Pacotes que já existem ficam com 1 mês.

alter table public.pacotes add column if not exists duracao_meses integer not null default 1;
