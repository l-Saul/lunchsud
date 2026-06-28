# LunchSud — Agendamento de Almoço para Missionários

Calendário onde os membros agendam almoços dos missionários por ala, e um painel
onde os líderes gerenciam. Feito para o **celular**, com textos grandes e poucos passos.

🔗 Exemplo no ar: https://lunchsud.vercel.app

Este README é um **passo a passo para clonar e publicar o site para a sua ala ou
estaca.** Tudo grátis, ~20 minutos.

## Antes de começar

Crie contas (grátis) no **[Supabase](https://supabase.com)** (banco + login) e na
**[Vercel](https://vercel.com)** (publicar o site), e tenha o **Node.js 20+** instalado.

## 1. Clonar e instalar

```bash
git clone https://github.com/<seu-usuario>/lunchsud.git
cd lunchsud
npm install
```

## 2. Criar o banco no Supabase

Crie um projeto em [app.supabase.com](https://app.supabase.com). Abra o **SQL Editor**,
cole o bloco abaixo e clique em **Run** (cria as tabelas e o login dos líderes):

```sql
create table if not exists public.ala (
  id integer generated always as identity primary key,
  nome varchar not null, descricao varchar, endereco text,
  slug text not null unique
);

create table if not exists public.agendamento (
  id integer generated always as identity primary key,
  ala_id integer not null references public.ala(id) on delete cascade,
  data date not null, nome varchar not null, telefone varchar not null,
  unique (ala_id, data)
);

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

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin insert into public.perfil (id, email) values (new.id, new.email); return new; end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- atualização ao vivo do calendário
alter publication supabase_realtime add table agendamento;
alter table agendamento enable row level security;
create policy "leitura publica" on agendamento for select to anon using (true);
alter table agendamento replica identity full;
```

## 3. Ligar o login

No Supabase → **Authentication**:
- Habilite o provider **Email**.
- Em **URL Configuration**, defina **Site URL** = `http://localhost:3000` e adicione
  essa mesma URL em **Redirect URLs** (depois troque pela URL da Vercel — passo 6).

## 4. Configurar as chaves

Em **Project Settings → API**, copie a URL e as chaves. Crie um arquivo `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=        # Project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # chave "anon public"
SUPABASE_URL=                    # a mesma Project URL
SUPABASE_SERVICE_ROLE_KEY=       # chave "service_role" (nunca exponha)
```

## 5. Rodar e virar líder principal

```bash
npm run dev
```

Abra **http://localhost:3000/admin** e **cadastre-se**. Depois, no SQL Editor do
Supabase, vire o líder principal (acesso a todas as alas):

```sql
update public.perfil set is_owner = true where email = 'voce@exemplo.com';
```

Atualize a página: você entra no painel **/dashboard**. Lá você **cria as alas** (o
link público `/nome-da-ala` é o que você manda no grupo do WhatsApp) e aprova outros
líderes que se cadastram.

## 6. Publicar na Vercel

1. Suba seu repositório para o GitHub e importe-o em [vercel.com](https://vercel.com).
2. Adicione as **mesmas 4 variáveis** do `.env.local` em *Environment Variables*.
3. **Deploy.** Pegue a URL final e coloque-a na **Site URL** e nas **Redirect URLs**
   do Supabase (passo 3) — senão o login não funciona em produção.

A cada `git push` a Vercel republica sozinha.

## Bom saber

- **Um almoço por dia, por ala**; **segunda é P-day** (não agendável).
- Membros agendam só no **mês atual e no seguinte**; tudo atualiza **ao vivo**.
- O líder edita/exclui agendamentos e exporta o mês como **imagem** para o WhatsApp.

Stack: Next.js 16 · React 19 · TypeScript · Tailwind 4 · Supabase · Vercel.

---

Desenvolvido por **Luis Henrique Engel Saul** — [luishsaul.com.br](https://luishsaul.com.br) · Uso interno.
