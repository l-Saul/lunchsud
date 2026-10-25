# `/api/*`: rotas de API

Route handlers do Next (`src/app/api/**/route.ts`). **As URLs são contrato
público**, em português: nunca renomeie as pastas.

## Resumo

| Método e rota | Quem chama | Acesso | Proxy |
|---|---|---|---|
| `POST /api/agendar` | `BookingModal` (página da ala) | público (sem conta) | não |
| `GET /api/agendamentos/[slug]` | `WardBooking` (ressincronizar) | público | não |
| `GET /api/agenda/[slug]?data=` | `BookingModal` (confirmação, aparelhos Apple) | público | não |
| `GET /api/alas` | home (SWR) | público | não |
| `POST /api/alas/pedir` | `WardForm` (home e `/acesso`, "Pedir para usar o calendário") | público (sem conta), ou logado para usar a própria conta | sim |
| `GET /api/conta` | `RequestWard` (home, ao abrir o pedido) | público (diz se há alguém logado) | sim |
| `POST /api/agendamentos/update` | `EditBookingModal` | líder, ala em foco | sim |
| `POST /api/agendamentos/delete` | `EditBookingModal` | líder, ala em foco | sim |
| `POST /api/acesso/solicitar` | `RequestAccess` | logado | sim |
| `POST /api/acesso/aprovar` | `UsersCard` | owner ou member aprovado da mesma ala | sim |
| `POST /api/acesso/remover` | `UsersCard` | owner ou member aprovado da mesma ala | sim |
| `POST /api/ala-atual` | `WardSwitcher` | owner | sim |
| `POST /api/alas/criar` | `WardForm` (modal do owner) | owner | sim |
| `POST /api/alas/aprovar` | `WardSwitcher` (pedidos) | owner | sim |
| `POST /api/alas/recusar` | `WardSwitcher` (pedidos) | owner | sim |
| `POST /api/avisos/preferencias` | `NotificationsCard` | líder, na ala em foco | sim |
| `GET /api/cron/avisos` | Vercel Cron (todo dia, 11:00 UTC = 08:00 em São Paulo) | `CRON_SECRET` | não |

"Proxy" = a rota está no `matcher` do `src/proxy.ts`, que renova a sessão do
Supabase Auth antes. **Rota nova que leia sessão (`getUsuario`/`getContexto`)
precisa entrar no matcher.** As rotas públicas e o cron (sem sessão) ficam fora.

## Padrões de todas as rotas

- **Entrada sempre validada** por `src/lib/server/validation.ts`: `lerJson(req)`
  (exige `Content-Type: application/json`, teto de 10.000 bytes pelo
  `Content-Length` e pelo corpo lido, JSON válido) e um `parse*` por rota. Nunca
  ler `req.json()` cru nem gravar campo sem sanear. Detalhes em [src_lib.md](src_lib.md).
- **Banco pelo service-role** (`supabaseServer`), que ignora a RLS. A
  autorização é feita **aqui**: `getContexto()` + `podeEditarAla()` e filtro por
  `ala_id` nas escritas.
- **Nunca ecoar `error.message` do banco** (vaza detalhes). As respostas de erro
  são textos nossos. Exceção consciente: `/api/alas/criar` e `/api/alas/pedir`
  devolvem a mensagem da `ValidationError`, que é escrita por nós, para a pessoa.
- **Só alas ativas são públicas.** Ala `pendente` (pedido pela home, ainda não
  aprovado) não aparece em `/api/alas`, não abre a página `/[slug]`, não aceita
  agendamento, não pode virar ala em foco (`/api/ala-atual`) nem receber pedido
  de acesso (`/api/acesso/solicitar`). Ver [database.md](database.md).
- Códigos do Postgres tratados: `23505` (unique violado) e `23514` (check violado).
- **Sem limite por IP** (removido em 2026-10-24): no Wi-Fi da igreja muitas
  pessoas saem pelo mesmo IP e eram bloqueadas. Se houver abuso, usar regra de
  rate limit do Firewall da Vercel na rota, não limite em memória.
- **E-mail nunca segura a resposta.** Aviso disparado por uma rota roda em
  `after()` (`next/server`): a resposta sai antes e o envio continua depois.
  Falha no envio só vai para o log; nunca desfaz nem trava a ação.

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

