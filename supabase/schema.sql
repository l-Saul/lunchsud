-- Snapshot do schema `public` em produção (projeto kbbsiikqoehwnflxjnfi),
-- extraído do catálogo via MCP em 2026-10-24. O banco não tem migrations
-- versionadas: este arquivo é a referência do estado atual, não um script
-- para rodar em cima do banco existente.

-- ─── Tabelas ────────────────────────────────────────────────────────────────

create table public.ala (
    id        integer generated always as identity primary key,
    nome      varchar(100) not null,
    descricao varchar(150),
    endereco  varchar(150),
    slug      text not null unique -- link público, gerado do nome por gerarSlug()
);

create table public.agendamento (
    id       integer generated always as identity primary key,
    ala_id   integer not null,
    data     date not null,
    nome     varchar(150) not null,
    telefone varchar(20) not null,
    constraint fk_ala foreign key (ala_id) references public.ala (id) on delete cascade,
    -- Regra de negócio: um almoço por dia, por ala (a API trata o 23505).
    constraint agendamento_ala_data_unique unique (ala_id, data)
);

-- 1:1 com auth.users, criado pelo trigger on_auth_user_created.
create table public.perfil (
    id        uuid primary key references auth.users (id) on delete cascade,
    nome      text not null default '',
    email     text,
    is_owner  boolean not null default false,
    criado_em timestamptz not null default now()
);

-- Vínculo usuário ↔ ala (member = uma ala aprovada).
create table public.ala_membro (
    id           bigint generated always as identity primary key,
    ala_id       integer not null references public.ala (id) on delete cascade,
    user_id      uuid not null references auth.users (id) on delete cascade,
    status       text not null default 'pendente'
                 check (status = any (array['pendente', 'aprovado'])),
    aprovado_por uuid references auth.users (id),
    criado_em    timestamptz not null default now(),
    unique (ala_id, user_id)
);

create index idx_ala_membro_ala_status on public.ala_membro using btree (ala_id, status);
create index idx_ala_membro_user on public.ala_membro using btree (user_id);

-- ─── Trigger de signup ──────────────────────────────────────────────────────

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
    insert into public.perfil (id, nome, email)
    values (new.id, coalesce(new.raw_user_meta_data->>'nome', ''), new.email);
    return new;
end; $function$;

create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();

-- ─── RLS ────────────────────────────────────────────────────────────────────
-- O app lê/escreve tudo pelo service-role no servidor (ignora RLS). As policies
-- abaixo só importam para quem fala direto com a REST/Realtime do Supabase.

alter table public.ala         enable row level security;
alter table public.agendamento enable row level security;
alter table public.perfil      enable row level security;
alter table public.ala_membro  enable row level security;

create policy "public read ala" on public.ala
    for select to public using (true);

create policy "leitura publica" on public.agendamento
    for select to anon using (true);

-- ⚠️ Duplicada e "to public": inclui `authenticated`, que tem SELECT em todas as
-- colunas → qualquer conta logada lê `telefone` pela REST.
create policy "public read agendamento" on public.agendamento
    for select to public using (true);

-- ⚠️ As três abaixo consultam a própria tabela → "infinite recursion detected
-- in policy" (42P17) para qualquer usuário logado. O app não as usa.
create policy perfil_leitura on public.perfil
    for select to authenticated
    using (id = auth.uid() or exists (
        select 1 from perfil p where p.id = auth.uid() and p.is_owner));

create policy ala_membro_leitura on public.ala_membro
    for select to authenticated
    using (user_id = auth.uid()
        or exists (select 1 from perfil p where p.id = auth.uid() and p.is_owner)
        or exists (select 1 from ala_membro m
                   where m.ala_id = ala_membro.ala_id
                     and m.user_id = auth.uid()
                     and m.status = 'aprovado'));

create policy ala_membro_pedir_acesso on public.ala_membro
    for insert to authenticated
    with check (user_id = auth.uid() and status = 'pendente');

-- ─── Grants relevantes ──────────────────────────────────────────────────────
-- anon NÃO tem SELECT em `telefone` (grant por coluna):
revoke select on public.agendamento from anon;
grant select (id, ala_id, data, nome) on public.agendamento to anon;
-- `authenticated` mantém o SELECT padrão em todas as colunas (ver ⚠️ acima).

-- ─── Realtime ───────────────────────────────────────────────────────────────

alter publication supabase_realtime add table public.agendamento;
alter table public.agendamento replica identity full; -- DELETE/UPDATE ao vivo
