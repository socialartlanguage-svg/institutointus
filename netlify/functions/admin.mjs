// API do painel interno (site/admin.html). POST { acao, ... } com o header
// "x-admin-secret" = ADMIN_SECRET. Usada pela Renata/agência, nunca pelas pacientes.

import { randomInt } from 'node:crypto';
import {
  db, json, erro, senhaAdminOk, slotValido, contaComoUsada,
} from '../lib/comum.mjs';
import * as google from '../lib/google.mjs';

const ALFABETO = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sem 0/O/1/l/I
const gerarSenha = () => Array.from({ length: 10 }, () => ALFABETO[randomInt(ALFABETO.length)]).join('');

// Cria (ou redefine) o login no Supabase Auth e devolve a senha provisória.
async function definirSenhaProvisoria(paciente) {
  const senha = gerarSenha();
  const auth = db().auth.admin;
  let userId = paciente.auth_user_id;

  if (!userId) {
    const { data, error } = await auth.createUser({ email: paciente.email, password: senha, email_confirm: true });
    if (error) {
      // Já existe um login com esse e-mail (ex.: criado antes): procura e reaproveita.
      const { data: lista } = await auth.listUsers({ page: 1, perPage: 1000 });
      const existente = lista?.users?.find((u) => u.email?.toLowerCase() === paciente.email.toLowerCase());
      if (!existente) throw error;
      userId = existente.id;
    } else {
      userId = data.user.id;
    }
  }
  const { error: erroSenha } = await auth.updateUserById(userId, { password: senha });
  if (erroSenha) throw erroSenha;
  await db().from('pacientes').update({ auth_user_id: userId, trocou_senha: false }).eq('id', paciente.id);
  return senha;
}

const inicioDaSemana = (iso) => {
  // iso = 'YYYY-MM-DD' (segunda-feira, no horário de Brasília)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso || '')) return null;
  const d = new Date(`${iso}T00:00:00-03:00`);
  return isNaN(d) ? null : d;
};

