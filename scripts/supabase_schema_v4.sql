-- Instituto Intus — schema v4: modalidade de cada horário e de cada sessão
-- (online, presencial em Itaipu/Niterói ou na Barra da Tijuca/Rio).
-- Rodar UMA vez no SQL Editor do Supabase. Pode rodar de novo sem problema.
-- Horários e sessões que já existem ficam como 'online'.

alter table public.slots_abertos
  add column if not exists modalidade text not null default 'online'
  check (modalidade in ('online', 'itaipu', 'barra'));

alter table public.sessoes
  add column if not exists modalidade text not null default 'online'
  check (modalidade in ('online', 'itaipu', 'barra'));
