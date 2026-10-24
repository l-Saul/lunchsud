-- Contexto e regras: leia CLAUDE.md e docs/database.md antes de alterar.
-- Mudou o comportamento? Atualize o doc na mesma mudança.

alter default privileges for role postgres in schema public
    revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public
    revoke all on sequences from anon, authenticated;

create table public.ala (
    id           integer generated always as identity primary key,
    nome         varchar(100) not null,
    descricao    varchar(150),
    endereco     varchar(200),
    slug         text not null unique,
    pais         char(2) not null,
    estado       varchar(60) not null,
    cidade       varchar(80) not null,
    fuso_horario varchar(64) not null,
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
    criado_em timestamptz default now(),
    constraint fk_ala foreign key (ala_id) references public.ala (id) on delete cascade,
    constraint agendamento_ala_data_unique unique (ala_id, data),
    constraint agendamento_telefone_valido
        check (telefone ~ '^\+?[0-9 ]+$' and length(regexp_replace(telefone, '\D', '', 'g')) between 7 and 15),
    constraint agendamento_nome_valido
        check (length(btrim(nome)) between 2 and 80 and nome !~ '[<>]' and nome !~ '[[:cntrl:]]')
);

create table public.perfil (
    id        uuid primary key references auth.users (id) on delete cascade,
    nome      text not null default '',
    email     text,
    is_owner  boolean not null default false,
    criado_em timestamptz not null default now()
);

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

create table public.email_preferencia (
    user_id        uuid not null references auth.users (id) on delete cascade,
    ala_id         integer not null references public.ala (id) on delete cascade,
    novo_almoco    boolean not null default false,
    dia_sem_almoco boolean not null default false,
    proximo_mes    boolean not null default false,
    semana         boolean not null default false,
    pedido_acesso  boolean not null default false,
    atualizado_em  timestamptz not null default now(),
    primary key (user_id, ala_id)
);

create index idx_email_preferencia_ala on public.email_preferencia using btree (ala_id);

create table public.email_envio (
    id         bigint generated always as identity primary key,
    tipo       text not null,
    user_id    uuid not null references auth.users (id) on delete cascade,
    ala_id     integer not null references public.ala (id) on delete cascade,
    referencia text not null,
    enviado_em timestamptz not null default now(),
    constraint email_envio_tipo check (tipo in ('dia_sem_almoco', 'proximo_mes', 'semana')),
    constraint email_envio_unico unique (tipo, user_id, ala_id, referencia)
);

create index idx_email_envio_user on public.email_envio using btree (user_id);
create index idx_email_envio_ala on public.email_envio using btree (ala_id);
create index idx_email_envio_enviado_em on public.email_envio using btree (enviado_em);

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

revoke execute on function public.handle_new_user() from public, anon, authenticated;
grant execute on function public.handle_new_user() to supabase_auth_admin;

create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();

create or replace function public.handle_user_email_change()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
begin
    update public.perfil set email = new.email where id = new.id;
    return new;
end;
$function$;

revoke execute on function public.handle_user_email_change() from public, anon, authenticated;
grant execute on function public.handle_user_email_change() to supabase_auth_admin;

create trigger on_auth_user_email_changed
    after update of email on auth.users
    for each row
    when (old.email is distinct from new.email)
    execute function public.handle_user_email_change();

alter table public.ala         enable row level security;
alter table public.agendamento enable row level security;
alter table public.perfil      enable row level security;
alter table public.ala_membro  enable row level security;
alter table public.email_preferencia enable row level security;
alter table public.email_envio       enable row level security;

revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

create policy "leitura publica" on public.agendamento
    for select to anon, authenticated using (true);
grant select (id, ala_id, data, nome) on public.agendamento to anon, authenticated;

alter publication supabase_realtime add table public.agendamento;
alter table public.agendamento replica identity full;