Depois da resposta (`after`), **se a data é do mês atual** da ala (no fuso da
ala), manda o aviso **"Novo almoço no dia X"** a quem ligou "Novo almoço neste
mês" nesta ala (`avisarNovoAlmoco`). Almoço agendado para o mês seguinte não
avisa (ele aparece no aviso "Almoços do mês seguinte"). A senhora não espera o
e-mail. É o único aviso de almoço "na hora": editar e remover são feitos pelo
próprio líder no painel, então não avisam ninguém.

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

## `GET /api/agenda/[slug]?data=AAAA-MM-DD`

O almoço como arquivo de agenda (`.ics`), para o botão "Adicionar à agenda do
celular" no iPhone/iPad/Mac. Servido pelo site porque `.ics` gerado no
navegador costuma não abrir a Agenda no Safari.

- `data` por `parseData`; ala por `buscarAlaPorSlug` (o nome vem **do banco**,
  nunca da URL: nada do usuário entra no arquivo).
- Resposta: `text/calendar; charset=utf-8`,
  `Content-Disposition: attachment; filename="almoco-dos-missionarios.ics"`,
  `Cache-Control: no-store`. Conteúdo: `arquivoIcs` de
  [src_lib.md](src_lib.md) (dia inteiro + lembrete na véspera às 9h).
- Não confere se existe agendamento: é só o evento de um dia, sem dado pessoal.

| Situação | Resposta |
|---|---|
| `data` ausente ou inválida | 400 `{ error: 'Data inválida' }` |
| slug inválido ou ala inexistente | 404 `{ error: 'Ala não encontrada' }` |

## `GET /api/alas`

As alas **ativas**, `[{ nome, slug, estado, cidade }]` em ordem alfabética,
para a busca da home (estado → cidade → ala, no `WardFilter`).
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
- Data já ocupada nessa ala (`23505`) → 409 "Já há um almoço nesse dia.". Outro
  erro do banco → 400 "Erro ao atualizar". Nenhuma linha afetada (id inexistente
  ou de outra ala) → 404 "Nenhuma linha afetada".
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
- Ala inexistente **ou pendente** → 404. Corrida que esbarra no índice único (`23505`) → 409
  "Acesso já solicitado.". Outro erro → 500.
- Sucesso: `{ ok: true }`. Depois da resposta (`after`), manda o e-mail **"\<nome\>
  pediu para entrar no painel"** a quem ligou o aviso "Pedido para entrar no
  painel" **nesta ala** e tem acesso a ela (member aprovado ou owner), menos o
  próprio solicitante (`avisarPedidoDeAcesso`).

## `POST /api/acesso/aprovar`

Aprova um vínculo pendente: `status = 'aprovado'`, `aprovado_por = quem aprovou`.

- Sem login → 401. Corpo `{ membroId }` (id do vínculo `ala_membro`) →
  `parseMembroId`; inválido → 400. Vínculo inexistente → 404.
- **Quem pode** (`podeEditarAla`): o owner (qualquer ala) ou um member **já
  aprovado da mesma ala** do pedido. Senão 403 "Sem permissão".
- **A ala precisa estar ativa:** pendente → 409 "Aprove a ala antes de aprovar o
  líder." (os dois passos do pedido de ala nova: primeiro a ala, depois o líder).
- Erro → 500 "Erro ao aprovar". Sucesso `{ ok: true }`.
- Se o vínculo **estava pendente**, depois da resposta (`after`) manda à pessoa
  aprovada o e-mail **"Pedido aprovado"** (sempre, sem preferência). Aprovar de
  novo um vínculo já aprovado não reenvia.

## `POST /api/acesso/remover`

Apaga um vínculo (tira o acesso daquela pessoa à ala). Mesmas regras do
aprovar. A pessoa **pode** tirar o próprio acesso (o cartão avisa antes,
principalmente se ela for a única com acesso à ala). A pessoa volta a cair em `/acesso` e pode pedir de novo. Erro → 500
"Erro ao remover".

## `POST /api/ala-atual`

O owner troca a **ala em foco** do painel.

- Sem login → 401; não é owner → 403 (member tem uma ala só).
- Corpo `{ alaId }` → `parseAlaId`; ala inexistente **ou pendente** → 404.
- Grava o cookie **`ala_atual`** (`httpOnly`, `sameSite: 'lax'`, `path: '/'`,
  1 ano), lido por `getContexto()`.
- Sucesso `{ ok: true }`.

## `POST /api/alas/criar`

O owner cria uma ala, que já nasce **ativa** (sem líder; o owner aprova quem
pedir acesso depois).

