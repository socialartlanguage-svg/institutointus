// Cadastro de pacientes que já são atendidas pela Renata, pelo link secreto
// (/cadastro.html?c=TOKEN) que ela envia. Quem se cadastra escolhe o próprio e-mail
// e senha, mas entra SEM pacote ativo: só consegue agendar depois que a Renata liberar
// o pacote (e o número de sessões) no painel. O link pode ser trocado a qualquer hora.

import { db, json, erro } from '../lib/comum.mjs';

const EMAIL_OK = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default async (req) => {
  if (req.method !== 'POST') return erro('Método não permitido', 405);
  let c;
  try { c = await req.json(); } catch { return erro('JSON inválido'); }
  try {
    if (c.website) return json({ ok: true }); // armadilha para robôs: campo escondido preenchido

    const token = typeof c.token === 'string' ? c.token : '';
    const { data: convite } = token
      ? await db().from('convites_cadastro').select('id').eq('token', token).eq('ativo', true).maybeSingle()
      : { data: null };
    if (!convite) return erro('Este link de cadastro não está mais valendo. Peça um novo à Renata.', 403);

    const nome = String(c.nome || '').trim().replace(/\s+/g, ' ');
    const email = String(c.email || '').trim().toLowerCase();
    const whatsapp = String(c.whatsapp || '').trim();
    const senha = String(c.senha || '');
    if (nome.length < 3 || nome.length > 120) return erro('Digite o seu nome completo.');
    if (!EMAIL_OK.test(email) || email.length > 160) return erro('Digite um e-mail válido.');
    if (whatsapp.replace(/\D/g, '').length < 10) return erro('Digite o seu WhatsApp com DDD.');
    if (senha.length < 8 || senha.length > 72) return erro('A senha precisa ter de 8 a 72 caracteres.');

    const { data: existente } = await db().from('pacientes').select('id, auth_user_id').eq('email', email).maybeSingle();
    if (existente?.auth_user_id) return erro('Este e-mail já tem cadastro. Entre pela área do paciente.', 409);

    const { data: criado, error: erroAuth } = await db().auth.admin.createUser({ email, password: senha, email_confirm: true });
    if (erroAuth) {
      if (/already|registered|exists/i.test(erroAuth.message)) return erro('Este e-mail já tem cadastro. Entre pela área do paciente.', 409);
      throw erroAuth;
    }
    const { error } = await db().from('pacientes').upsert(
      { nome, email, whatsapp, auth_user_id: criado.user.id, trocou_senha: true },
      { onConflict: 'email' }
    );
    if (error) {
      await db().auth.admin.deleteUser(criado.user.id); // não deixa login órfão
      throw error;
    }
    return json({ ok: true });
  } catch (e) {
    console.error('Erro em cadastro.mjs:', e);
    return erro('Não foi possível concluir o cadastro agora. Tente de novo em instantes.', 500);
  }
};
