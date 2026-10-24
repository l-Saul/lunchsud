# Banco (Supabase / Postgres)

`supabase/schema.sql` é a **fonte da verdade da estrutura**. Ele reflete a
produção (projeto `kbbsiikqoehwnflxjnfi`, região `sa-east-1`, São Paulo) depois
da migration de segurança e integridade de 2026-10-24.

- **Projeto novo:** rode o arquivo inteiro no SQL Editor (passo de setup do README).
- **Projeto existente:** não rode por cima (os `create table` falham). Use como
  referência e escreva uma migration só com a mudança (abaixo).

## Modelo de acesso

- O **app lê e escreve tudo pelo service-role, no servidor** (ignora RLS e
  grants). A autorização é feita nas rotas (ver [routes_api.md](routes_api.md)).
- O **navegador** só usa a chave anon para o **Realtime** de `agendamento`, e por
  isso só enxerga `id, ala_id, data, nome`.
- `telefone`, `criado_em`, as outras tabelas e **toda escrita** são só do
  service-role.
- O cadastro de líder é aberto (qualquer um cria conta), então **nunca dê a
  `authenticated` mais que a `anon`**.

### Permissões padrão (antes de criar qualquer tabela)

O Supabase dá a `anon` e `authenticated` acesso total a toda tabela e sequence
nova em `public`. O schema começa com `alter default privileges ... revoke all`
para tabelas e sequences: elas **nascem fechadas** e o acesso do navegador é
concedido explicitamente.

**Funções não entram nisso:** o `EXECUTE` para `PUBLIC` é global no Postgres
(revogar por schema não funciona). Toda função nova em `public` fica exposta em
`/rest/v1/rpc` e precisa de `revoke execute on function ... from public, anon,
authenticated` próprio.

Além das permissões padrão, o schema faz `revoke all on all tables/sequences in
schema public from anon, authenticated` como garantia explícita.

## Tabelas

### `ala`

| Coluna | Tipo | Regra |
|---|---|---|
| `id` | `integer` identity | PK |
| `nome` | `varchar(100)` | nome de exibição ("Ala São Lourenço") |
| `descricao` | `varchar(150)` | opcional |
| `endereco` | `varchar(200)` | opcional, texto livre (rua/número) |
| `slug` | `text`, **único** | link público, gerado do nome por `gerarSlug()`. Check `ala_slug_formato`: `^[a-z0-9_-]{1,60}$` |
| `pais` | `char(2)` | ISO 3166-1 (`BR`, `AR`, `US`…). Check `ala_pais_formato`: `^[A-Z]{2}$` |
| `estado` | `varchar(60)` | Brasil: UF (`PR`); outros países: texto livre. Check `ala_estado_valido`: 1–60 caracteres, sem `<` `>` nem caracteres de controle, e **se `pais = 'BR'`, uma das 27 UFs** |
| `cidade` | `varchar(80)` | Check `ala_cidade_valida`: 2–80, sem `<` `>` nem controle |
| `fuso_horario` | `varchar(64)` | IANA (`America/Sao_Paulo`, `America/Manaus`…). Check `ala_fuso_formato`: `^[A-Za-z]+(/[A-Za-z0-9_+-]+)+$`. Se o nome existe de verdade é checado no app (`fusoValido`, com `Intl`): o check do Postgres não pode consultar tabela |

O **fuso** define o "hoje" (dia passado bloqueado), a janela de 2 meses e a virada
do mês **dessa ala** (ver [src_lib.md](src_lib.md)). Constantes de país/UF/fuso:
`src/lib/location.ts`.

Hoje há 3 alas (`ecoville`, `pilarzinho`, `sao_lourenco`), todas BR / PR /
Curitiba / `America/Sao_Paulo`. A ala de teste (`teste`) foi removida em
2026-10-24 e não existe mais.

### `agendamento`

| Coluna | Tipo | Regra |
|---|---|---|
| `id` | `integer` identity | PK; casa os eventos do Realtime |
| `ala_id` | `integer` | FK `fk_ala` → `ala(id)` **on delete cascade** |
| `data` | `date` | o dia do almoço |
| `nome` | `varchar(150)` | Check `agendamento_nome_valido`: 2–80 (após `btrim`), sem `<` `>` nem controle |
| `telefone` | `varchar(20)` | Check `agendamento_telefone_valido`: só dígitos, espaços e `+` (`^\+?[0-9 ]+$`) e **7–15 dígitos** (E.164). O formato é decidido por `normalizarTelefone` |
| `criado_em` | `timestamptz` | `default now()`; **NULL nas linhas anteriores a 2026-10-24** |

- **`agendamento_ala_data_unique unique (ala_id, data)`**: a regra **um almoço
  por dia, por ala**. A API trata a violação (`23505`). Este índice também atende
  **todas** as consultas por ala (+ intervalo de datas); não precisa de outro.
- Os checks espelham `src/lib/server/validation.ts`.
- **P-day (segunda) e dia passado NÃO são barrados aqui**: o líder pode mover um
  almoço para segunda ou para o passado. Só o `/api/agendar` (membro) recusa.

### `perfil`

1:1 com `auth.users`, criado pelo trigger no cadastro.

| Coluna | Regra |
|---|---|
| `id` | `uuid` PK → `auth.users(id)` **on delete cascade** |
| `nome` | `text not null default ''` (vem do `nome` dos metadados do cadastro) |
| `email` | `text` |
| `is_owner` | `boolean not null default false`: **owner** = acesso a todas as alas |
| `criado_em` | `timestamptz not null default now()` |

Para virar owner (no SQL Editor):

```sql
update public.perfil set is_owner = true where email = 'voce@exemplo.com';
```

### `ala_membro`

Vínculo usuário ↔ ala (o **member**).

