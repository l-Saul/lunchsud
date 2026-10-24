# `/api/*`: rotas de API

Route handlers do Next (`src/app/api/**/route.ts`). **As URLs são contrato
público**, em português: nunca renomeie as pastas.

## Resumo

| Método e rota | Quem chama | Acesso | Proxy |
|---|---|---|---|
| `POST /api/agendar` | `BookingModal` (página da ala) | público (sem conta) | não |
| `GET /api/agendamentos/[slug]` | `WardBooking` (ressincronizar) | público | não |
| `GET /api/alas` | home (SWR) | público | não |
| `POST /api/agendamentos/update` | `EditBookingModal` | líder, ala em foco | sim |
| `POST /api/agendamentos/delete` | `EditBookingModal` | líder, ala em foco | sim |
| `POST /api/acesso/solicitar` | `RequestAccess` | logado | sim |
| `POST /api/acesso/aprovar` | `UsersCard` | owner ou member aprovado da mesma ala | sim |
| `POST /api/acesso/remover` | `UsersCard` | owner ou member aprovado da mesma ala | sim |
| `POST /api/ala-atual` | `WardSwitcher` | owner | sim |
| `POST /api/alas/criar` | `CreateWardForm` | owner | sim |

"Proxy" = a rota está no `matcher` do `src/proxy.ts`, que renova a sessão do
Supabase Auth antes. **Rota nova que leia sessão (`getUsuario`/`getContexto`)
precisa entrar no matcher.** As rotas públicas ficam fora, sem esse passo extra.

## Padrões de todas as rotas

- **Entrada sempre validada** por `src/lib/server/validation.ts`: `lerJson(req)`
  (exige `Content-Type: application/json`, teto de 10.000 bytes pelo
  `Content-Length` e pelo corpo lido, JSON válido) e um `parse*` por rota. Nunca
  ler `req.json()` cru nem gravar campo sem sanear. Detalhes em [src_lib.md](src_lib.md).
- **Banco pelo service-role** (`supabaseServer`), que ignora a RLS. A
  autorização é feita **aqui**: `getContexto()` + `podeEditarAla()` e filtro por
  `ala_id` nas escritas.
- **Nunca ecoar `error.message` do banco** (vaza detalhes). As respostas de erro
  são textos nossos. Exceção consciente: `/api/alas/criar` devolve a mensagem da
  `ValidationError`, que é escrita por nós, para o owner.
- Códigos do Postgres tratados: `23505` (unique violado) e `23514` (check violado).
- **Sem limite por IP** (removido em 2026-10-24): no Wi-Fi da igreja muitas
  pessoas saem pelo mesmo IP e eram bloqueadas. Se houver abuso, usar regra de
  rate limit do Firewall da Vercel na rota, não limite em memória.

## `POST /api/agendar`

Cria um agendamento **público, sem conta**. É a **fonte da verdade** das regras
do membro. As mensagens de erro aparecem **direto na tela do membro**: escreva
para ele.

Corpo: `{ slug, data, nome, telefone }` → `parseAgendar`:

| Campo | Regra |
|---|---|
| `slug` | minúsculo, `^[a-z0-9_-]{1,60}$` |
| `data` | `YYYY-MM-DD` e data real |
| `nome` | espaços normalizados, 2–80 caracteres, sem `<` `>` nem caracteres de controle |
| `telefone` | `normalizarTelefone` (até 40 caracteres lidos); grava o formato normalizado |

Ordem das checagens e respostas:

| # | Checagem | Status | `error` |
|---|---|---|---|
| 1 | entrada inválida (`ValidationError`) | 400 | "Confira o nome e o telefone e tente de novo." |
| 1 | outra falha ao ler o corpo | 400 | "Não foi possível agendar. Tente de novo." |
| 2 | segunda-feira (`isPday`), mesmo se a tela for burlada | 400 | "Segunda-feira é P-day. Escolha outro dia." |
| 3 | ala não existe (`buscarAlaPorSlug`) | 404 | "Ala não encontrada." |
| 4 | `data < hoje` (fuso da ala) | 400 | "Esse dia já passou. Escolha outro dia." |
| 4 | `data >= fim` (após o mês seguinte; impede encher anos de calendário) | 400 | "Esse dia está fora do período de agendamento. Escolha outro dia." |
| 5 | insert: `23505` (dia ocupado nesse meio-tempo) | 409 | "Este dia acabou de ser ocupado. Escolha outro." |
| 5 | insert: `23514` (o banco recusou nome/telefone; tentar de novo não adianta) | 400 | "Confira o nome e o telefone e tente de novo." |
| 5 | outro erro do banco | 500 | "Não foi possível agendar agora. Tente de novo em instantes." |

Sucesso: `{ success: true, id }`. O `id` vem do `RETURNING` do insert (sem
consulta extra) e casa com o evento do WebSocket que chega em seguida.

A tela trata o 409 à parte (fecha o modal, avisa e atualiza o calendário); os
outros erros aparecem no modal. Ver [routes_slug.md](routes_slug.md).

## `GET /api/agendamentos/[slug]`

Dias ocupados de uma ala, **só na janela agendável** (de hoje até o fim do mês
seguinte, no fuso da ala): `[{ id, data, nome }]`, por data. **Nunca o telefone.**

