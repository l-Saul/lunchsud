# LunchSud: agendamento de almoço para missionários

Calendário por **ala** onde membros da Igreja de Jesus Cristo dos Santos dos
Últimos Dias agendam o almoço dos missionários, e um **painel** onde os líderes
gerenciam. Feito para o **celular** de senhoras de 45 a 85 anos: letra grande,
alto contraste, poucos passos, sem conta para agendar.

- Produção: https://lunchsud.vercel.app
- Regras para quem mexe no código (pessoas e agentes de IA): [`CLAUDE.md`](CLAUDE.md)
- Documentação por rota e módulo: [`docs/`](docs/) (mapa código → doc no [`CLAUDE.md`](CLAUDE.md))

---

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 16 (App Router, Server Components, route handlers, `proxy.ts`) |
| UI | React 19.2, TypeScript 5 (`strict`), Tailwind CSS 4 (tema em `globals.css`, sem `tailwind.config`) |
| Banco | Supabase Postgres (`sa-east-1`) com RLS e permissões por coluna |
| Auth | Supabase Auth (e-mail + senha) via `@supabase/ssr`, sessão em cookies |
| Tempo real | Supabase Realtime (WebSocket, `postgres_changes`) via `@supabase/realtime-js` |
| Dados no cliente | SWR (só as alas da busca da home) |
| Imagem do mês | `html-to-image` (PNG) + Web Share API |
| E-mail ao líder | `nodemailer` 10 pelo SMTP do Gmail; Vercel Cron diário |
| Hospedagem | Vercel, funções em `gru1` (São Paulo) |
| Node | `>= 20.11` |

Sem framer-motion, sem biblioteca de UI: animações só em CSS.

## Arquitetura

```
 navegador (celular)                         Vercel gru1 (Next.js)                Supabase sa-east-1
 ───────────────────                         ─────────────────────                ──────────────────
 página da ala  ──GET /[slug] (SSR)────────▶ Server Component ──service-role────▶ Postgres
                ──POST /api/agendar────────▶ route handler    ──service-role────▶   (RLS, checks,
                ◀─────── WebSocket (anon, só id/ala_id/data/nome) ──────────────── Realtime  unique)
 painel líder   ──GET /dashboard (SSR)─────▶ proxy.ts (renova sessão) → Server Component
                ──POST /api/... ───────────▶ route handler (getContexto + escopo por ala)
                                                │ after(): novo almoço, pedido para entrar no painel
 Vercel Cron 11:00 UTC ──GET /api/cron/avisos─▶ lembretes e resumos ──SMTP──▶ Gmail ──▶ e-mail do líder
```

- **Toda leitura e escrita passa pelo servidor com o service-role.** O navegador
  só fala direto com o Supabase em dois casos: o **WebSocket do Realtime** (chave
  anon, sem telefone) e o **Supabase Auth** do líder (login, cadastro, senha).
- **Autorização nas rotas**, não na RLS: `getContexto()` resolve papel (owner ou
  member) e ala em foco; toda escrita filtra por `ala_id`.
- **Banco e funções na mesma região** (São Paulo). Com a função nos EUA, cada
  consulta cruzava o continente (~1 s por página).
- **Regras de data no fuso da ala**: o servidor roda em UTC; "hoje", a janela e
  a virada do mês vêm de `getDashboardRange(ala.fuso_horario)`.
- **Avisos por e-mail ao líder**: cada pessoa liga, **por ala**, os avisos que
  quer (tudo vem desligado). O que nasce de uma ação (novo almoço agendado no mês,
  pedido para entrar no painel, pedido aprovado) sai **na hora**, em `after()`, sem a
  resposta esperar; o que depende de olhar o calendário (dia sem almoço,
  almoços do mês seguinte, semana) sai no **cron diário das 8h**. Os avisos só
  informam (sem botão nem link), menos os de pedido para usar o painel. O
  modelo do e-mail fica em `src/lib/server/email/aviso.html`. Fora de produção, todo
  e-mail vai só para `EMAIL_TESTE_PARA`. Detalhes em [`docs/src_lib.md`](docs/src_lib.md).

### Rotas

