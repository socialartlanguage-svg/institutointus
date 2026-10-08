// Utilidades compartilhadas pelas Netlify Functions (paciente.mjs e admin.mjs).
import { createClient } from '@supabase/supabase-js';
import { timingSafeEqual } from 'node:crypto';

// ---------- Regras de negócio (ajustar aqui) ----------
export const PRIMEIRA_HORA = 7;          // primeira sessão do dia começa às 7h
export const ULTIMA_HORA_INICIO = 19;    // última começa às 19h (termina às 20h)
export const DURACAO_MIN = 60;
export const ANTECEDENCIA_AGENDAR_H = 12; // não dá para marcar com menos de 12h
export const ANTECEDENCIA_CANCELAR_H = 24; // cancelar/reagendar grátis com 24h+
export const SEMANAS_VISIVEIS = 8;
const OFFSET_H = -3; // Brasil (sem horário de verão desde 2019)

// ---------- Banco ----------
let _db;
export function db() {
  if (!_db) {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase não configurado');
    }
    _db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return _db;
}

// ---------- Respostas ----------
export const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
export const erro = (mensagem, status = 400) => json({ erro: mensagem }, status);

// ---------- Autenticação ----------
export function senhaAdminOk(req) {
  const enviada = req.headers.get('x-admin-secret') || '';
  const real = process.env.ADMIN_SECRET || '';
  if (!real || !enviada) return false;
  const a = Buffer.from(enviada);
  const b = Buffer.from(real);
  return a.length === b.length && timingSafeEqual(a, b);
}

// Valida o token de login da paciente (emitido pelo Supabase Auth) e devolve
// o registro dela em `pacientes`, ou null.
export async function pacienteDoToken(req) {
  const auth = req.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token) return null;
  const { data, error } = await db().auth.getUser(token);
  if (error || !data?.user) return null;
  const { data: paciente } = await db()
    .from('pacientes')
    .select('*')
    .eq('auth_user_id', data.user.id)
    .maybeSingle();
  return paciente || null;
}

// ---------- Datas (horário de Brasília) ----------
export function local(d) {
  const s = new Date(d.getTime() + OFFSET_H * 3600e3);
  return {
    ano: s.getUTCFullYear(), mes: s.getUTCMonth() + 1, dia: s.getUTCDate(),
    hora: s.getUTCHours(), min: s.getUTCMinutes(), seg: s.getUTCSeconds(),
    dow: s.getUTCDay(), // 0 = domingo
  };
}

// Aceita só horas cheias, de segunda a sexta, entre 7h e 19h (início).
export function slotValido(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return null;
  const l = local(d);
  if (l.min !== 0 || l.seg !== 0 || d.getUTCMilliseconds() !== 0) return null;
  if (l.dow < 1 || l.dow > 5) return null;
  if (l.hora < PRIMEIRA_HORA || l.hora > ULTIMA_HORA_INICIO) return null;
  return d;
}

// O ciclo do pacote vai de `inicio_ciclo_atual` até 1 mês depois, mais 7 dias de folga.
export function fimDoCiclo(inicioCiclo) {
  const d = new Date(`${inicioCiclo}T00:00:00-03:00`);
  d.setUTCMonth(d.getUTCMonth() + 1);
  return new Date(d.getTime() + 7 * 86400e3);
}

export const horasAte = (d) => (d.getTime() - Date.now()) / 3600e3;

// ---------- Pacote e cota ----------
// Conta como "usada": agendada, realizada, contestada (aguardando decisão)
// e cancelada tardiamente (a regra do Intus diz que vale como sessão feita).
export const contaComoUsada = (s) =>
  ['agendada', 'contestada', 'realizada'].includes(s.status) ||
  (s.status === 'cancelada' && s.cancelamento_tardio);

export async function pacoteAtivo(pacienteId) {
  const { data } = await db()
    .from('pacotes')
    .select('*')
    .eq('paciente_id', pacienteId)
    .eq('status', 'ativo')
    .order('criado_em', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data || null;
}

export async function usoDoPacote(pacote) {
  const { data } = await db()
    .from('sessoes')
    .select('status, cancelamento_tardio')
    .eq('pacote_id', pacote.id);
  const usadas = (data || []).filter(contaComoUsada).length;
  return { total: pacote.sessoes_por_ciclo, usadas, restantes: Math.max(0, pacote.sessoes_por_ciclo - usadas) };
}

// Horários livres: abertos pela Renata, sem sessão agendada, dentro de [de, ate].
export async function horariosLivres(de, ate) {
  const { data: abertos, error } = await db()
    .from('slots_abertos')
    .select('inicio, modalidade')
    .gte('inicio', de.toISOString())
    .lte('inicio', ate.toISOString())
    .order('inicio');
  if (error) throw error;
  const { data: ocupados } = await db()
    .from('sessoes')
    .select('horario')
    .eq('status', 'agendada')
    .gte('horario', de.toISOString())
    .lte('horario', ate.toISOString());
  const tomados = new Set((ocupados || []).map((o) => new Date(o.horario).getTime()));
  return (abertos || [])
    .map((a) => ({ d: new Date(a.inicio), modalidade: a.modalidade }))
    .filter((a) => !tomados.has(a.d.getTime()))
    .map((a) => ({ inicio: a.d.toISOString(), modalidade: a.modalidade }));
}
