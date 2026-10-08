// Modalidades de atendimento. Cada horário aberto pela Renata tem UMA modalidade.
// Os endereços NÃO ficam no código (o repositório é público): vêm de variáveis
// de ambiente do Netlify, e só aparecem no convite do Google e na área da paciente.
//   ENDERECO_ITAIPU, ENDERECO_BARRA

export const MODALIDADES = {
  online: { nome: 'Online', presencial: false },
  itaipu: { nome: 'Itaipu (Niterói)', presencial: true, env: 'ENDERECO_ITAIPU' },
  barra: { nome: 'Barra da Tijuca (Rio de Janeiro)', presencial: true, env: 'ENDERECO_BARRA' },
};

export const modalidadeValida = (m) => typeof m === 'string' && Object.prototype.hasOwnProperty.call(MODALIDADES, m);
export const ePresencial = (m) => Boolean(MODALIDADES[m]?.presencial);

// Texto de local da sessão presencial: "Consultório Intus — Itaipu (Niterói), <endereço>".
export function localDaSessao(m) {
  const u = MODALIDADES[m];
  if (!u?.presencial) return null;
  const endereco = (process.env[u.env] || '').trim();
  return ['Consultório Intus — ' + u.nome, endereco].filter(Boolean).join(', ');
}