- Sem login → 401; não é owner → 403.
- Corpo `{ tipo, nome, estado, cidade }` → `parseNovaAla` (detalhes em
  [src_lib.md](src_lib.md)):
  - **Só Brasil:** não há país. `estado` é uma UF ("Escolha o estado.") e o
    **fuso sai da UF**;
  - `tipo` `'ala'` ou `'ramo'` (qualquer outra coisa vira `'ala'`); `nome` sem
    o tipo, 2–80 ("Digite o nome da ala." / "Digite o nome do ramo."), gravado
    com o prefixo ("Ala São Lourenço", "Ramo Centro");
  - `cidade` 2–80, nome próprio ("Digite a cidade.");
  - `slug` **sempre gerado** (`gerarSlug(uf, cidade, nome)` →
    `pr_curitiba_sao-lourenco`: `_` entre as partes, `-` nos espaços), nunca
    vem do cliente. Nome ou cidade sem letra nem número → "Escreva o nome e a
    cidade com letras ou números.". **Sem endereço.**
  - Erro de validação → 400 com **a mensagem acima**.
- Slug já usado (ativa ou pendente) → 409 `A <nome>, de <cidade>, já existe (ou
  já foi pedida).` (checado antes e de novo no `23505`). Outro erro → 500
  "Erro ao criar ala".
- Sucesso: `{ ok: true, ala: { id, nome, slug } }`. O formulário usa o `id`
  para já entrar na ala nova.

## `POST /api/alas/pedir`

A presidência de uma ala que ainda não está no site pede para usar o calendário
(grupo "Sua ala ou ramo ainda não usa o calendário?" da home). **Público, sem conta**:
cria a ala **pendente** e a **conta nova** do líder responsável, com vínculo
pendente. Nada aparece no site até o owner aprovar (dois passos: a ala, depois o
líder, no cartão Usuários da ala).

- Corpo `{ tipo, nome, estado, cidade, lider: { nome, email, senha }, website,
  tempo }` (ou `usarConta: true` no lugar de `lider`) → `parsePedidoAla` (as mesmas regras de ala do `criar`; líder: nome
  2–80, e-mail válido em minúsculas, senha 6–72). Erro → 400 com a mensagem.
- **Contra robô** (sem limite por IP, que barrava o Wi-Fi da igreja):
  1. **Campo-armadilha** `website`, escondido fora da tela (`aria-hidden`,
     `tabIndex -1`): veio preenchido → responde `{ ok: true }` **sem fazer nada**
     (o robô acha que deu certo);
  2. **Tempo mínimo:** `tempo` = milissegundos desde que o formulário abriu,
     medido no celular (sem depender do relógio dele). Menos de 5 s
     (`TEMPO_MINIMO_PEDIDO_MS`) → 400 "Confira os dados e toque em Enviar pedido
     de novo.";
  3. **Teto de pedidos:** com 10 alas pendentes (`LIMITE_PEDIDOS_PENDENTES`) → 429
     "Há muitos pedidos esperando aprovação agora. Tente de novo daqui a alguns
     dias." Um robô cria no máximo 10 pedidos (e 10 e-mails) até o owner olhar;
  4. **Nada fica público** antes da aprovação.
  Se mesmo assim houver abuso, a saída é uma regra de rate limit no Firewall da
  Vercel para esta rota.
- **Ala repetida:** slug já existe → 409 "A \<ala\>, de \<cidade\>, já usa o
  calendário. Procure por ela na página inicial." (ativa) ou "…já foi pedida e
  está esperando aprovação." (pendente).
- **Líder com conta nova** (`lider`): e-mail que já tem conta → 409 "Este
  e-mail já tem conta no painel. Use outro e-mail para o líder responsável." A
  conta é criada pelo service-role (`auth.admin.createUser`, e-mail já
  confirmado, nome em `user_metadata`), sem mandar e-mail.
- **Líder com a própria conta** (`usarConta: true`, quem já está logado): a
  rota lê a sessão (`getUsuario`, por isso está no matcher do proxy). Sem
  sessão → 401 "Sua sessão terminou. Entre de novo no painel ou escolha "Conta
  nova"." Com sessão, o vínculo que a pessoa tinha (de outra ala, aprovado
  ou pendente) **é apagado** e entra o pendente da ala nova: ela perde o acesso
  antigo (a tela avisa antes). `pedido_conta_nova = false`: recusar o pedido
  não apaga essa conta.
