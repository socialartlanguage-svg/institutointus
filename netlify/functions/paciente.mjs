// API da área da paciente. Todas as chamadas: POST { acao, ... } com
// "Authorization: Bearer <token do login>". O banco nunca é acessado direto
// pelo navegador — só por aqui, depois de validar quem é a paciente.

import {
  db, json, erro, pacienteDoToken, slotValido, fimDoCiclo, horasAte, pacoteAtivo,
  usoDoPacote, horariosLivres, ANTECEDENCIA_AGENDAR_H, ANTECEDENCIA_CANCELAR_H, SEMANAS_VISIVEIS,
} from '../lib/comum.mjs';
import * as google from '../lib/google.mjs';

const MAX_TEXTO = 2000;
const texto = (v) => (typeof v === 'string' ? v.trim().slice(0, MAX_TEXTO) : null) || null;

const sessaoPublica = (s) => ({
  id: s.id,
  horario: new Date(s.horario).toISOString(),
  status: s.status,
  link_meet: s.link_meet,
  cancelamento_tardio: s.cancelamento_tardio,
  contestacao_resolvida: s.contestacao_resolvida,
  motivo_contestacao: s.motivo_contestacao,
});

// Sessão que pertence a esta paciente (via pacote), ou null.
async function minhaSessao(paciente, id) {
  if (!id) return null;
  const { data } = await db()
    .from('sessoes')
    .select('*, pacotes!inner(paciente_id)')
    .eq('id', id)
    .eq('pacotes.paciente_id', paciente.id)
    .maybeSingle();
  return data || null;
}

async function validarNovoHorario(pacote, iso) {
  const d = slotValido(iso);
  if (!d) return { erro: 'Horário inválido.' };
  if (horasAte(d) < ANTECEDENCIA_AGENDAR_H) {
    return { erro: `É preciso marcar com pelo menos ${ANTECEDENCIA_AGENDAR_H}h de antecedência.` };
  }
  if (d > fimDoCiclo(pacote.inicio_ciclo_atual)) {
    return { erro: 'Esse horário está fora do período do seu pacote atual.' };
  }
  const { data: aberto } = await db().from('slots_abertos').select('inicio').eq('inicio', d.toISOString()).maybeSingle();
  if (!aberto) return { erro: 'Esse horário não está disponível.' };
  return { d };
}

