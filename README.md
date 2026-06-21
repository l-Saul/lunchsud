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

### Administrativo

- Login do líder de ala (`/admin`) com sessão via cookie JWT
- Painel (`/dashboard`) com os agendamentos da ala, agrupados por mês
- Editar e excluir agendamentos
- Exportar o calendário do mês como imagem (para compartilhar no WhatsApp) ou PDF

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
│   ├── [slug]/               # Página pública de uma ala
│   ├── admin/                # Login do líder
│   ├── dashboard/            # Painel administrativo da ala
│   ├── api/                  # Route handlers (backend)
│   │   ├── admin/            # login, logout, dashboard, usuarios
│   │   ├── agendamentos/     # consulta, update, delete por ala
│   │   ├── agendar/          # criação de agendamento
│   │   └── alas/             # lista de alas
│   ├── layout.tsx            # metadados, fontes, footer
│   ├── template.tsx          # transição suave entre páginas
│   ├── manifest.ts           # web manifest (instalar na tela inicial)
│   ├── page.tsx
│   └── globals.css           # tema (cores/fontes) + acessibilidade
├── components/               # Componentes de UI reutilizáveis
└── lib/                      # Clientes Supabase, auth e utilidades (date.ts)
```

## APIs

| Método | Rota                          | Descrição                          | Auth  |
| ------ | ----------------------------- | ---------------------------------- | ----- |
| GET    | `/api/alas`                   | Lista as alas                      | —     |
| GET    | `/api/agendamentos/[slug]`    | Dias ocupados de uma ala           | —     |
| POST   | `/api/agendar`                | Cria um agendamento                | —     |
| POST   | `/api/admin/login`            | Autentica o líder (gera cookie)    | —     |
| POST   | `/api/admin/logout`           | Encerra a sessão                   | admin |
| GET    | `/api/admin/dashboard`        | Dados do painel da ala             | admin |
| GET    | `/api/admin/usuarios`         | Lista usuários/agendamentos da ala | admin |
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

## Licença

Uso interno.
