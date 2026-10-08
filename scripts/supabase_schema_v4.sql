-- Instituto Intus — schema v4: modalidade de cada horário e de cada sessão
-- (online ou presencial em Itaipu/Niterói).
-- Rodar no SQL Editor do Supabase. Pode rodar de novo sem problema:
-- cria as colunas se não existirem e SEMPRE refaz a regra de valores permitidos.
-- Horários e sessões que já existem ficam como 'online'.

alter table public.slots_abertos add column if not exists modalidade text not null default 'online';
alter table public.sessoes       add column if not exists modalidade text not null default 'online';

alter table public.slots_abertos drop constraint if exists slots_abertos_modalidade_check;
alter table public.slots_abertos add constraint slots_abertos_modalidade_check check (modalidade in ('online', 'itaipu'));

alter table public.sessoes drop constraint if exists sessoes_modalidade_check;
alter table public.sessoes add constraint sessoes_modalidade_check check (modalidade in ('online', 'itaipu'));