| Rota | Tipo | Acesso | Dados | Doc |
|---|---|---|---|---|
| `/` | estática + client | público | SWR em `/api/alas` | [home](docs/routes_home.md) |
| `/[slug]` | dinâmica (SSR) | público | ala + dias ocupados da janela; Realtime | [slug](docs/routes_slug.md) |
| `/[slug]/opengraph-image` | imagem (`next/og`) | público | nome da ala → PNG 1200×630 da prévia do link no WhatsApp | [slug](docs/routes_slug.md) |
| `/opengraph-image` | imagem (`next/og`) | público | PNG 1200×630 da prévia do site (home e demais páginas) | [src_app](docs/src_app.md) |
| `/robots.txt`, `/sitemap.xml` | gerados (`robots.ts`, `sitemap.ts`) | público | home indexada; ala `noindex`; liderança e `/api` bloqueadas | [src_app](docs/src_app.md) |
| `/admin` | dinâmica | público (redireciona logado) | Supabase Auth no client | [admin](docs/routes_admin.md) |
| `/acesso` | dinâmica | logado sem ala | vínculo + alas | [acesso](docs/routes_acesso.md) |
| `/redefinir-senha` | dinâmica | sessão do link | e-mail da sessão | [redefinir-senha](docs/routes_redefinir-senha.md) |
| `/auth/confirmar` | route handler | link do e-mail | `verifyOtp` / `exchangeCodeForSession` | [auth-confirmar](docs/routes_auth-confirmar.md) |
| `/dashboard` | dinâmica (SSR) | líder com ala | agendamentos, histórico, usuários, alas | [dashboard](docs/routes_dashboard.md) |
| `/api/*` | route handlers | ver tabela | — | [api](docs/routes_api.md) |

### API

| Método e rota | Acesso | Função |
|---|---|---|
| `POST /api/agendar` | público | cria agendamento (fonte da verdade das regras do membro) |
| `GET /api/agendamentos/[slug]` | público | dias ocupados da janela (ressincronizar) |
| `GET /api/agenda/[slug]?data=` | público | o almoço como arquivo de agenda (`.ics`), para o iPhone |
| `GET /api/alas` | público | alas **ativas** (nome, slug, estado, cidade) para a busca da home |
| `POST /api/alas/pedir` | público | pede ala nova + conta do líder (fica pendente; anti-robô) |
| `POST /api/agendamentos/update` | líder | edita data/nome/telefone (ala em foco) |
| `POST /api/agendamentos/delete` | líder | remove (ala em foco) |
| `POST /api/acesso/solicitar` | logado | pede acesso a uma ala |
| `POST /api/acesso/aprovar` | owner / member aprovado da ala | aprova vínculo |
| `POST /api/acesso/remover` | owner / member aprovado da ala | remove vínculo |
| `POST /api/ala-atual` | owner | troca a ala em foco (cookie `ala_atual`) |
| `POST /api/alas/criar` | owner | cria ala ativa (slug `<uf>_<cidade>_<nome>`, ex. `pr_curitiba_sao-lourenco`) |
| `POST /api/alas/aprovar` | owner | aprova ala pendente (passo 1; o líder é o passo 2) |
| `POST /api/alas/recusar` | owner | recusa e apaga o pedido (e a conta criada nele) |
| `POST /api/avisos/preferencias` | líder (ala em foco) | grava os avisos por e-mail escolhidos para a ala |
| `GET /api/cron/avisos` | Vercel Cron (`CRON_SECRET`) | lembretes e resumos do dia |

Contratos, validações e respostas em [`docs/routes_api.md`](docs/routes_api.md).

## Regras de negócio

1. **Um almoço por dia, por ala** (`unique (ala_id, data)`; a API devolve 409).
2. **Segunda = P-day**: o membro não agenda (`isPday` no calendário, na imagem e
   no `/api/agendar`). O líder pode mover um almoço para segunda.
3. **Janela = mês atual + seguinte**, no fuso da ala; **dia passado** não é
   agendável pelo membro.
4. **Agendar não exige conta**; só líderes fazem login.
5. Painel: "X de Y dias" com `Y = dias do mês − segundas`; histórico só dos **3
   meses anteriores**.
6. Papéis: **owner** (todas as alas, cria alas, troca a ala em foco) e
   **member** (uma ala, depois de aprovado).

Detalhes e onde cada regra é garantida: [`CLAUDE.md`](CLAUDE.md) e `docs/`.

## Banco

