-- Schema do banco (Supabase) — fonte da verdade da estrutura.
--
-- Reflete a produção (projeto kbbsiikqoehwnflxjnfi) em 2026-10-24, depois da
-- migration de segurança e integridade.
--  - Projeto NOVO: rode este arquivo inteiro no SQL Editor (é o passo 2 do README).
--  - Projeto EXISTENTE: não rode por cima (os `create table` falham); use como
--    referência e escreva uma migration só com a mudança.
--
-- Modelo de acesso: o app lê e escreve tudo pelo service-role no servidor
-- (ignora RLS e grants). O navegador só usa a chave anon para o Realtime de
-- `agendamento`, e por isso só enxerga id, ala_id, data e nome.

-- ─── Permissões padrão (antes de criar qualquer tabela) ─────────────────────
-- O Supabase dá a anon/authenticated acesso total a toda tabela e sequence nova
-- em `public`. Aqui elas nascem fechadas; o acesso do navegador é concedido
-- explicitamente lá embaixo. Funções não entram: o EXECUTE para PUBLIC é global
-- no Postgres — toda função nova em `public` precisa de REVOKE próprio.

alter default privileges for role postgres in schema public
    revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public
    revoke all on sequences from anon, authenticated;

-- ─── Tabelas ────────────────────────────────────────────────────────────────

create table public.ala (
    id           integer generated always as identity primary key,
    nome         varchar(100) not null,
    descricao    varchar(150),
    endereco     varchar(200),
    slug         text not null unique, -- link público, gerado do nome por gerarSlug()
    -- Localização (src/lib/localizacao.ts). O fuso define o "hoje" (dia passado
    -- bloqueado), a janela de 2 meses e a virada do mês DESSA ala.
    pais         char(2) not null,     -- ISO 3166-1: 'BR', 'AR', 'US'…
    estado       varchar(60) not null, -- Brasil: UF ('PR'); outros países: texto livre
    cidade       varchar(80) not null,
    fuso_horario varchar(64) not null, -- IANA: 'America/Sao_Paulo', 'America/Manaus'…
    constraint ala_slug_formato check (slug ~ '^[a-z0-9_-]{1,60}$'),
    constraint ala_pais_formato check (pais ~ '^[A-Z]{2}$'),
    constraint ala_estado_valido check (
        length(btrim(estado)) between 1 and 60
        and estado !~ '[<>]' and estado !~ '[[:cntrl:]]'
        and (pais <> 'BR' or estado in (
            'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA',
            'PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'))
    ),
    constraint ala_cidade_valida check (length(btrim(cidade)) between 2 and 80 and cidade !~ '[<>]' and cidade !~ '[[:cntrl:]]'),
    constraint ala_fuso_formato check (fuso_horario ~ '^[A-Za-z]+(/[A-Za-z0-9_+-]+)+$')
);

create table public.agendamento (
    id        integer generated always as identity primary key,
    ala_id    integer not null,
    data      date not null,
    nome      varchar(150) not null,
    telefone  varchar(20) not null,
    criado_em timestamptz default now(), -- NULL nas linhas anteriores a 2026-10-24
    constraint fk_ala foreign key (ala_id) references public.ala (id) on delete cascade,
    -- Regra de negócio: um almoço por dia, por ala (a API trata o 23505). Este
    -- índice também atende todas as consultas por ala (+ intervalo de datas).
    constraint agendamento_ala_data_unique unique (ala_id, data),
    -- Espelham src/lib/validation.ts. P-day (segunda) NÃO é barrado aqui: o
    -- líder pode mover um almoço para segunda; só /api/agendar recusa.
    -- Telefone: Brasil (celular/fixo) ou internacional "+país …"; o formato é
    -- decidido por normalizarTelefone (src/lib/phone.ts). 7–15 dígitos = E.164.
    constraint agendamento_telefone_valido
        check (telefone ~ '^\+?[0-9 ]+$' and length(regexp_replace(telefone, '\D', '', 'g')) between 7 and 15),
    constraint agendamento_nome_valido
        check (length(btrim(nome)) between 2 and 80 and nome !~ '[<>]' and nome !~ '[[:cntrl:]]')
);

-- 1:1 com auth.users, criado pelo trigger on_auth_user_created.
create table public.perfil (
    id        uuid primary key references auth.users (id) on delete cascade,
    nome      text not null default '',
    email     text,
    is_owner  boolean not null default false,
    criado_em timestamptz not null default now()
);

-- Vínculo usuário ↔ ala. Member = uma ala só (índice único em user_id).
create table public.ala_membro (
    id           bigint generated always as identity primary key,
    ala_id       integer not null references public.ala (id) on delete cascade,
    user_id      uuid not null references auth.users (id) on delete cascade,
    status       text not null default 'pendente'
                 check (status = any (array['pendente', 'aprovado'])),
    aprovado_por uuid references auth.users (id) on delete set null,
    criado_em    timestamptz not null default now()
);

create unique index ala_membro_user_unico on public.ala_membro using btree (user_id);
create index idx_ala_membro_ala_status on public.ala_membro using btree (ala_id, status);
create index idx_ala_membro_aprovado_por on public.ala_membro using btree (aprovado_por);

-- ─── Trigger de cadastro do líder ───────────────────────────────────────────

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
begin
    insert into public.perfil (id, nome, email)
    values (new.id, coalesce(new.raw_user_meta_data ->> 'nome', ''), new.email)
    on conflict (id) do nothing;
    return new;
end;
$function$;

-- SECURITY DEFINER não pode ficar exposta em /rest/v1/rpc.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
grant execute on function public.handle_new_user() to supabase_auth_admin;

create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();

-- ─── RLS e permissões ───────────────────────────────────────────────────────

alter table public.ala         enable row level security;
alter table public.agendamento enable row level security;
alter table public.perfil      enable row level security;
alter table public.ala_membro  enable row level security;

-- Garantia explícita (além das permissões padrão do topo).
revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

-- Única policy: leitura do calendário (página pública + Realtime), só nas 4
-- colunas abaixo. `telefone` e `criado_em` ficam restritos ao service-role.
create policy "leitura publica" on public.agendamento
    for select to anon, authenticated using (true);
grant select (id, ala_id, data, nome) on public.agendamento to anon, authenticated;

-- ala, perfil e ala_membro: RLS ligada e sem policy = acesso só pelo servidor
-- (o Advisor "RLS enabled no policy" é intencional).

-- ─── Realtime ───────────────────────────────────────────────────────────────

alter publication supabase_realtime add table public.agendamento;
-- DELETE/UPDATE ao vivo: sem isto o Postgres só envia a PK e o filtro ala_id não casa.
alter table public.agendamento replica identity full;