const acoes = {
  async me(paciente) {
    const pacote = await pacoteAtivo(paciente.id);
    const { data: pacotes } = await db().from('pacotes').select('id').eq('paciente_id', paciente.id);
    const ids = (pacotes || []).map((p) => p.id);
    let sessoes = [];
    if (ids.length) {
      const { data } = await db().from('sessoes').select('*').in('pacote_id', ids).order('horario');
      sessoes = (data || []).map(sessaoPublica);
    }
    const { data: observacoes } = await db().from('observacoes_saude').select('*').eq('paciente_id', paciente.id).maybeSingle();
    return json({
      paciente: {
        nome: paciente.nome, email: paciente.email, whatsapp: paciente.whatsapp,
        trocou_senha: paciente.trocou_senha, consentimento_saude_em: paciente.consentimento_saude_em,
      },
      pacote: pacote ? { ...(await usoDoPacote(pacote)), ate: fimDoCiclo(pacote.inicio_ciclo_atual).toISOString() } : null,
      sessoes,
      observacoes: observacoes || null,
      antecedencia_cancelar_h: ANTECEDENCIA_CANCELAR_H,
    });
  },

  async trocou_senha(paciente) {
    await db().from('pacientes').update({ trocou_senha: true }).eq('id', paciente.id);
    return json({ ok: true });
  },

  async observacoes(paciente, c) {
    if (!paciente.consentimento_saude_em) {
      if (c.consentimento !== true) return erro('É preciso autorizar o uso dessas informações para salvar.');
      await db().from('pacientes').update({ consentimento_saude_em: new Date().toISOString() }).eq('id', paciente.id);
    }
    const linha = {
      paciente_id: paciente.id,
      toma_medicacao: typeof c.toma_medicacao === 'boolean' ? c.toma_medicacao : null,
      medicacoes: texto(c.medicacoes),
      tem_psiquiatra: typeof c.tem_psiquiatra === 'boolean' ? c.tem_psiquiatra : null,
      psiquiatra: texto(c.psiquiatra),
      outras_observacoes: texto(c.outras_observacoes),
      atualizado_em: new Date().toISOString(),
    };
    const { error } = await db().from('observacoes_saude').upsert(linha, { onConflict: 'paciente_id' });
    if (error) throw error;
    return json({ ok: true });
  },

  async horarios(paciente, c) {
    const pacote = await pacoteAtivo(paciente.id);
    if (!pacote) return json({ horarios: [], motivo: 'sem_pacote' });
    if (!c.reagendar) {
      const uso = await usoDoPacote(pacote);
      if (uso.restantes <= 0) return json({ horarios: [], motivo: 'sem_sessoes' });
    }
    const de = new Date(Date.now() + ANTECEDENCIA_AGENDAR_H * 3600e3);
    const limite = new Date(Date.now() + SEMANAS_VISIVEIS * 7 * 86400e3);
    const ate = new Date(Math.min(limite.getTime(), fimDoCiclo(pacote.inicio_ciclo_atual).getTime()));
    return json({ horarios: await horariosLivres(de, ate) });
  },

  async agendar(paciente, c) {
    const pacote = await pacoteAtivo(paciente.id);
    if (!pacote) return erro('Você não tem um pacote ativo.', 403);
    const uso = await usoDoPacote(pacote);
    if (uso.restantes <= 0) return erro('Você já usou todas as sessões deste pacote.');
    const v = await validarNovoHorario(pacote, c.inicio);
    if (v.erro) return erro(v.erro);

    // Reserva primeiro (o índice único impede duas pessoas no mesmo horário).
    const { data: sessao, error } = await db()
      .from('sessoes')
      .insert({ pacote_id: pacote.id, horario: v.d.toISOString(), status: 'agendada' })
      .select()
      .single();
    if (error) {
      if (error.code === '23505') return erro('Esse horário acabou de ser reservado. Escolha outro.', 409);
      throw error;
    }
    const ev = await google.criarEvento({ inicio: v.d, emailPaciente: paciente.email });
    if (ev) {
      await db().from('sessoes').update({ google_event_id: ev.id, link_meet: ev.link }).eq('id', sessao.id);
    }
    return json({ ok: true, link_meet: ev?.link || null });
  },

  async cancelar(paciente, c) {
    const s = await minhaSessao(paciente, c.sessao_id);
    if (!s || s.status !== 'agendada') return erro('Sessão não encontrada.', 404);
    const d = new Date(s.horario);
    if (horasAte(d) <= 0) return erro('Essa sessão já passou.');
    const tardio = horasAte(d) < ANTECEDENCIA_CANCELAR_H;
    await db().from('sessoes')
      .update({ status: 'cancelada', cancelamento_tardio: tardio, cancelada_em: new Date().toISOString() })
      .eq('id', s.id);
    await google.apagarEvento(s.google_event_id);
    return json({ ok: true, tardio });
  },

  async reagendar(paciente, c) {
    const s = await minhaSessao(paciente, c.sessao_id);
    if (!s || s.status !== 'agendada') return erro('Sessão não encontrada.', 404);
    if (horasAte(new Date(s.horario)) < ANTECEDENCIA_CANCELAR_H) {
      return erro(`Só é possível reagendar com ${ANTECEDENCIA_CANCELAR_H}h ou mais de antecedência.`);
    }
    const pacote = await pacoteAtivo(paciente.id);
    if (!pacote) return erro('Você não tem um pacote ativo.', 403);
    const v = await validarNovoHorario(pacote, c.inicio);
    if (v.erro) return erro(v.erro);
    const { error } = await db().from('sessoes').update({ horario: v.d.toISOString() }).eq('id', s.id);
    if (error) {
      if (error.code === '23505') return erro('Esse horário acabou de ser reservado. Escolha outro.', 409);
      throw error;
    }
    await google.moverEvento(s.google_event_id, v.d);
    return json({ ok: true });
  },

  async contestar(paciente, c) {
    const s = await minhaSessao(paciente, c.sessao_id);
    if (!s || s.status !== 'cancelada' || !s.cancelamento_tardio || s.contestacao_resolvida) {
      return erro('Essa sessão não pode ser contestada.', 404);
    }
    const motivo = texto(c.motivo);
    if (!motivo || motivo.length < 10) return erro('Conte brevemente o que aconteceu (mínimo de 10 caracteres).');
    await db().from('sessoes').update({ status: 'contestada', motivo_contestacao: motivo }).eq('id', s.id);
    return json({ ok: true });
  },
};

export default async (req) => {
  if (req.method !== 'POST') return erro('Método não permitido', 405);
  let corpo;
  try { corpo = await req.json(); } catch { return erro('JSON inválido'); }
  try {
    const paciente = await pacienteDoToken(req);
    if (!paciente) return erro('Sessão inválida. Entre novamente.', 401);
    const acao = acoes[corpo.acao];
    if (!acao) return erro('Ação desconhecida');
    return await acao(paciente, corpo);
  } catch (e) {
    console.error('Erro em paciente.mjs:', e);
    return erro('Algo deu errado. Tente de novo em instantes.', 500);
  }
};
