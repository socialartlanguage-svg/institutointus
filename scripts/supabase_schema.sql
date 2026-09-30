-- Instituto Intus — estrutura inicial do banco (Supabase / Postgres)
-- Rodar no SQL Editor do Supabase (projeto intus-agendamento), de uma vez.
--
-- Cobre: pacientes, pacotes mensais e sessões agendadas.
-- A ficha de triagem em si continua no Netlify Forms por enquanto —
-- aqui só entra o paciente depois que o pacote é confirmado.

-- ---------- Extensão para gerar IDs ----------
create extension if not exists "pgcrypto";

-- ---------- Pacientes ----------
create table if not exists pacientes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  email text not null unique,
  whatsapp text not null,
  criado_em timestamptz not null default now()
);

-- ---------- Pacotes mensais ----------
-- Um pacote = um ciclo de cobrança recorrente do InfinitePay (4 sessões).
create type status_pacote as enum ('ativo', 'cancelado', 'inadimplente');

create table if not exists pacotes (
  id uuid primary key default gen_random_uuid(),
  paciente_id uuid not null references pacientes(id) on delete cascade,
  status status_pacote not null default 'ativo',
  sessoes_por_ciclo integer not null default 4,
  infinitepay_referencia text, -- preencher quando tivermos webhook/API confirmada
  inicio_ciclo_atual date not null default current_date,
  criado_em timestamptz not null default now()
);

create index if not exists idx_pacotes_paciente on pacotes(paciente_id);

-- ---------- Sessões agendadas ----------
create type status_sessao as enum ('agendada', 'cancelada', 'realizada', 'contestada');

create table if not exists sessoes (
  id uuid primary key default gen_random_uuid(),
  pacote_id uuid not null references pacotes(id) on delete cascade,
  horario timestamptz not null,
  status status_sessao not null default 'agendada',
  google_event_id text,       -- ID do evento no Google Calendar (para editar/cancelar depois)
  link_meet text,
  motivo_contestacao text,    -- preenchido quando a paciente contesta um cancelamento
  criado_em timestamptz not null default now()
);

create index if not exists idx_sessoes_pacote on sessoes(pacote_id);
create index if not exists idx_sessoes_horario on sessoes(horario);

-- ---------- Row Level Security ----------
-- Por padrão, ninguém acessa nada pelas chaves públicas (anon/authenticated).
-- Todo acesso de escrita/leitura sensível passa pela Netlify Function,
-- que usa a service_role key (ignora RLS) no backend — nunca pelo navegador.
alter table pacientes enable row level security;
alter table pacotes enable row level security;
alter table sessoes enable row level security;

-- Nenhuma policy criada ainda = acesso público bloqueado por padrão.
-- Quando o login da paciente (Fase 3) estiver pronto, criamos policies
-- do tipo "uma paciente só vê os próprios dados" usando auth.uid().
