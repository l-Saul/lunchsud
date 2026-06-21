# LunchSud — Agendamento de Almoço para Missionários

Sistema para agendar almoços de missionários por ala. Os membros escolhem um dia
disponível do mês atual em um calendário, e líderes de ala acessam um painel
administrativo para gerenciar os agendamentos.

🔗 **Produção:** https://lunchsud.vercel.app

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS 4**
- **Supabase** (PostgreSQL) — fonte da verdade dos dados
- **Vercel** — hospedagem
- Autenticação admin com **JWT** (`jsonwebtoken`) + **bcrypt**
- Exportação do calendário em **imagem** (`html-to-image`) e **PDF** (`jspdf` / `jspdf-autotable`)
- `framer-motion` (animações) e `swr` (data fetching no client)

## Funcionalidades

### Público

- Página inicial com a lista de alas
- Página por ala (`/[slug]`) com calendário do mês atual
- Bloqueio automático de dias já ocupados
- Criação de agendamento (backend como fonte da verdade, evita conflitos)

### Administrativo

- Login do líder de ala (`/admin`) com sessão via cookie JWT
- Painel (`/dashboard`) com os agendamentos da ala
- Editar e excluir agendamentos
- Exportar o calendário do mês como imagem ou PDF

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
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/               # Componentes de UI reutilizáveis
└── lib/                      # Clientes Supabase, auth e utilidades
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
