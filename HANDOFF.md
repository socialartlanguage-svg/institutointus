# Instituto Intus — Handoff de Projeto

Documento de contexto completo para continuidade do desenvolvimento no Claude Code. Este projeto começou como planejamento de produto/negócio e evoluiu para construção de site. As páginas institucionais já estão prontas; o sistema de paciente (backend) ainda precisa ser construído do zero.

---

## 1. O que é o Instituto Intus

Instituto de psicologia fundado por **Renata Soares**, psicóloga sistêmica (CRP 05/87188), em simbiose com a marca pessoal dela (@renatasoares.ts). O instituto amplia o escopo de atuação dela: antes majoritariamente casamento/família, agora também terapia individual — mantendo o público-núcleo em mulheres e casais, com tom emocional e viés espiritual/cristão (público majoritariamente evangélico).

**Origem do nome:** "Intus" é latim para "dentro, no interior" — remete a introspecção. O nome foi escolhido depois de pesquisa de disponibilidade que descartou várias opções já registradas por outras clínicas no Brasil (Instituto Raiz, Instituto Shalom, Instituto Vínculo, Instituto Restaura — todos ocupados).

**Identidade visual aprovada:**
- Paleta: creme `#E7E0D6`, bege `#CCBFB1`, marrom-marca `#645646`, marrom escuro `#423F35`, quase-preto oliva `#2B2923`, dourado de apoio `#9C8158`
- Tipografia: **Fraunces** (display/serif) + **Inter** (corpo) — via Google Fonts
- Estética: arquitetônica, minimalista, sem fotografia de rosto (diferente da marca pessoal "De Volta a Nós", que usa foto da Renata) — deliberadamente abstrata/editorial
- **Pendente:** o monograma/símbolo da marca ainda não foi definido. Uma primeira tentativa (gerada por IA externa) foi descartada por risco de originalidade/direito autoral não verificável. Foram esboçados 3 conceitos originais (Porta, Dobra, Camadas) — "Dobra" foi o mais bem avaliado, mas nada foi finalizado. Por ora o site usa só a palavra "Intus" em tipografia Fraunces.

