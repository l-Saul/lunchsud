# LunchSud — Agendamento de Almoço para Missionários

Sistema para agendar almoços de missionários por ala. Os membros escolhem um dia
disponível (mês atual ou seguinte) em um calendário, e líderes de ala acessam um
painel administrativo para gerenciar os agendamentos.

O público-alvo principal são **senhoras com pouca familiaridade digital, acessando
pelo celular** — por isso o design prioriza simplicidade, textos grandes, alto
contraste e poucos passos.

🔗 **Produção:** https://lunchsud.vercel.app

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS 4**
- **Supabase** (PostgreSQL) — fonte da verdade dos dados
- **Vercel** — hospedagem
- Autenticação dos líderes com **Supabase Auth** (e-mail + senha, sessão em cookies
  via `@supabase/ssr`)
- Exportação do calendário em **imagem** (`html-to-image`) para compartilhar no WhatsApp
- `framer-motion` (animações) e `swr` (data fetching no client)

## Supabase

### Tabelas do app

**`ala`** — uma por ala; controla o link público (slug) e dados de exibição.
| column_name | data_type         | is_nullable | observação                     |
| ----------- | ----------------- | ----------- | ------------------------------ |
| id          | integer           | NO          | PK                             |
| nome        | character varying | NO          | nome de exibição ("Ala …")     |
| descricao   | character varying | YES         | opcional                       |
| endereco    | text              | YES         | rua/número (campo livre)       |
| slug        | text              | NO          | link público (`/[slug]`), único |

**`agendamento`** — um almoço por dia, por ala (constraint única em `ala_id, data`).
| column_name | data_type         | is_nullable |
| ----------- | ----------------- | ----------- |
| id          | integer           | NO          |
| ala_id      | integer           | NO          |
| data        | date              | NO          |
| nome        | character varying | NO          |
| telefone    | character varying | NO          |

### Tabelas de autenticação/papéis

A sessão é do **Supabase Auth** (`auth.users`). Duas tabelas ligam o usuário ao app:

**`perfil`** — 1:1 com `auth.users` (criado por trigger no signup).
| column_name | data_type   | is_nullable | observação                  |
| ----------- | ----------- | ----------- | --------------------------- |
| id          | uuid        | NO          | PK → `auth.users(id)`       |
| nome        | text        | NO          | default `''`                |
| email       | text        | YES         |                             |
| is_owner    | boolean     | NO          | default `false` — acesso total |
| criado_em   | timestamptz | NO          | default `now()`             |

**`ala_membro`** — vínculo usuário ↔ ala (1 ala por member).
| column_name  | data_type   | is_nullable | observação                          |
| ------------ | ----------- | ----------- | ----------------------------------- |
| id           | bigint      | NO          | PK (identity)                       |
| ala_id       | integer     | NO          | → `ala(id)`                         |
| user_id      | uuid        | NO          | → `auth.users(id)`                  |
| status       | text        | NO          | `pendente` \| `aprovado`            |
| aprovado_por | uuid        | YES         | → `auth.users(id)`                  |
| criado_em    | timestamptz | NO          | default `now()`; único em (ala_id, user_id) |

**Papéis**
- **owner** (`perfil.is_owner = true`) — acessa **todas as alas**, aprova/remove
  usuários, **cria novas alas** e troca a "ala em foco" no painel.
- **member** — uma ala só (o `ala_membro` aprovado). Um member aprovado também pode
  aprovar/remover usuários **da sua ala**.

## Funcionalidades

### Público

- Página inicial com a lista de alas (e uma **escritura do Livro de Mórmon** sorteada
  a cada carregamento). A ala de **teste** só aparece em desenvolvimento.
- Página por ala (`/[slug]`) com calendário do mês atual e do seguinte
- Bloqueio automático de dias já ocupados e das segundas (P-day)
- Agendamento em **modal** (backend como fonte da verdade, evita conflitos)
- Ao compartilhar o link da ala, o preview (só texto) mostra **"Calendário de almoços
  da \<ala\>"** como título e um convite como descrição (metadata por ala). A **aba**
  do navegador mostra só o nome da ala.

### Administrativo (líderes)

- **Login/cadastro** do líder em `/admin` via Supabase Auth (e-mail + senha), com
  **recuperação de senha** (link por e-mail → `/auth/confirmar` → `/redefinir-senha`)
- Quem entra sem ala aprovada vai para **`/acesso`** pedir acesso a uma ala e
  aguardar aprovação
