-- Instituto Intus — schema v7: horário aberto como "online ou presencial" (a paciente escolhe)
-- Só `slots_abertos` aceita 'ambos'; a sessão marcada continua sendo 'online' ou 'itaipu'.
alter table public.slots_abertos drop constraint if exists slots_abertos_modalidade_check;
alter table public.slots_abertos add constraint slots_abertos_modalidade_check check (modalidade in ('online', 'itaipu', 'ambos'));