| Coluna | Regra |
|---|---|
| `id` | `bigint` identity PK |
| `ala_id` | → `ala(id)` on delete cascade |
| `user_id` | → `auth.users(id)` on delete cascade |
| `status` | `'pendente'` (padrão) ou `'aprovado'` |
| `aprovado_por` | → `auth.users(id)` **on delete set null** (vira NULL se o aprovador for excluído) |
| `criado_em` | `timestamptz not null default now()` |

Índices:

- **`ala_membro_user_unico` único em `user_id`**: um vínculo por usuário (member = uma ala).
- `idx_ala_membro_ala_status (ala_id, status)`: card Usuários do painel.
- `idx_ala_membro_aprovado_por`: FK indexada.

## Trigger de cadastro

`public.handle_new_user()` roda `after insert on auth.users` (trigger
`on_auth_user_created`) e cria o `perfil` com `nome` (de `raw_user_meta_data ->>
'nome'`) e `email`. `on conflict (id) do nothing`.

- `security definer` com `set search_path to ''` (nomes sempre qualificados).
- Função `security definer` **não pode ficar exposta** em `/rest/v1/rpc`:
  `revoke execute ... from public, anon, authenticated` e `grant execute` só para
  `supabase_auth_admin`.

## RLS e permissões

- RLS **ligada nas quatro tabelas**.
- **Única policy**: `"leitura publica"` em `agendamento`, `for select to anon,
  authenticated using (true)`, com `grant select (id, ala_id, data, nome)`. É o
  que alimenta o calendário e o Realtime. **`telefone` e `criado_em` ficam fora**
  (permissão por coluna).
- `ala`, `perfil` e `ala_membro`: RLS ligada **sem policy** = acesso só pelo
  servidor. O aviso "RLS enabled no policy" do Advisor é **intencional**.

## Realtime

```sql
alter publication supabase_realtime add table public.agendamento;
alter table public.agendamento replica identity full;
```

- Publication: sem ela o WebSocket não atualiza ao vivo.
- `replica identity full`: em `DELETE`/`UPDATE` o Postgres manda a linha antiga
  inteira, e é isso que faz o filtro `ala_id` casar. Por padrão ele só envia a
  PK, e as **remoções não chegavam ao vivo**.
- O Realtime aplica a permissão por coluna: o `telefone` nunca vai no payload. Com
  RLS ligada, o `DELETE` chega ao navegador só com a PK. Ver [src_hooks.md](src_hooks.md).

## Migrations

Mudou o banco?

1. **Atualize `supabase/schema.sql`** (ele precisa continuar instalando um projeto
   novo igual à produção).
2. Escreva o SQL da mudança em `supabase/migrations/AAAAMMDDHHMMSS_nome.sql`, com
   comentários, idempotente quando der (`if not exists`, `drop constraint if
   exists`), em transação e com `set local lock_timeout`.
3. **Quem roda é o usuário**, no SQL Editor do Supabase. Não aplique pela MCP.
4. Depois de aplicada, o usuário pede para apagar o arquivo.

Nunca coloque SMTP ou configuração de e-mail em migration.

### Pendente

`20261024170000_ala_localizacao.sql` (país, estado, cidade e fuso da ala):

- **Parte 1, aplicada.** Criou as colunas com `DEFAULT` (BR / PR / Curitiba /
  `America/Sao_Paulo`), para o código antigo, que cria ala sem localização,
  continuar funcionando.
- **Parte 2, rodar só DEPOIS do deploy da `dev` na `master`.** Tira os
  `DEFAULT`s: daí em diante toda ala nova precisa vir com a localização de
  verdade (o formulário novo manda), em vez de virar "Curitiba" sem ninguém
  perceber. Rodar antes quebra a criação de ala do código que está no ar.

## Dados pessoais

O telefone de quem agenda **nunca chega ao navegador**: nem pela página, nem pela
API pública, nem pelo WebSocket, nem pela REST do Supabase com a chave anon
(permissão por coluna). Só o líder vê, no painel e na imagem do mês.

## Templates de e-mail (`supabase/email/`)

HTML dos e-mails do **Supabase Auth**, com a identidade do site (céu azul,
cartão branco, fitinha verde→rosa, florzinha, fonte Source Sans/Serif, texto em
português e botão grande). **Não são enviados pelo app**: são colados no painel
do Supabase em **Authentication → Email Templates**, com o assunto do arquivo
`.subject.txt` correspondente.

| Template | Assunto | Botão leva a |
|---|---|---|
| `confirm-signup` | Confirme seu cadastro no Almoço dos Missionários | `/auth/confirmar?…&type=email&next=/dashboard` |
| `reset-password` | Redefina sua senha do Almoço dos Missionários | `…&type=recovery&next=/redefinir-senha` |
| `invite-user` | Convite para o Almoço dos Missionários | `…&type=invite&next=/redefinir-senha` |
| `magic-link` | Seu link de acesso ao Almoço dos Missionários | `…&type=email&next=/dashboard` |
| `change-email` | Confirme a troca de e-mail do Almoço dos Missionários | `…&type=email_change&next=/dashboard` |
| `reauthentication` | Seu código de confirmação do Almoço dos Missionários | (código, sem link) |

Os links usam `{{ .SiteURL }}/auth/confirmar?token_hash={{ .TokenHash }}`, que
funciona mesmo abrindo o e-mail em outro aparelho (ver
[routes_auth-confirmar.md](routes_auth-confirmar.md)). O remetente padrão do
Supabase é `noreply@mail.app.supabase.io` (a tela de "esqueci a senha" avisa a
pessoa para procurar por ele).

Os avisos de calendário por e-mail para o líder (SMTP do Google) são outro
assunto, ainda em plano: `messages/emails-do-lider.txt`.
