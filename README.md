# 🍽️ Agendamento de Almoço – Missionários

Aplicação web para **agendamento de almoços por ala**, com calendário mensal simples, controle de conflitos e integração com Supabase.

O sistema permite que membros escolham um dia disponível do mês atual e realizem o agendamento de forma segura, evitando duplicidade.

---

## ✨ Funcionalidades

- 📅 Calendário mensal do mês atual
- ✅ Bloqueio automático de dias já ocupados
- 🔒 Proteção contra agendamentos simultâneos (constraint no banco)
- 📲 Formatação e validação de telefone celular (padrão brasileiro)
- 🏠 Página inicial listando todas as alas disponíveis
- 🔗 Página individual por ala (`/[slug]`)
- ⚡ UX simples: sem recarregar dados após agendamento
- 🧠 Backend confiável como fonte da verdade

---

## 🧱 Stack utilizada

- **Next.js 16 (App Router + Turbopack)**
- **React**
- **TypeScript**
- **Tailwind CSS**
- **Supabase (PostgreSQL + API)**
- **Vercel (deploy)**

---

## 🗂️ Estrutura principal

```txt
src/
├── app/
│   ├── page.tsx                # Index – lista de alas
│   ├── [slug]/
│   │   ├── page.tsx            # Server Component
│   │   └── ClientPage.tsx      # Client Component (UI + estado)
│   └── api/
│       ├── alas/route.ts       # GET – lista de alas
│       ├── agendar/route.ts    # POST – cria agendamento
│       └── agendamentos/
│           └── [slug]/route.ts # GET – dias ocupados por ala
├── components/
│   └── Calendar.tsx            # Calendário mensal
└── lib/
    ├── supabase-server.ts      # Cliente Supabase (server)
    └── rateLimit.ts            # Rate limit simples
```

---

## 🗃️ Modelo de dados (Supabase)
Tabela ala
campo	tipo	descrição
id	bigint	PK
nome	text	Nome da ala
slug	text	Usado na URL

Tabela agendamento
campo	tipo	descrição
id	bigint	PK
ala_id	bigint	FK → ala
data	date	Dia do agendamento
nome	text	Nome do responsável
telefone	text	Telefone

---

## 🔐 Segurança e consistência
Conflitos tratados no banco (PostgreSQL)
Erro 23505 capturado no backend
Frontend nunca sobrescreve o estado incorretamente
Rate limit aplicado no endpoint de agendamento

---

## 🌍 Variáveis de ambiente
Local (.env.local)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...


---

## 🚀 Como rodar localmente
npm install
npm run dev
Acesse:
http://localhost:3000

---

## 📤 Deploy
Plataforma: Vercel
Build automático via GitHub
Sempre fazer Redeploy com Clear Cache após mudanças em rotas dinâmicas

---

## 🧠 Decisões de arquitetura
Calendário sem navegação de meses (foco no mês atual)
Sem refetch após agendar → estado local é atualizado
Backend é a fonte da verdade
Simplicidade > abstrações desnecessárias

---

## 🛠️ Possíveis evoluções
Bloquear dias passados
Bloquear finais de semana
Geração automática de imagem Open Graph do mês
Confirmação por WhatsApp
Painel administrativo

---

## 📄 Licença
Projeto privado / uso interno.