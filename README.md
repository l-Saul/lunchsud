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
- Autenticação admin com **JWT** (`jsonwebtoken`) + **bcrypt**
- Exportação do calendário em **imagem** (`html-to-image`) e **PDF** (`jspdf` / `jspdf-autotable`)
- `framer-motion` (animações) e `swr` (data fetching no client)

## Supabase
**Definição da tabela:**
| column_name | data_type         | is_nullable | column_default                      |
| ----------- | ----------------- | ----------- | ----------------------------------- |
| id          | integer           | NO          | nextval('usuario_id_seq'::regclass) |
| username    | character varying | NO          | null                                |
| senha_hash  | text              | NO          | null                                |
| ala_id      | integer           | NO          | null                                |
| ativo       | boolean           | NO          | true                                |

| column_name | data_type         | is_nullable | column_default |
| ----------- | ----------------- | ----------- | -------------- |
| id          | integer           | NO          | null           |
| nome        | character varying | NO          | null           |
| descricao   | character varying | YES         | null           |
| endereco    | character varying | YES         | null           |
| slug        | text              | NO          | null           |

| column_name | data_type         | is_nullable | column_default |
| ----------- | ----------------- | ----------- | -------------- |
| id          | integer           | NO          | null           |
| ala_id      | integer           | NO          | null           |
| data        | date              | NO          | null           |
| nome        | character varying | NO          | null           |
| telefone    | character varying | NO          | null           |

**Todas as tabelas**
| table_name  |
| ----------- |
| agendamento |
| ala         |
| usuario     |

**Chaves estrangeiras**
| table_name  | column_name | foreign_table_name | foreign_column_name |
| ----------- | ----------- | ------------------ | ------------------- |
| agendamento | ala_id      | ala                | id                  |
| usuario     | ala_id      | ala                | id                  |

## Funcionalidades

### Público

- Página inicial com a lista de alas
- Página por ala (`/[slug]`) com calendário do mês atual e do seguinte
- Bloqueio automático de dias já ocupados e das segundas (P-day)
- Criação de agendamento (backend como fonte da verdade, evita conflitos)
- Ao compartilhar o link da ala, o preview mostra o **nome da ala** como título e
  uma escritura sobre Cristo (2 Néfi 31:20) como descrição (metadata por ala)

### Administrativo

- Login do líder de ala (`/admin`) com sessão via cookie JWT
- Painel (`/dashboard`) com os agendamentos da ala, agrupados por mês
- Cada mês **recolhe/expande** ao clicar no nome (evita rolar listas longas)
- Histórico de almoços dos **3 meses anteriores**
- Editar e excluir agendamentos (modal mobile-first, confirmação de remoção inline)
- Exportar o calendário do mês como imagem (para compartilhar no WhatsApp) ou PDF

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
  por teclado/leitor de tela e respeito a `prefers-reduced-motion`.
- A **imagem gerada** ([`CalendarMonthView`](src/components/CalendarMonthView.tsx))
  usa estilos inline + SVG (não depende do Tailwind) para renderizar igual em
  qualquer aparelho no `html-to-image`.

## Estrutura do projeto

```
src/
├── app/                      # App Router (rotas + páginas)
│   ├── [slug]/               # Página pública de uma ala (+ metadata por ala)
│   ├── admin/                # Login do líder
│   ├── dashboard/            # Painel administrativo da ala
│   ├── api/                  # Route handlers (backend)
│   │   ├── admin/            # login, logout, dashboard (checagem de sessão)
│   │   ├── agendamentos/     # consulta, update, delete por ala
│   │   ├── agendar/          # criação de agendamento
│   │   └── alas/             # lista de alas
│   ├── layout.tsx            # metadados, fontes, footer
│   ├── template.tsx          # transição suave entre páginas
│   ├── manifest.ts           # web manifest (instalar na tela inicial)
│   ├── robots.ts             # robots (não indexa /admin e /dashboard)
│   ├── page.tsx
│   └── globals.css           # tema (cores/fontes) + fundo celestial + acessibilidade
├── components/               # Componentes de UI reutilizáveis
├── hooks/                    # use-ocupados-realtime (atualização ao vivo via WebSocket)
└── lib/                      # supabase/{client,server,admin}, auth, date,
                              #   phone, validation (entrada), rate-limit
```

## APIs

| Método | Rota                          | Descrição                          | Auth  |
| ------ | ----------------------------- | ---------------------------------- | ----- |
| GET    | `/api/alas`                   | Lista as alas                      | —     |
| GET    | `/api/agendamentos/[slug]`    | Dias ocupados de uma ala           | —     |
| POST   | `/api/agendar`                | Cria um agendamento                | —     |
| POST   | `/api/admin/login`            | Autentica o líder (gera cookie)    | —     |
| POST   | `/api/admin/logout`           | Encerra a sessão                   | admin |
| GET    | `/api/admin/dashboard`        | Checagem de sessão (guard de login)| admin |
| POST   | `/api/agendamentos/update`    | Atualiza um agendamento            | admin |
| POST   | `/api/agendamentos/delete`    | Remove um agendamento              | admin |

## Variáveis de ambiente

Crie um arquivo `.env.local` na raiz:

```bash
# Supabase (cliente público)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Supabase (server / service role — nunca expor no client)
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

# Segredo para assinar os tokens JWT de sessão admin
AUTH_SECRET=
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

- **Validação de entrada** em todas as rotas públicas (`src/lib/validation.ts`):
  teto de tamanho de corpo, formato e charset antes de tocar no banco.
- **Rate limit por IP** (`src/lib/rate-limit.ts`, em memória): `/api/agendar` 6/min,
  `/api/admin/login` 5/10min, GETs públicos 30/min. Ao escalar horizontalmente,
  troque o `store` por Upstash/Vercel KV (mesma interface).
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
npm run lint    # ESLint
```

## Créditos

Desenvolvido por **Luis Henrique Engel Saul** — [luishsaul.com.br](https://luishsaul.com.br).

## Licença

Uso interno.
