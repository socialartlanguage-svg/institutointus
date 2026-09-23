// Disparada automaticamente pelo Netlify a cada envio de formulário aprovado pelo filtro de spam.
// Ficha de triagem com risco = "sim" gera alerta de emergência no Pushover (toca até a Renata confirmar).
// As demais geram uma notificação comum.
//
// Variáveis de ambiente (Netlify → Site configuration → Environment variables):
//   PUSHOVER_TOKEN  — token do aplicativo criado em pushover.net/apps
//   PUSHOVER_USER   — user key (ou group key) da Renata

const PUSHOVER_URL = 'https://api.pushover.net/1/messages.json';

export const handler = async (event) => {
  const { payload } = JSON.parse(event.body);
  if (payload.form_name !== 'triagem') return { statusCode: 200 };

  const { nome = '', whatsapp = '', risco } = payload.data;
  const emRisco = risco === 'sim';
  const whatsappLink = `https://wa.me/55${whatsapp.replace(/\D/g, '').replace(/^55(?=\d{10,11}$)/, '')}`;

  // Só nome e contato: as respostas clínicas não saem do Netlify.
  const mensagem = emRisco
    ? {
        title: 'Intus: ficha com sinal de risco',
        message: `${nome} respondeu SIM à pergunta sobre pensamentos de se machucar.\nWhatsApp: ${whatsapp}\nContate diretamente, fora da fila normal.`,
        priority: 2,  // emergência: repete até ser confirmada
        retry: 60,
        expire: 3600,
        sound: 'siren',
      }
    : {
        title: 'Intus: nova ficha de triagem',
        message: `${nome} enviou a ficha. WhatsApp: ${whatsapp}`,
        priority: 0,
      };

  try {
    const res = await fetch(PUSHOVER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: process.env.PUSHOVER_TOKEN,
        user: process.env.PUSHOVER_USER,
        url: whatsappLink,
        url_title: 'Abrir WhatsApp',
        ...mensagem,
      }),
    });
    if (!res.ok) console.error('Pushover recusou a notificação', res.status, await res.text());
  } catch (err) {
    console.error('Falha ao enviar notificação ao Pushover', err);
  }

  return { statusCode: 200 };
};
