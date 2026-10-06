// Acesso da paciente: login (Supabase Auth, via API REST) e chamadas ao backend.
// A URL e a chave "anon" são públicas por desenho — quem protege os dados é o
// backend (Netlify Functions), que valida o login antes de qualquer coisa.
var Intus = (function () {
  var SUPABASE_URL = 'https://pqogiaufhosgimsncxap.supabase.co';
  var SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxb2dpYXVmaG9zZ2ltc25jeGFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA3ODcyNzUsImV4cCI6MjEwNjM2MzI3NX0.VA1_Y3S5IL_2L5mlIIABZcT9wFJ1LJVIL3aDVXR56JA';
  var CHAVE = 'intus_sessao';
  var TZ = 'America/Sao_Paulo';

  function ler() {
    try { return JSON.parse(localStorage.getItem(CHAVE)); } catch (e) { return null; }
  }
  function guardar(s) {
    try { localStorage.setItem(CHAVE, JSON.stringify(s)); } catch (e) {}
  }
  function limpar() {
    try { localStorage.removeItem(CHAVE); } catch (e) {}
  }

  function auth(caminho, opcoes) {
    opcoes = opcoes || {};
    opcoes.headers = Object.assign({ apikey: SUPABASE_ANON, 'Content-Type': 'application/json' }, opcoes.headers || {});
    return fetch(SUPABASE_URL + '/auth/v1' + caminho, opcoes).then(function (r) {
      return r.json().then(function (d) { return { ok: r.ok, status: r.status, data: d }; });
    });
  }

  function montarSessao(d) {
    return { access_token: d.access_token, refresh_token: d.refresh_token, expira_em: Date.now() + d.expires_in * 1000 };
  }

  function entrar(email, senha) {
    return auth('/token?grant_type=password', {
      method: 'POST',
      body: JSON.stringify({ email: email, password: senha })
    }).then(function (r) {
      if (!r.ok) throw new Error('E-mail ou senha incorretos.');
      guardar(montarSessao(r.data));
    });
  }

  // Devolve um token válido (renovando se estiver perto de vencer) ou null.
  function token() {
    var s = ler();
    if (!s) return Promise.resolve(null);
    if (s.expira_em - Date.now() > 60000) return Promise.resolve(s.access_token);
    return auth('/token?grant_type=refresh_token', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: s.refresh_token })
    }).then(function (r) {
      if (!r.ok) { limpar(); return null; }
      guardar(montarSessao(r.data));
      return r.data.access_token;
    });
  }

  function trocarSenha(nova) {
    return token().then(function (t) {
      if (!t) throw new Error('Sessão expirada. Entre novamente.');
      return auth('/user', { method: 'PUT', headers: { Authorization: 'Bearer ' + t }, body: JSON.stringify({ password: nova }) });
    }).then(function (r) {
      if (!r.ok) throw new Error((r.data && (r.data.msg || r.data.message)) || 'Não foi possível trocar a senha.');
    });
  }

  function api(acao, dados) {
    return token().then(function (t) {
      if (!t) { var e = new Error('Sessão expirada. Entre novamente.'); e.sessaoExpirada = true; throw e; }
      return fetch('/.netlify/functions/paciente', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + t },
        body: JSON.stringify(Object.assign({ acao: acao }, dados || {}))
      });
    }).then(function (r) {
      return r.json().then(function (d) {
        if (r.status === 401) { limpar(); var e = new Error(d.erro); e.sessaoExpirada = true; throw e; }
        if (!r.ok) throw new Error(d.erro || 'Algo deu errado.');
        return d;
      });
    });
  }

  function sair() { limpar(); }
  function logado() { return Boolean(ler()); }

  // ---------- formatação (sempre no horário de Brasília) ----------
  function dia(iso) {
    var t = new Date(iso).toLocaleDateString('pt-BR', { timeZone: TZ, weekday: 'long', day: '2-digit', month: 'long' });
    return t.charAt(0).toUpperCase() + t.slice(1); // "Sexta-feira, 09 de outubro"
  }
  function hora(iso) {
    return new Date(iso).toLocaleTimeString('pt-BR', { timeZone: TZ, hour: '2-digit', minute: '2-digit' });
  }
  function chaveDia(iso) { // YYYY-MM-DD no horário de Brasília
    return new Date(iso).toLocaleDateString('en-CA', { timeZone: TZ });
  }

  return { entrar: entrar, sair: sair, logado: logado, token: token, trocarSenha: trocarSenha, api: api, dia: dia, hora: hora, chaveDia: chaveDia };
})();