**Redes sociais:**
- Instagram institucional: [@institutointus](https://www.instagram.com/institutointus/)
- Instagram pessoal da Renata: [@renatasoares.ts](https://www.instagram.com/renatasoares.ts/)
- WhatsApp: https://wa.me/5521995053169

---

## 2. O que já está pronto: site institucional (frontend estático)

**Estrutura de pastas (a partir de set/2026):** o site publicável fica em `site/` (HTML + `css/` + `js/` + `img/`). `netlify.toml` aponta `publish = "site"` e `functions = "netlify/functions"`. Isso existe para permitir deploy via Git: o Netlify publica só `site/`, e o resto do repositório (HANDOFF, função, config) fica fora do ar.

5 páginas HTML/CSS autocontidas (sem framework, sem build step), na pasta anexa:

| Arquivo | Conteúdo |
|---|---|
| `index.html` | Home — hero, 3 pilares (Individual/Casal/Família), teaser de metodologia, CTA |
| `sobre.html` | Metodologia estendida (abordagem sistêmica, fé e ciência, 3 princípios), credencial da Renata |
| `como-funciona.html` | Passo a passo do processo (6 etapas) + explicação do pacote mensal |
| `contato.html` | Formulário funcional via **Netlify Forms** (`data-netlify="true"`) + WhatsApp/Instagram reais |
| `area-do-paciente.html` | Placeholder honesto — "este espaço está sendo construído", direciona pro WhatsApp |

**Hospedagem:** Netlify, subida manual (drag-and-drop da pasta). O formulário de contato já funciona nativamente assim que publicado — não precisa de backend para isso especificamente.

**O que falta no frontend:** o monograma/símbolo (ver acima), e eventualmente uma página eu venho pensando que pode fazer sentido (blog/conteúdo?) — não decidido ainda.

---

## 3. O problema de negócio original (por que este projeto existe)

Diagnóstico inicial: a Renata não tinha **nenhum processo estruturado** de captação de paciente. Contato acontecia via conversa solta no WhatsApp, sem triagem, sem limite de vaga, sem protocolo — o que provavelmente explica a agenda não estar cheia apesar de ela ter base de audiência relevante (Instagram + grupo de WhatsApp do lançamento do curso "De Volta a Nós").

O objetivo é construir um funil completo: descoberta (Instagram) → site institucional → triagem → proposta → contratação de pacote → agendamento recorrente → sessão.

---

## 4. O fluxo de paciente definido (novo paciente)

**Atualizado em set/2026 — decisão do cliente:** o pagamento deixou de depender da aprovação da Renata. Assim que a ficha é enviada (e a resposta de risco é "não"), o site já redireciona automaticamente para `pagamento.html`, que leva ao checkout do InfinitePay. A Renata lê a ficha e entra em contato **depois** do pagamento, não antes. Isso muda a ordem originalmente combinada (abaixo, mantida como registro histórico) e cria uma implicação de negócio: é possível que alguém pague antes da Renata avaliar se o caso está dentro do escopo dela — se isso acontecer, a política é ela contatar a pessoa e avaliar reembolso caso a caso. **A regra de segurança do item de risco continua absoluta e não foi alterada**: risco = "sim" nunca é redirecionado para pagamento, sempre fica na tela de acolhimento (CVV 188 / SAMU 192).

Ordem originalmente acordada com o cliente (histórico, parcialmente superada pela mudança acima):

1. **Site institucional** ✅ pronto (ver seção 2)
2. **Ficha de triagem com lógica condicional** — ✅ implementada em `contato.html` (Netlify Forms `triagem`) + alerta via Pushover em `netlify/functions/submission-created.mjs`
3. **Cobrança recorrente via InfinitePay** — parcialmente feita. Criada `site/pagamento.html`: página não-listada (fora do menu, `noindex`) com o botão que leva ao checkout hospedado do InfinitePay: https://invoice.infinitepay.io/plans/instituto-intus/oOCIco9V3V (plano renomeado para "instituto-intus" no painel deles). **Fluxo hoje é manual**: a Renata envia esse link por WhatsApp para quem ela aprovou na triagem; não há automação (sem webhook, sem liberação automática de acesso) porque a documentação pública do InfinitePay não confirma API para o produto de assinatura recorrente — só para checkout de pagamento único (`api.checkout.infinitepay.io`). Pedido ao cliente: confirmar com o suporte do InfinitePay se existe API/webhook para "Planos e Assinaturas"; resposta ainda pendente.
4. **Integração com Google Calendar** (geração automática de link do Meet por sessão) — pendente
5. **Lembrete de sessão automático** — pendente
6. **Política de Privacidade / consentimento LGPD** — rascunho em `privacidade.html` + checkbox de consentimento na triagem; **falta revisão jurídica** e os TODOs no HTML
7. **Camada de agendamento com 3 botões** (Cancelar / Reagendar / Contestar cancelamento), regra de 24h, **construída direto no nosso site** (não em ferramenta de terceiro) — pendente
8. **Fluxo de contestação** (formulário + fila de decisão manual da Renata) — pendente
9. Regra de reembolso de 75% na 1ª semana — decidido, mas implementação **adiada** ("depois vamos ver isso")
10. Painel para a Renata ver contestações pendentes — decidido, mas implementação **adiada**

### As 3 perguntas de triagem (conteúdo já definido, aguarda implementação)

1. **"O que te trouxe a buscar terapia agora? O que você gostaria de trabalhar?"** — resposta aberta, dá contexto clínico e ajuda a identificar se o caso está dentro do escopo dela.
2. **"Você já fez terapia antes? Está em acompanhamento psiquiátrico ou faz uso de alguma medicação para saúde mental atualmente?"** — sim/não + campo aberto.
3. **"Nas últimas semanas, você teve pensamentos de se machucar ou de que não vale a pena continuar vivendo?"** — sim/não.

**Regra crítica de segurança:** se a resposta da pergunta 3 for "sim", o fluxo **não pode seguir automaticamente** para pagamento/agendamento. Precisa desviar para uma tela de acolhimento com contato do CVV (188) e gerar alerta de prioridade máxima para a Renata contatar diretamente, fora da fila comercial normal. Isso é requisito não-negociável, não é só "boa prática" — é proteção real para uma situação de risco.

### Regras de negócio do pacote e agendamento (definidas)

- Pacote mensal fixo: **4 sessões por mês**, pagamento antecipado via InfinityPay.
- Cancelamento do pacote na 1ª semana de contrato: devolução de **75%** do valor (implementação adiada, mas regra já está decidida e deve constar nos Termos desde já).
- Agendamento: calendário semanal liberado no site, sincronizado com Google Calendar da Renata, gerando automaticamente um link do Google Meet por sessão marcada.
- **3 botões por sessão agendada:**
  - **Cancelar** — grátis se feito com 24h+ de antecedência; com menos de 24h, a sessão é perdida (cobrada normalmente).
  - **Reagendar** — permitido só com mais de 24h de antecedência.
  - **Contestar cancelamento** — disponível quando o cancelamento foi feito com menos de 24h. Abre um formulário onde o paciente explica a situação excepcional; a Renata recebe isso numa fila e decide manualmente se a sessão é perdida ou não. **Não há critério automático de aprovação ainda definido** — hoje é 100% decisão manual dela.

### Decisão de arquitetura técnica (importante para o Claude Code)

O cliente foi claro: quer um **mix de ferramentas prontas + construção própria**, não uma solução 100% no-code nem 100% customizada.

Foi identificado durante o planejamento que a plataforma de Artifacts do Claude (com capability `db`) **não serve para este caso**, porque seu banco de dados só é acessível para membros de uma mesma organização Claude — pacientes reais do site público não teriam esse acesso. Ou seja: **este sistema precisa de backend real, hospedado fora do ecossistema Claude.**

**Stack recomendada (discutida, não implementada):**
- Frontend: o que já existe (HTML/CSS estático) ou migração para um framework se o Claude Code achar melhor
- Backend: **Netlify Functions** (o próprio Netlify já hospeda o frontend, e suporta funções serverless nativamente — evita ter que gerenciar um servidor separado)
- Banco de dados: **Supabase** sugerido (gratuito para começar, fácil de configurar, dá autenticação pronta se precisar)
- Calendário: **Google Calendar API**, via OAuth server-side. **Decisão (set/2026): a conta técnica é `socialartlanguage@gmail.com`** — ela autoriza a API e cria os eventos/links do Meet; a Renata recebe os eventos como convidada na agenda dela.
  - ✅ **Feito (set/2026):** projeto "Intus Agendamento" criado no Google Cloud (ID `intus-agendamento`, nº 393299877558), Calendar API ativada, Tela de consentimento OAuth configurada (Externo, em modo "Testando", `socialartlanguage@gmail.com` cadastrado como usuário de teste), credenciais OAuth "Intus Backend" (tipo Desktop app) criadas. Autorização feita uma vez via `scripts/google_authorize.py` (venv em `secrets/venv`, não versionado) — token salvo em `secrets/google-token.json` (fora do git). **Testado de ponta a ponta**: criação de evento com link do Meet automático funcionou (`meet.google.com/...` gerado pela API), evento de teste apagado em seguida.
  - **Pendente:** o app OAuth está em modo "Testando" — o token de teste expira em ~7 dias e precisa ser renovado rodando o script de novo, OU publicar o app (Google pede verificação se usar escopos sensíveis, mas `calendar.events` costuma ser considerado escopo não-sensível, verificar). Ainda falta: (1) mover a lógica de criar evento para dentro de uma Netlify Function (hoje só existe como scripts Python locais de teste, não integrado ao site); (2) decidir onde/como renovar o token automaticamente em produção (o refresh_token não expira sozinho, só o access_token de curta duração — o problema dos 7 dias é só enquanto o app estiver em "Testando"); (3) construir a lógica de disponibilidade de horários (ver item 7 do roadmap).
- Pagamento: **InfinityPay**, cobrança recorrente + webhook para confirmar pagamento e liberar agendamento
- Lembretes de sessão: pode ser via cron job na própria função serverless, ou automação simples

Nenhuma dessas integrações foi de fato configurada ainda — só decidida em conversa. Contas em Supabase, Google Cloud e InfinityPay precisam ser criadas pelo cliente (Fernando/Renata), não há acesso a isso no momento.

---

## 5. Fluxo de paciente já existente (retorno)

Mais simples, não passa pela triagem completa de novo:
1. Contato de retorno (paciente procura, ou reativação)
2. Reconexão rápida (o que mudou desde a última vez)
3. Reagendamento direto
4. Retomada, com nota de continuidade do que já foi trabalhado

Este fluxo **não teve nenhum detalhamento técnico ainda** — só a lógica conceitual acima.

---

## 6. Pendências e perguntas em aberto para quem assumir o projeto

- Monograma/símbolo da marca ainda não escolhido (ver seção 1)
- Nenhuma conta de serviço externo (Supabase, Google Cloud, InfinityPay) foi criada ainda
- Critério de aprovação automática de contestação de cancelamento não foi definido (hoje é 100% manual)
- Regra de reembolso de 75% precisa de lógica de cálculo quando sessões do pacote já foram parcialmente usadas (ex: cancelou na 1ª semana mas já usou 2 das 4 sessões) — isso foi levantado como risco mas não resolvido
- Texto de Política de Privacidade / LGPD ainda não foi escrito
- Painel de contestações pendentes para a Renata (visual, conteúdo) não foi desenhado

---

## 7. Outros ativos do mesmo cliente (contexto adicional, não obrigatório para este projeto)

Para quem for continuar: a Renata também tem um produto de curso digital chamado **"De Volta a Nós"** (curso sobre reconexão conjugal, Hotmart, funil de vendas próprio, identidade visual diferente — tons terrosos com foto dela). É uma marca separada do Instituto Intus e não deve ser confundida visualmente nem estruturalmente, embora compartilhem a mesma pessoa fundadora.

---

## 8. Log de continuidade

**Set/2026**
- Repositório git iniciado na pasta.
- `contato.html` virou a ficha de triagem (form `triagem`). Pergunta 2 foi dividida em duas (terapia anterior / acompanhamento psiquiátrico). Pergunta 3 = "sim" → tela de acolhimento (CVV 188, SAMU 192), sem passo comercial.
- `obrigado.html`: fallback sem JavaScript (inclui CVV para todos).
- Alerta: Pushover. Risco = prioridade 2 (emergência, repete até confirmar); demais fichas = prioridade 0. Só nome + WhatsApp vão no alerta.
- Menu mobile (`nav.js`) e link "Privacidade" no rodapé em todas as páginas.
- **Deploy mudou:** funções não sobem por drag-and-drop. É preciso deploy via Git (GitHub → Netlify) ou `netlify deploy`. Variáveis: `PUSHOVER_TOKEN`, `PUSHOVER_USER`.

**Set/2026 — redesign visual**
- **Decisão revista:** o site agora usa fotos da Renata (antes: "sem fotografia de rosto"). Pedido do cliente. A diferenciação da marca "De Volta a Nós" continua pela paleta, tipografia e pelo motivo do arco.
- Motivo de identidade: **o arco** (porta, "dentro"). Fotos em moldura de arco com contorno dourado deslocado, arcos decorativos no fundo, favicon provisório de arco. Não é o monograma final (continua pendente).
- CSS compartilhado em `css/intus.css` (tokens, header, footer, botões, fotos, vídeo, animações). JS comum em `js/site.js` (menu, revelação no scroll, vídeo).
- Fotos: salvar em `img/` com os nomes de `img/LEIA-ME.txt`. Sem o arquivo, aparece moldura com legenda.
- Vídeo: YouTube "Não listado", ID em `js/site.js` → `VIDEO_APRESENTACAO`. Carrega só no clique (youtube-nocookie).
