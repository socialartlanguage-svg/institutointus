-- Instituto Intus — schema v4: modalidade de cada horário e de cada sessão
-- (online ou presencial em Itaipu/Niterói).
-- Rodar UMA vez no SQL Editor do Supabase. Pode rodar de novo sem problema.
-- Horários e sessões que já existem ficam como 'online'.

alter table public.slots_abertos
  add column if not exists modalidade text not null default 'online'
  check (modalidade in ('online', 'itaipu'));

alter table public.sessoes
  add column if not exists modalidade text not null default 'online'
  check (modalidade in ('online', 'itaipu'));