- Painel (`/dashboard`) com os agendamentos da ala, agrupados por mês
- Cada mês **recolhe/expande** ao clicar no nome (evita rolar listas longas)
- Histórico de almoços dos **3 meses anteriores**
- Editar e excluir agendamentos (modal mobile-first, confirmação de remoção inline)
- Exportar o calendário do mês como imagem (para compartilhar no WhatsApp)
- Card **Usuários**: aprovar pendentes e remover acesso (escopo da ala em foco)
- **Owner**: trocar a ala em foco e **criar novas alas** direto do painel (o slug é
  gerado do nome; "Endereço" é um campo livre)

### Tempo real

- Calendário público e painel se atualizam **ao vivo** (Supabase Realtime via
  WebSocket): se alguém agenda, edita ou remove, quem está com a tela aberta vê
  na hora. Requer a configuração de Realtime no Supabase (ver abaixo).

## Regras de negócio

> ⚠️ Regras centrais — confirmar antes de mexer no calendário ou na API.

- **Um almoço por dia, por ala.** Os dias já agendados vêm do banco e ficam
  bloqueados no calendário (constraint única no Postgres → erro `23505` tratado
  na API).
- **Segunda-feira é P-day** (dia de preparação dos missionários) e **não pode
  ser agendada.** Travado em 3 camadas: no calendário (`Calendar`), na imagem
  gerada (`CalendarMonthView`) e no backend (`/api/agendar`), todas usando
  `isPday()` de [`src/lib/date.ts`](src/lib/date.ts).
- **Janela de datas:** o público agenda apenas no **mês atual e no seguinte**; o
  painel também mostra só esses dois meses. O "hoje" é calculado no fuso
  `America/Sao_Paulo` (`getDashboardRange`) para não "virar o mês" pelo UTC do
  servidor na Vercel.
- A contagem do painel ("X de Y dias agendados") usa `Y = dias do mês − segundas`
  (`diasDisponiveisNoMes`).

## Design e acessibilidade

- Identidade visual inspirada no site da Igreja: **azul-marinho + branco + verde**
  (`--color-primary`/`--color-secondary` em [`globals.css`](src/app/globals.css)).
- Tipografia **Source Sans** (corpo) + **Source Serif** (títulos) via `next/font`.
- Base de fonte ~18px, foco visível, alvos de toque grandes, calendário operável
  por teclado/leitor de tela.
- **Hover e micro-animações** no desktop (via `transform`/`opacity`, leves) que
  **respeitam `prefers-reduced-motion`** (CSS global + `MotionConfig reducedMotion="user"`).
- A **imagem gerada** ([`CalendarMonthView`](src/components/CalendarMonthView.tsx))
  usa estilos inline + SVG (não depende do Tailwind) para renderizar igual em
  qualquer aparelho no `html-to-image`.

## Estrutura do projeto

```
src/
├── app/                      # App Router (rotas + páginas)
│   ├── [slug]/               # Página pública de uma ala (+ metadata por ala)
│   ├── admin/                # Login/cadastro do líder (Supabase Auth)
│   ├── acesso/               # Pedir/aguardar acesso a uma ala
│   ├── redefinir-senha/      # Definir nova senha (via link de e-mail)
│   ├── dashboard/            # Painel administrativo da ala
│   ├── auth/confirmar/       # Troca o link do e-mail por sessão
│   ├── api/                  # Route handlers (backend)
│   │   ├── acesso/           # solicitar, aprovar, remover (vínculos de ala)
│   │   ├── agendamentos/     # consulta, update, delete por ala
│   │   ├── agendar/          # criação de agendamento
│   │   ├── ala-atual/        # owner troca a ala em foco
│   │   └── alas/             # lista de alas + criar (owner)
│   ├── layout.tsx            # metadados, fontes, footer
│   ├── template.tsx          # transição suave entre páginas
│   ├── manifest.ts           # web manifest (instalar na tela inicial)
│   ├── robots.ts             # robots (não indexa /admin e /dashboard)
│   ├── page.tsx
│   └── globals.css           # tema (cores/fontes) + fundo celestial + acessibilidade
├── components/               # Componentes de UI reutilizáveis
├── hooks/                    # use-ocupados-realtime (atualização ao vivo via WebSocket)
├── lib/                      # supabase/{client,server,browser,auth-server}, session,
│                             #   date, alas, escrituras, phone, validation, rate-limit
└── proxy.ts                  # renova a sessão do Supabase Auth (convenção do Next 16)
```

## APIs