- Grava a ala (`status 'pendente'`, `pedido_por`, `pedido_conta_nova`) e o
  vínculo pendente. Falhou no meio → desfaz o que já gravou (ala, conta nova e,
  com a própria conta, devolve o vínculo antigo) e responde 500 "Não foi
  possível enviar o pedido. Tente de novo."
- Sucesso `{ ok: true }`. Depois da resposta (`after`), manda a **todos os
  owners** o e-mail **"Pedido de nova ala"** (sempre, sem preferência;
  `avisarPedidoDeAla`).

## `GET /api/conta`

Diz ao formulário de pedido de ala se há alguém logado, para oferecer "Minha
conta". Pública (sem login responde `{ logado: false }`, 200) e no matcher
do proxy (lê a sessão). Logado: `{ logado: true, nome, email, ala }`, em que
`ala` é o nome da ala do vínculo da pessoa (aprovado ou pendente) ou `null`.
`dynamic = 'force-dynamic'`. Nunca devolve mais que isso.

## `POST /api/alas/aprovar`

O owner aprova uma ala pendente (passo 1 de 2): `status = 'ativa'`.

- Sem login → 401; não é owner → 403. Corpo `{ alaId }` → `parseAlaId`.
- Só muda se ainda estiver pendente; senão 404 "Pedido não encontrado". Erro →
  500 "Não foi possível aprovar. Tente de novo."
- Sucesso `{ ok: true }`. O modal do owner já põe a ala em foco: no cartão
  Usuários dela aparece o líder esperando (passo 2, `/api/acesso/aprovar`, que
  manda o "Pedido aprovado" ao líder).

## `POST /api/alas/recusar`

O owner recusa um pedido: apaga a ala pendente (o vínculo vai junto, em
cascata) e, se a conta foi criada no pedido, **apaga a conta** também (desde que
ela não tenha outro vínculo nem seja owner). `recusarPedido` em
`src/lib/server/ward-request.ts`.

- Sem login → 401; não é owner → 403. Corpo `{ alaId }`.
- Ala não pendente ou inexistente → 404 "Pedido não encontrado".
- Sucesso `{ ok: true }`. Sem e-mail para quem pediu.

## `POST /api/avisos/preferencias`

Grava quais avisos por e-mail o líder quer receber **na ala em foco** (card
Notificações). A notificação é sempre **usuário + ala**; o owner não tem regra
especial. O card manda **todas** as chaves a cada toque.

- Sem login → 401. Sem ala em foco → 403 "Sem permissão".
- Corpo `{ alaId, novo_almoco, dia_sem_almoco, proximo_mes, semana,
  pedido_acesso }` → `parseAlaId` + `parsePreferencias` (as cinco chaves precisam
  ser `true`/`false`). Inválido → 400 "Dados inválidos".
- `alaId` diferente da ala em foco (o owner trocou de ala em outra aba) → 409
  "A página está desatualizada. Atualize a página." A ala gravada é sempre a da
  sessão, nunca uma escolhida pelo cliente.
- `upsert` em `email_preferencia` por `(user_id, ala_id)`.
- Erro no banco → 500 "Erro ao salvar". Sucesso `{ ok: true }`.

## `GET /api/cron/avisos`

Disparo diário dos **lembretes e resumos**, chamado pelo **Vercel Cron**
(`vercel.json`: `"0 11 * * *"`, 11:00 UTC = 08:00 em São Paulo; no plano Hobby
pode atrasar até ~1 hora). Não fica no `matcher` do proxy (não há sessão).

- **Protegido por `CRON_SECRET`**: a Vercel manda `Authorization: Bearer
  <CRON_SECRET>`. Sem a variável definida, ou com o cabeçalho errado → 401
  "Não autorizado" (fecha por padrão).
- `dynamic = 'force-dynamic'`, `maxDuration = 60` s.
- Roda `rodarAvisosDoDia()` (regras em [src_lib.md](src_lib.md)) e devolve só
  contagens, sem dados pessoais: `{ planejados, repetidos, enviados, falharam,
  desligados }`.
- Falha geral (ex.: banco fora) → 500 "Falha ao rodar os avisos".
- Rodar de novo no mesmo dia **não repete e-mail** (registro em `email_envio`).

Para testar localmente: defina `CRON_SECRET` e `EMAIL_TESTE_PARA` no `.env` e
chame com `curl -H "Authorization: Bearer $CRON_SECRET" localhost:3000/api/cron/avisos`.
Fora de produção **todo e-mail vai só para `EMAIL_TESTE_PARA`** e nada é gravado
em `email_envio` (o banco local é o de produção).
