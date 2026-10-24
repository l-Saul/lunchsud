-- =============================================================================
-- Migration: localização da ala (país, estado, cidade) + fuso horário
-- Data:      2026-10-24
--
-- POR QUÊ
--   Preparar a expansão para outros estados e países. Além de país/estado/cidade,
--   a ala ganha o FUSO HORÁRIO: o "hoje" (dia passado bloqueado), a janela de 2
--   meses e a virada do mês eram calculados sempre no horário de São Paulo — uma
--   ala em Manaus (-1h), no Acre (-2h) ou nos EUA veria o dia virar na hora errada.
--
-- FORMATO
--   pais          'BR', 'AR', 'US'… (ISO 3166-1, 2 letras maiúsculas)
--   estado        Brasil: sigla da UF ('PR'); outros países: nome/sigla livre
--   cidade        'Curitiba'
--   fuso_horario  nome IANA ('America/Sao_Paulo', 'America/Manaus'…)
--
-- AS 3 ALAS DE HOJE (ecoville, pilarzinho, sao_lourenco) ficam BR / PR / Curitiba /
-- America/Sao_Paulo — preenchidas pelo DEFAULT ao criar as colunas.
--
-- ORDEM (IMPORTANTE)
--   PARTE 1 → agora, ANTES do deploy do código novo (que já lê essas colunas).
--             Os DEFAULTs deixam o código que está no ar funcionando: ele cria ala
--             sem informar localização e o banco preenche com Curitiba.
--   PARTE 2 → DEPOIS do deploy. Tira os DEFAULTs: daí em diante toda ala nova
--             precisa vir com a localização de verdade (o formulário novo manda),
--             em vez de virar "Curitiba" sem ninguém perceber.
--
-- Testada num banco local com o schema de produção (idempotente).
-- =============================================================================


-- ─── PARTE 1 — rode agora ───────────────────────────────────────────────────
begin;

set local lock_timeout = '5s';

-- Coluna nova NOT NULL com DEFAULT constante: o Postgres preenche as linhas
-- existentes sem reescrever a tabela.
alter table public.ala
    add column if not exists pais char(2) not null default 'BR',
    add column if not exists estado varchar(60) not null default 'PR',
    add column if not exists cidade varchar(80) not null default 'Curitiba',
    add column if not exists fuso_horario varchar(64) not null default 'America/Sao_Paulo';

-- País: código ISO de 2 letras maiúsculas.
alter table public.ala drop constraint if exists ala_pais_formato;
alter table public.ala add constraint ala_pais_formato
    check (pais ~ '^[A-Z]{2}$');

-- Estado: no Brasil, uma UF que existe; fora, texto livre sem HTML/controle.
alter table public.ala drop constraint if exists ala_estado_valido;
alter table public.ala add constraint ala_estado_valido
    check (
        length(btrim(estado)) between 1 and 60
        and estado !~ '[<>]' and estado !~ '[[:cntrl:]]'
        and (pais <> 'BR' or estado in (
            'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA',
            'PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'))
    );

-- Cidade: 2–80 caracteres, sem HTML/controle.
alter table public.ala drop constraint if exists ala_cidade_valida;
alter table public.ala add constraint ala_cidade_valida
    check (length(btrim(cidade)) between 2 and 80 and cidade !~ '[<>]' and cidade !~ '[[:cntrl:]]');

-- Fuso: formato de nome IANA ("Continente/Cidade"). Se o nome existe de verdade
-- é checado no app (Intl), porque o check do Postgres não pode consultar tabela.
alter table public.ala drop constraint if exists ala_fuso_formato;
alter table public.ala add constraint ala_fuso_formato
    check (fuso_horario ~ '^[A-Za-z]+(/[A-Za-z0-9_+-]+)+$');

commit;


-- ─── PARTE 2 — rode DEPOIS do deploy do código novo ─────────────────────────
-- begin;
-- alter table public.ala
--     alter column pais drop default,
--     alter column estado drop default,
--     alter column cidade drop default,
--     alter column fuso_horario drop default;
-- commit;


-- VERIFICAÇÃO (depois da parte 1). Esperado: as 3 alas com BR | PR | Curitiba | America/Sao_Paulo.
--   select slug, pais, estado, cidade, fuso_horario from public.ala order by slug;
