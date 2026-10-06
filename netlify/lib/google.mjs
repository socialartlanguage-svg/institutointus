// Google Calendar + Meet, usando a conta técnica socialartlanguage@gmail.com.
//
// Variável de ambiente GOOGLE_OAUTH_JSON (secreta), um JSON com:
//   { "client_id": "...", "client_secret": "...", "refresh_token": "..." }
//
// Se a variável não existir ou o Google falhar, as funções devolvem null e a
// sessão é gravada mesmo assim (sem link do Meet) — o painel da Renata avisa.

const RENATA_EMAIL = process.env.RENATA_EMAIL || 'renata.institutointus@gmail.com';
const TZ = 'America/Sao_Paulo';
let cache = null;

async function accessToken() {
  const raw = process.env.GOOGLE_OAUTH_JSON;
  if (!raw) return null;
  if (cache && cache.exp > Date.now() + 60_000) return cache.token;
  const c = JSON.parse(raw);
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: c.client_id,
      client_secret: c.client_secret,
      refresh_token: c.refresh_token,
      grant_type: 'refresh_token',
    }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(`Google token: ${j.error_description || j.error}`);
  cache = { token: j.access_token, exp: Date.now() + j.expires_in * 1000 };
  return cache.token;
}

async function chamar(metodo, caminho, corpo) {
  const token = await accessToken();
  if (!token) return null;
  const r = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events${caminho}`, {
    method: metodo,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: corpo ? JSON.stringify(corpo) : undefined,
  });
  if (r.status === 204) return {};
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`Google Calendar ${r.status}: ${j.error?.message || ''}`);
  return j;
}

const fimDe = (inicio) => new Date(inicio.getTime() + 60 * 60_000);

export async function criarEvento({ inicio, emailPaciente }) {
  try {
    const ev = await chamar('POST', '?conferenceDataVersion=1&sendUpdates=all', {
      summary: 'Sessão — Instituto Intus',
      description: 'Sessão de acompanhamento psicológico com Renata Soares. O link da videochamada está neste convite.',
      start: { dateTime: inicio.toISOString(), timeZone: TZ },
      end: { dateTime: fimDe(inicio).toISOString(), timeZone: TZ },
      attendees: [{ email: emailPaciente }, { email: RENATA_EMAIL }],
      conferenceData: {
        createRequest: { requestId: crypto.randomUUID(), conferenceSolutionKey: { type: 'hangoutsMeet' } },
      },
    });
    if (!ev) return null;
    return { id: ev.id, link: ev.hangoutLink || null };
  } catch (e) {
    console.error('Falha ao criar evento no Google Calendar:', e.message);
    return null;
  }
}

export async function moverEvento(eventId, inicio) {
  if (!eventId) return;
  try {
    await chamar('PATCH', `/${eventId}?sendUpdates=all`, {
      start: { dateTime: inicio.toISOString(), timeZone: TZ },
      end: { dateTime: fimDe(inicio).toISOString(), timeZone: TZ },
    });
  } catch (e) {
    console.error('Falha ao mover evento:', e.message);
  }
}

export async function apagarEvento(eventId) {
  if (!eventId) return;
  try {
    await chamar('DELETE', `/${eventId}?sendUpdates=all`);
  } catch (e) {
    console.error('Falha ao apagar evento:', e.message);
  }
}
