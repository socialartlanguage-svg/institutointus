// Lista pública dos próximos eventos/palestras da Renata (site/agenda.html).
// Só leitura; quem cadastra é a Renata, pelo painel (admin.mjs).
import { db, json, erro } from '../lib/comum.mjs';

export default async (req) => {
  if (req.method !== 'GET') return erro('Método não permitido', 405);
  try {
    // Mantém o evento na lista até 3h depois do início.
    const desde = new Date(Date.now() - 3 * 3600e3).toISOString();
    const { data, error } = await db().from('eventos')
      .select('id, titulo, data_hora, local, descricao, link')
      .gte('data_hora', desde).order('data_hora').limit(50);
    if (error) throw error;
    return new Response(JSON.stringify({ eventos: data || [] }), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60' },
    });
  } catch (e) {
    console.error('Erro em eventos.mjs:', e);
    return erro('Não foi possível carregar a agenda agora.', 500);
  }
};
