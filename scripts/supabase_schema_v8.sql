-- Instituto Intus — schema v8: atendimento presencial liberado pela Renata, paciente a paciente.
-- Padrão: nenhuma paciente vê/marca horário presencial até a Renata autorizar no painel.
alter table public.pacientes add column if not exists presencial_autorizado boolean not null default false;