Tabelas `ala`, `agendamento`, `perfil` (1:1 com `auth.users`, criado por
trigger, e-mail sincronizado por outro trigger), `ala_membro` (vínculo
usuário↔ala, único por usuário) e, dos avisos por e-mail, `email_preferencia`
(usuário + ala) e `email_envio`. RLS ligada em todas; o navegador só lê `id, ala_id, data, nome` de `agendamento`. Schema
completo, checks, permissões, Realtime, migrations e templates de e-mail:
[`docs/database.md`](docs/database.md). Fonte da verdade: [`supabase/schema.sql`](supabase/schema.sql).

## Segurança

- Entrada de toda rota validada em `src/lib/server/validation.ts` (teto de 10 KB,
  `Content-Type`, formato e charset); erros do banco nunca ecoados.
- Service-role só no servidor (`import 'server-only'` quebra o build se o
  navegador importar).
- Telefone nunca chega ao navegador do membro (permissão por coluna no Postgres).
- Headers de segurança no `next.config.ts` (HSTS, `X-Frame-Options: DENY`,
  `nosniff`, `Referrer-Policy`, `Permissions-Policy`); CSP pendente.
- **Sem limite por IP**: muitas pessoas usam o mesmo IP (Wi-Fi da igreja). Abuso
  se trata no Firewall da Vercel, não travando o usuário.
- Cron protegido por `CRON_SECRET` (fecha se a variável não existir). E-mail
  nunca segura nem desfaz uma ação (`after()`, falha só no log).

---

## Estrutura

```
src/
  app/
    (member)/            /  e  /[slug]                  (grupo de rota: não aparece na URL)
    (leader)/            /admin /acesso /redefinir-senha /dashboard
    api/                 route handlers (URLs em português = contrato)
    auth/confirmar/      link dos e-mails do Supabase Auth
    layout.tsx  globals.css  not-found.tsx  manifest.ts  robots.ts  sitemap.ts
    opengraph-image.tsx  (imagem de prévia do site)
  components/            usados por 2+ páginas (Spinner, Flower, Footer, LoadingOverlay,
                         WardFilter, WardForm, AccountFields, campos e botões padrão)
  hooks/                 use-bookings-realtime (WebSocket)
  lib/                   date, phone, location, wards, site-url, email-preferences, calendar-event,
                         last-ward (última ala aberta no aparelho), share-texts (textos do link)
  lib/server/            public-ward, session, validation, ward-request, (só servidor)
                         mailer, email-templates, notifications, og-image,
                         email/aviso.html (modelo dos avisos por e-mail),
                         og/ (fontes das imagens de prévia, com a licença OFL)
  lib/supabase/          realtime, service-role, browser-session, server-session
  proxy.ts               renova a sessão nas rotas do líder
supabase/
  schema.sql             estrutura completa do banco
  migrations/            só quando há mudança pendente (o usuário roda e apaga)
  email/                 templates dos e-mails do Supabase Auth
docs/                    routes_<rota>.md · src_app/components/hooks/lib.md · database.md
```

Componente de uma página só fica em `_components/` dentro da rota. Cada arquivo
de código diz no cabeçalho qual é o seu doc; o mapa por pasta está no
[`CLAUDE.md`](CLAUDE.md).

## Variáveis de ambiente

| Variável | Onde é usada | Valor |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | navegador + servidor (Auth, Realtime, proxy) | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | navegador + servidor | chave `anon` / publishable |
| `SUPABASE_URL` | servidor (service-role) | a mesma Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | **só servidor** | chave `service_role`. **Nunca exponha** |
| `NEXT_PUBLIC_BASE_URL` | `siteUrl()` / `urlPublica()`: links dos e-mails, `metadataBase`, `robots.txt`, `sitemap.xml` | `https://lunchsud.vercel.app` em produção (sem ela, vale esse mesmo endereço) |
| `GOOGLE_SITE_VERIFICATION` | opcional; `metadata.verification.google` | o código da verificação por meta tag do Google Search Console |
| `GMAIL_USER` | **só servidor** (avisos por e-mail) | conta do Gmail que envia |
| `GMAIL_APP_PASSWORD` | **só servidor** | senha de app do Google (não a senha da conta) |
| `EMAIL_FROM` | opcional | remetente, ex. `"Almoço dos Missionários" <conta@gmail.com>`; padrão: esse nome + `GMAIL_USER` |
| `CRON_SECRET` | **só servidor**; a Vercel envia no cron | texto aleatório longo (ex. `openssl rand -hex 32`). Sem ela o cron recusa tudo |
| `EMAIL_TESTE_PARA` | **só fora de produção** (local, preview) | seu e-mail: todo aviso vai só para ele. Sem ela, nada é enviado fora de produção |

