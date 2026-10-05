// Registra manualmente um paciente + pacote ativo no Supabase, depois que
// a Renata confirma (olhando o painel do InfinitePay) que o pagamento caiu.
//
// Isto é uma ponte temporária: enquanto o InfinitePay não confirmar suporte
// a webhook para o produto de assinatura, não existe forma automática do
// site saber que alguém pagou. Quando isso mudar, uma função de webhook
// substitui este passo manual — o restante do sistema (Calendar, agenda)
// não muda.
//
// Protegida por senha (variável de ambiente ADMIN_SECRET). Chamada pelo
// formulário em site/admin.html, nunca diretamente pelo site público.
//
// Variáveis de ambiente necessárias (Netlify → Site configuration → Environment variables):
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY   (secreta — ignora RLS, só usada aqui no backend)
//   ADMIN_SECRET                (senha da telinha admin, inventada por vocês)

import { createClient } from '@supabase/supabase-js';

export default async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ erro: 'Método não permitido' }), { status: 405 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ erro: 'JSON inválido' }), { status: 400 });
  }

  const { senha, nome, email, whatsapp } = body || {};

  if (!process.env.ADMIN_SECRET || senha !== process.env.ADMIN_SECRET) {
    return new Response(JSON.stringify({ erro: 'Senha incorreta' }), { status: 401 });
  }

  if (!nome || !email || !whatsapp) {
    return new Response(JSON.stringify({ erro: 'Nome, e-mail e WhatsApp são obrigatórios' }), { status: 400 });
  }

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return new Response(JSON.stringify({ erro: 'Backend sem configuração do Supabase' }), { status: 500 });
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  // Paciente: upsert por e-mail (se ela já existia — ex.: renovando —, atualiza os dados e reusa o id).
  const { data: paciente, error: erroPaciente } = await supabase
    .from('pacientes')
    .upsert({ nome, email, whatsapp }, { onConflict: 'email' })
    .select('id')
    .single();

  if (erroPaciente) {
    console.error('Erro ao gravar paciente:', erroPaciente);
    return new Response(JSON.stringify({ erro: 'Falha ao gravar paciente', detalhe: erroPaciente.message }), { status: 500 });
  }

  // Pacote: sempre cria um novo ciclo ativo.
  const { data: pacote, error: erroPacote } = await supabase
    .from('pacotes')
    .insert({ paciente_id: paciente.id, status: 'ativo' })
    .select('id')
    .single();

  if (erroPacote) {
    console.error('Erro ao gravar pacote:', erroPacote);
    return new Response(JSON.stringify({ erro: 'Falha ao gravar pacote', detalhe: erroPacote.message }), { status: 500 });
  }

  return new Response(
    JSON.stringify({ ok: true, paciente_id: paciente.id, pacote_id: pacote.id }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
};
