# Variáveis de ambiente do Netlify

Cadastrar em: painel do Netlify → site do Intus → **Site configuration → Environment variables**.

As marcadas como "pública" não são segredo (protegidas por RLS/políticas do
Supabase, não por sigilo da chave) — mas ainda assim vivem só nas env vars do
Netlify, nunca hardcoded no HTML/JS público do site.

| Variável | Valor | Segredo? |
|---|---|---|
| `SUPABASE_URL` | `https://pqogiaufhosgimsncxap.supabase.co` | Não |
| `SUPABASE_ANON_KEY` | (chave anon do projeto `intus-agendamento`, ver Supabase → API Keys) | Não, mas mesmo assim só em env var |
| `SUPABASE_SERVICE_ROLE_KEY` | **cadastrar direto no painel do Netlify — nunca passar pelo chat/Claude** | **Sim, secreta** |
| `ADMIN_SECRET` | senha do painel `/admin.html` (já cadastrada; trocar por uma própria) | **Sim** |
| `GOOGLE_OAUTH_JSON` | JSON `{"client_id","client_secret","refresh_token"}` da conta socialartlanguage@gmail.com — liga o Google Meet (pendente) | **Sim** |
| `RENATA_EMAIL` | opcional; e-mail que recebe os convites (padrão: renata.institutointus@gmail.com) | Não |
| `PUSHOVER_TOKEN` | pendente (ver HANDOFF §"alerta de risco") | Sim |
| `PUSHOVER_USER` | pendente | Sim |

## Onde pegar a `SUPABASE_SERVICE_ROLE_KEY`

Supabase → projeto `intus-agendamento` → **API Keys** → a chave listada como
`service_role` (não a `anon`). Essa chave ignora todas as regras de RLS —
é o que dá às Netlify Functions poder de ler/escrever qualquer dado.
**Nunca deve aparecer no código do site, em commits, ou ser enviada pelo chat.**
Copie direto do painel do Supabase e cole direto no painel do Netlify.