const acoes = {
  async liberar_pacote(c) {
    const nome = (c.nome || '').trim();
    const email = (c.email || '').trim().toLowerCase();
    const whatsapp = (c.whatsapp || '').trim();
    if (!nome || !email || !whatsapp) return erro('Nome, e-mail e WhatsApp são obrigatórios.');

    const { data: paciente, error } = await db()
      .from('pacientes')
      .upsert({ nome, email, whatsapp }, { onConflict: 'email' })
      .select('*')
      .single();
    if (error) throw error;

    let senha = null;
    if (!paciente.auth_user_id) senha = await definirSenhaProvisoria(paciente);

    const { data: pacote, error: erroPacote } = await db()
      .from('pacotes')
      .insert({ paciente_id: paciente.id, status: 'ativo' })
      .select('id')
      .single();
    if (erroPacote) throw erroPacote;

    return json({ ok: true, paciente_id: paciente.id, pacote_id: pacote.id, email, senha_provisoria: senha });
  },

  async redefinir_senha(c) {
    const { data: paciente } = await db().from('pacientes').select('*').eq('id', c.paciente_id).maybeSingle();
    if (!paciente) return erro('Paciente não encontrada.', 404);
    const senha = await definirSenhaProvisoria(paciente);
    return json({ ok: true, email: paciente.email, senha_provisoria: senha });
  },

  async agenda(c) {
    const ini = inicioDaSemana(c.semana);
    if (!ini) return erro('Semana inválida.');
    const fim = new Date(ini.getTime() + 7 * 86400e3);
    const { data: slots } = await db().from('slots_abertos').select('inicio')
      .gte('inicio', ini.toISOString()).lt('inicio', fim.toISOString());
    const { data: sessoes } = await db().from('sessoes')
      .select('id, horario, status, link_meet, google_event_id, pacotes(pacientes(nome))')
      .eq('status', 'agendada')
      .gte('horario', ini.toISOString()).lt('horario', fim.toISOString())
      .order('horario');
    return json({
      slots: (slots || []).map((s) => new Date(s.inicio).toISOString()),
      sessoes: (sessoes || []).map((s) => ({
        id: s.id,
        horario: new Date(s.horario).toISOString(),
        paciente: s.pacotes?.pacientes?.nome || '—',
        link_meet: s.link_meet,
      })),
      meet_configurado: Boolean(process.env.GOOGLE_OAUTH_JSON),
    });
  },

  async slots(c) {
    const validos = (lista) => (Array.isArray(lista) ? lista : []).slice(0, 300).map(slotValido).filter(Boolean);
    const abrir = validos(c.abrir);
    const fechar = validos(c.fechar);
    if (abrir.length) {
      const { error } = await db().from('slots_abertos')
        .upsert(abrir.map((d) => ({ inicio: d.toISOString() })), { onConflict: 'inicio' });
      if (error) throw error;
    }
    if (fechar.length) {
      const { error } = await db().from('slots_abertos').delete().in('inicio', fechar.map((d) => d.toISOString()));
      if (error) throw error;
    }
    return json({ ok: true });
  },

  async pacientes() {
    const { data: pacientes } = await db().from('pacientes').select('*').order('nome');
    const { data: pacotes } = await db().from('pacotes').select('*').eq('status', 'ativo');
    const { data: sessoes } = await db().from('sessoes').select('pacote_id, status, cancelamento_tardio');
    return json({
      pacientes: (pacientes || []).map((p) => {
        const pacote = (pacotes || []).filter((x) => x.paciente_id === p.id)
          .sort((a, b) => b.criado_em.localeCompare(a.criado_em))[0];
        const usadas = pacote ? (sessoes || []).filter((s) => s.pacote_id === pacote.id && contaComoUsada(s)).length : 0;
        return {
          id: p.id, nome: p.nome, email: p.email, whatsapp: p.whatsapp,
          pacote_ativo: Boolean(pacote), usadas, total: pacote?.sessoes_por_ciclo ?? 0,
        };
      }),
    });
  },

  async paciente(c) {
    const { data: paciente } = await db().from('pacientes').select('*').eq('id', c.id).maybeSingle();
    if (!paciente) return erro('Paciente não encontrada.', 404);
    const { data: observacoes } = await db().from('observacoes_saude').select('*').eq('paciente_id', c.id).maybeSingle();
    const { data: sessoes } = await db().from('sessoes')
      .select('id, horario, status, cancelamento_tardio, contestacao_resolvida, motivo_contestacao, link_meet, pacotes!inner(paciente_id)')
      .eq('pacotes.paciente_id', c.id).order('horario', { ascending: false });
    return json({
      paciente: { id: paciente.id, nome: paciente.nome, email: paciente.email, whatsapp: paciente.whatsapp, consentimento_saude_em: paciente.consentimento_saude_em },
      observacoes: observacoes || null,
      sessoes: (sessoes || []).map(({ pacotes, ...s }) => ({ ...s, horario: new Date(s.horario).toISOString() })),
    });
  },

  async contestacoes() {
    const { data } = await db().from('sessoes')
      .select('id, horario, motivo_contestacao, pacotes(pacientes(nome, whatsapp))')
      .eq('status', 'contestada').order('horario');
    return json({
      contestacoes: (data || []).map((s) => ({
        id: s.id, horario: new Date(s.horario).toISOString(), motivo: s.motivo_contestacao,
        paciente: s.pacotes?.pacientes?.nome || '—', whatsapp: s.pacotes?.pacientes?.whatsapp || '',
      })),
    });
  },

  async decidir_contestacao(c) {
    if (!['aceita', 'recusada'].includes(c.decisao)) return erro('Decisão inválida.');
    const aceita = c.decisao === 'aceita';
    const { error } = await db().from('sessoes')
      .update({ status: 'cancelada', cancelamento_tardio: !aceita, contestacao_resolvida: c.decisao })
      .eq('id', c.sessao_id).eq('status', 'contestada');
    if (error) throw error;
    return json({ ok: true });
  },

  async cancelar_sessao(c) {
    const { data: s } = await db().from('sessoes').select('*').eq('id', c.sessao_id).eq('status', 'agendada').maybeSingle();
    if (!s) return erro('Sessão não encontrada.', 404);
    // Cancelamento feito pela Renata nunca conta como sessão usada.
    await db().from('sessoes')
      .update({ status: 'cancelada', cancelamento_tardio: false, cancelada_em: new Date().toISOString() })
      .eq('id', s.id);
    await google.apagarEvento(s.google_event_id);
    return json({ ok: true });
  },
};

export default async (req) => {
  if (req.method !== 'POST') return erro('Método não permitido', 405);
  if (!senhaAdminOk(req)) return erro('Senha incorreta', 401);
  let corpo;
  try { corpo = await req.json(); } catch { return erro('JSON inválido'); }
  try {
    const acao = acoes[corpo.acao];
    if (!acao) return erro('Ação desconhecida');
    return await acao(corpo);
  } catch (e) {
    console.error('Erro em admin.mjs:', e);
    return erro(`Erro interno: ${e.message || e}`, 500);
  }
};
