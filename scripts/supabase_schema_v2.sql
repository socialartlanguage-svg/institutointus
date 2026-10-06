-- Instituto Intus — schema v2: contas de paciente, observações de saúde,
-- horários abertos pela Renata e regras de cancelamento.
-- Rodar UMA vez no SQL Editor do Supabase (depois do supabase_schema.sql).
-- Pode rodar de novo sem problema (tudo é "if not exists").

-- ---------- Limpeza do paciente de teste (se ainda existir) ----------
delete from public.pacientes where email = 'teste-intus-apagar@exemplo.com';

-- ---------- Pacientes: vínculo com o login ----------
alter table public.pacientes
  add column if not exists auth_user_id uuid unique references auth.users(id) on delete set null,
  add column if not exists trocou_senha boolean not null default false,
  add column if not exists consentimento_saude_em timestamptz;

-- ---------- Observações de saúde (preenchidas pela própria paciente) ----------
create table if not exists public.observacoes_saude (
  paciente_id uuid primary key references public.pacientes(id) on delete cascade,
  toma_medicacao boolean,
  medicacoes text,
  tem_psiquiatra boolean,
  psiquiatra text,
  outras_observacoes text,
  atualizado_em timestamptz not null default now()
);

-- ---------- Horários que a Renata abriu ----------
-- Um horário só aparece para as pacientes se existir aqui E não estiver
-- ocupado por uma sessão agendada. Sessões de 60 min, começando em hora cheia.
create table if not exists public.slots_abertos (
  inicio timestamptz primary key
);

-- ---------- Sessões: cancelamento tardio e contestação ----------
alter table public.sessoes
  add column if not exists cancelamento_tardio boolean not null default false,
  add column if not exists contestacao_resolvida text check (contestacao_resolvida in ('aceita', 'recusada')),
  add column if not exists cancelada_em timestamptz;

-- Impede duas sessões agendadas no mesmo horário (proteção contra corrida).
create unique index if not exists uq_sessao_horario_agendada
  on public.sessoes (horario) where status = 'agendada';

-- ---------- Segurança ----------
-- Nenhuma tabela é acessível pelo navegador. Todo acesso passa pelas
-- Netlify Functions (service_role), que validam o login da paciente.
alter table public.observacoes_saude enable row level security;
alter table public.slots_abertos enable row level security;

grant all on table public.observacoes_saude, public.slots_abertos to service_role;