| Método | Rota                          | Descrição                                  | Auth         |
| ------ | ----------------------------- | ------------------------------------------ | ------------ |
| GET    | `/api/alas`                   | Lista as alas (esconde a de teste em prod) | —            |
| GET    | `/api/agendamentos/[slug]`    | Dias ocupados de uma ala                   | —            |
| POST   | `/api/agendar`                | Cria um agendamento                        | —            |
| POST   | `/api/agendamentos/update`    | Atualiza um agendamento                    | líder        |
| POST   | `/api/agendamentos/delete`    | Remove um agendamento                      | líder        |
| POST   | `/api/acesso/solicitar`       | Pede acesso a uma ala (vínculo pendente)   | logado       |
| POST   | `/api/acesso/aprovar`         | Aprova um vínculo pendente                 | owner/member |
| POST   | `/api/acesso/remover`         | Remove o acesso de um usuário              | owner/member |
| POST   | `/api/ala-atual`              | Define a ala em foco                       | owner        |
| POST   | `/api/alas/criar`             | Cria uma nova ala                          | owner        |
| GET    | `/auth/confirmar`             | Troca o link do e-mail por sessão          | —            |

> "líder" = owner **ou** member aprovado da ala em questão.

## Variáveis de ambiente

Crie um arquivo `.env.local` na raiz:

```bash
# Supabase (cliente público / anon — usado no navegador e no Supabase Auth)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Supabase (server / service role — nunca expor no client)
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

No painel do Supabase, em **Authentication**: habilite o provider **Email**, defina
a **Site URL** (preenche o link dos e-mails) e adicione as **Redirect URLs**
(`http://localhost:3000/**` e a URL de produção). Para a recuperação de senha ficar
bonita, cole o template de [`supabase/email-templates/redefinir-senha.html`](supabase/email-templates/redefinir-senha.html)
em **Email Templates → Reset Password**.

## Banco e papéis (SQL de setup)

Tabelas de papéis + trigger que cria o `perfil` no signup (rodar uma vez):

```sql
create table if not exists public.perfil (
    id uuid primary key references auth.users(id) on delete cascade,
    nome text not null default '', email text,
    is_owner boolean not null default false,
    criado_em timestamptz not null default now()
);

create table if not exists public.ala_membro (
    id bigint generated always as identity primary key,
    ala_id integer not null references public.ala(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    status text not null default 'pendente' check (status in ('pendente','aprovado')),
    aprovado_por uuid references auth.users(id),
    criado_em timestamptz not null default now(),
    unique (ala_id, user_id)
);

-- coluna de endereço da ala (campo livre)
alter table public.ala add column if not exists endereco text;

-- promove o primeiro owner
update public.perfil set is_owner = true where email = 'voce@exemplo.com';
```

## Realtime (Supabase)

A atualização ao vivo usa o **Supabase Realtime**. Rode **uma vez** no SQL Editor
do Supabase (sem isso, o calendário não atualiza sozinho entre abas/pessoas):

```sql
alter publication supabase_realtime add table agendamento;
alter table agendamento enable row level security;
create policy "leitura publica" on agendamento for select to anon using (true);
-- Faz REMOÇÕES/edições propagarem ao vivo: por padrão o Postgres só envia a PK
-- no DELETE e o filtro por ala_id não casaria.
alter table agendamento replica identity full;
```

> O cliente anon só é usado como **gatilho** (o payload é ignorado; os dados são
> rebuscados pelo servidor). Para não expor `telefone` via REST, dá para restringir
> as colunas do anon: `grant select (id, ala_id, data, nome) on agendamento to anon;`.

## Segurança

- **Autenticação** via Supabase Auth; o `proxy.ts` renova a sessão a cada requisição.
  As rotas do painel resolvem papel/ala em foco em [`src/lib/session.ts`](src/lib/session.ts).
- **Validação de entrada** em todas as rotas públicas (`src/lib/validation.ts`):
  teto de tamanho de corpo, formato e charset antes de tocar no banco.
- **Rate limit por IP** (`src/lib/rate-limit.ts`, em memória): `/api/agendar` 6/min,
  GETs públicos 30/min. Ao escalar horizontalmente, troque o `store` por
  Upstash/Vercel KV (mesma interface).
- Headers de segurança em `next.config.ts` (`X-Frame-Options`, `nosniff`, HSTS…).
- As rotas nunca ecoam o erro do banco; respondem mensagens genéricas.

## Rodar localmente

```bash
npm install
npm run dev
```

A aplicação sobe em http://localhost:3000.

## Scripts

```bash
npm run dev     # ambiente de desenvolvimento
npm run build   # build de produção
npm run start   # serve o build de produção
npm run lint    # ESLint (= eslint src)
```

> Não rode `npm run build` com o `npm run dev` aberto: os dois disputam o cache
> `.next`. Para só checar tipos, use `npx tsc --noEmit`.

## Créditos

Desenvolvido por **Luis Henrique Engel Saul** — [luishsaul.com.br](https://luishsaul.com.br).

## Licença

Uso interno.