A página pública chama esta rota **só para ressincronizar**: quando o WebSocket
reconecta (inclusive ao voltar para a aba) e depois de um conflito 409. As
mudanças do dia a dia chegam prontas pelo WebSocket.

| Situação | Resposta |
|---|---|
| slug inválido ou ala inexistente | 404 `{ error: 'Ala não encontrada' }` |
| erro no banco | 500 `{ error: 'Erro ao buscar agendamentos' }` |

Usa `buscarAlaPorSlug` + `buscarOcupados` (as mesmas funções da página).

## `GET /api/alas`

Todas as alas, `[{ nome, slug }]` em ordem alfabética, para os botões da home.
`dynamic = 'force-dynamic'`: sempre consulta o banco (sem isso o Next poderia
congelar a lista no build). Erro → 500 `{ error: 'Erro ao buscar alas' }`.

## `POST /api/agendamentos/update`

O líder edita **data, nome e telefone** de um almoço da **ala em foco**.

- Sem login **ou sem ala em foco** → 401 `{ error: 'Não autenticado' }`.
- Corpo `{ id, data, nome, telefone }` → `parseEdicao` (mesmas regras de nome,
  telefone e data do agendar; `id` inteiro positivo). Inválido → 400 "Dados
  inválidos" (ou "Requisição inválida").
- `update ... where id = :id and ala_id = :alaEmFoco`. O filtro por `ala_id`
  garante o escopo (member: sua ala; owner: a selecionada).
- **Sem regra de P-day, passado ou janela:** o líder pode mover para qualquer
  data. O banco ainda impõe um almoço por dia.
- Erro do banco (inclusive data já ocupada) → 400 "Erro ao atualizar". Nenhuma
  linha afetada (id inexistente ou de outra ala) → 404 "Nenhuma linha afetada".
- Sucesso: `{ ok: true }`.

## `POST /api/agendamentos/delete`

Remove um almoço da **ala em foco**. Mesma autenticação e escopo do update.
Corpo `{ id }` → `parseId`. `delete ... where id and ala_id = alaEmFoco` (a trava
que só apaga da ala em foco). Erro do banco → 400 "Erro ao remover"; nenhuma
linha → 404 "Nenhuma linha afetada"; sucesso `{ ok: true }`.

## `POST /api/acesso/solicitar`

Usuário **logado** pede acesso a **uma** ala (cria vínculo `pendente`).

- Sem login → 401. Corpo `{ alaId }` → `parseAlaId`; inválido → 400.
- **Member = uma ala:** já tem qualquer vínculo (pendente ou aprovado) → 409
  "Você já tem um vínculo de ala.".
- Ala inexistente → 404. Corrida que esbarra no índice único (`23505`) → 409
  "Acesso já solicitado.". Outro erro → 500.
- Sucesso: `{ ok: true }`.

## `POST /api/acesso/aprovar`

Aprova um vínculo pendente: `status = 'aprovado'`, `aprovado_por = quem aprovou`.

- Sem login → 401. Corpo `{ membroId }` (id do vínculo `ala_membro`) →
  `parseMembroId`; inválido → 400. Vínculo inexistente → 404.
- **Quem pode** (`podeEditarAla`): o owner (qualquer ala) ou um member **já
  aprovado da mesma ala** do pedido. Senão 403 "Sem permissão".
- Erro → 500 "Erro ao aprovar". Sucesso `{ ok: true }`.

## `POST /api/acesso/remover`

Apaga um vínculo (tira o acesso daquela pessoa à ala). Mesmas regras do
aprovar. A pessoa volta a cair em `/acesso` e pode pedir de novo. Erro → 500
"Erro ao remover".

## `POST /api/ala-atual`

O owner troca a **ala em foco** do painel.

- Sem login → 401; não é owner → 403 (member tem uma ala só).
- Corpo `{ alaId }` → `parseAlaId`; ala inexistente → 404.
- Grava o cookie **`ala_atual`** (`httpOnly`, `sameSite: 'lax'`, `path: '/'`,
  1 ano), lido por `getContexto()`.
- Sucesso `{ ok: true }`.

## `POST /api/alas/criar`

O owner cria uma ala.

- Sem login → 401; não é owner → 403.
- Corpo `{ nome, endereco, pais, estado, cidade, fuso }` → `parseNovaAla`:
  - `nome` saneado e normalizado (`normalizarNomeAla`: title case, prefixo "Ala ");
  - `slug` **sempre gerado do nome** (`gerarSlug`), nunca vem do cliente; se não
    der um slug válido → "Não foi possível gerar um link válido a partir desse nome";
  - `pais` da lista `PAISES` ("Escolha o país."); Brasil: `estado` é uma UF
    ("Escolha o estado.") e o **fuso sai da UF**; outros países: estado em texto
    livre ("Informe o estado ou província.") e `fuso` validado com
    `fusoValido` ("Escolha o fuso horário.");
  - `cidade` 2–80 ("Informe a cidade."); `endereco` opcional até 200 (vazio vira `null`).
  - Erro de validação → 400 com **a mensagem acima** (para o owner).
- Slug já usado → 409 `Já existe uma ala no endereço "<slug>".` (checado antes e
  de novo no `23505`, se houver corrida). Outro erro → 500 "Erro ao criar ala".
- Sucesso: `{ ok: true, ala: { id, nome, slug } }`. O formulário usa o `id`
  para já entrar na ala nova.