Arquivos `.env*` são ignorados pelo git.

**Atenção:** o `.env` local aponta para o banco de **produção**. Agendar no
`npm run dev` grava numa ala real e aparece ao vivo para os líderes.

## Rodar localmente

Pré-requisitos: Node 20.11+, um projeto no Supabase e (para publicar) conta na Vercel.

1. **Instalar**
   ```bash
   git clone https://github.com/<usuario>/lunchsud.git && cd lunchsud
   npm install
   ```
2. **Banco**: no SQL Editor do Supabase, rode **todo** o
   [`supabase/schema.sql`](supabase/schema.sql) (tabelas, trigger, RLS,
   permissões e Realtime).
3. **Auth**: em *Authentication*, ligue o provider **Email** e **desligue
   "Confirm email"** (o líder é aprovado por outro líder, não pelo e-mail); em
   *URL Configuration*, defina **Site URL** = `http://localhost:3000` e a mesma
   URL em **Redirect URLs**. Cole os templates de `supabase/email/` em *Email
   Templates* e configure um **SMTP próprio** em *Emails → SMTP Settings*.
4. **Variáveis**: crie `.env.local` com as variáveis da tabela acima
   (*Project Settings → API*).
5. **Rodar**
   ```bash
   npm run dev          # http://localhost:3000
   ```
6. **Virar owner**: cadastre-se em `/admin` e rode no SQL Editor:
   ```sql
   update public.perfil set is_owner = true where email = 'voce@exemplo.com';
   ```
   No `/dashboard`, crie as alas. O link público `/<slug>` é o que vai para o
   grupo do WhatsApp.

## Scripts e qualidade

| Comando | O que faz |
|---|---|
| `npm run dev` | servidor de desenvolvimento |
| `npm run build` | build de produção |
| `npm run start` | serve o build |
| `npm run lint` | `eslint src` (o `next lint` saiu no Next 16) |
| `npx tsc --noEmit` | checagem de tipos |

Antes de concluir uma mudança: `npx tsc --noEmit`, `npm run lint` (hoje: 0
erros, 0 avisos) e `npm run build`. **Nunca rode `build` com o `dev` aberto**:
os dois disputam a pasta `.next` e corrompem o cache (`ENOENT …
build-manifest.json`).

## Deploy

- **Branches:** `master` = produção (Vercel), `dev` = desenvolvimento. Código
  chega na `master` só vindo da `dev`.
- **Vercel:** importe o repositório, configure as variáveis de ambiente e faça o
  deploy. `vercel.json` fixa a região `gru1` e cria o cron diário
  (`0 11 * * *` = 8h em São Paulo; no plano Hobby pode atrasar até ~1 hora).
  Cada push na branch de produção republica.
- **Avisos por e-mail:** no Google, ative a verificação em duas etapas da conta
  e crie uma **senha de app** (`GMAIL_APP_PASSWORD`). Na Vercel, defina
  `GMAIL_USER`, `GMAIL_APP_PASSWORD`, `CRON_SECRET` (e, se quiser, `EMAIL_FROM`).
  **Não** defina `EMAIL_TESTE_PARA` em produção.
- **Supabase:** troque a **Site URL** e as **Redirect URLs** pela URL da Vercel,
  senão o login e os links de e-mail não funcionam em produção.
- **Mudança no banco:** migration em `supabase/migrations/`, aplicada à mão no
  SQL Editor, na ordem que o arquivo indicar em relação ao deploy.

## Limites do plano Free (Supabase)

- **200 conexões Realtime simultâneas** (cada página de ala aberta = 1). Página
  escondida por 30 s solta o canal; o WebSocket fecha ~50 s depois.
- Sem backup automático.
- Projeto pausa após 7 dias sem uso.
- Gmail: ~500 e-mails por dia numa conta comum (sobra para o tamanho do projeto).

---

Desenvolvido por **Luis Henrique Engel Saul**:
[luishsaul.com.br](https://luishsaul.com.br/#contato).
