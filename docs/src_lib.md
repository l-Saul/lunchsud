# `src/lib/`: regras e utilitários

| Pasta | Roda onde | Conteúdo |
|---|---|---|
| `src/lib/` | servidor **e** navegador | `date`, `phone`, `location`, `wards`, `scriptures`, `site-url` |
| `src/lib/server/` | **só servidor** | `public-ward`, `session`, `validation` |
| `src/lib/supabase/` | depende do cliente | `realtime`, `service-role`, `browser-session`, `server-session` |

Os arquivos de `src/lib/server/` (e o `service-role.ts`) importam
`'server-only'`: **se um componente do navegador importar, o build falha**,
em vez de mandar a chave service-role para o celular de quem acessa.

Regra: lógica de data, fuso, P-day, telefone e slug **só aqui**. Componentes
reutilizam, não duplicam.

---

## `date.ts`: datas, janela e P-day

Módulo central de datas. Datas trafegam como texto: `YYYY-MM-DD` (dia) e
`YYYY-MM` (mês). Texto nesse formato compara certo com `<`/`>=`.

O fuso padrão é `America/Sao_Paulo`, mas **quando houver uma ala em contexto,
passe o fuso dela** (`ala.fuso_horario`). O servidor roda em UTC: sem o fuso, o
mês "viraria" perto da meia-noite, e Manaus vira o dia 1 h depois de São Paulo.

| Função | Retorno | Regra |
|---|---|---|
| `getDashboardRange(timeZone?)` | `{ inicio, fim, hoje, mesAtual, mesSeguinte }` | `hoje` = data de agora no fuso dado (`Intl`, formato `en-CA` = `YYYY-MM-DD`). `inicio` = dia 1 do mês atual (inclusivo); `fim` = dia 1 do mês **após o seguinte** (exclusivo). A janela do membro é de `hoje` até `fim`. |
| `getHistoricoRange(mesesAtras = 3, timeZone?)` | `{ inicio, fim }` | Os N meses **anteriores** ao atual, sem o atual. Ex.: em junho com 3 → `[março-01, junho-01)` = mar, abr, mai. O painel não carrega histórico mais antigo. |
| `formatMonthLabel('2026-06')` | `'Junho 2026'` | nomes em português |
| `diaTile('2026-06-07')` | `{ dia: '7', mesAbrev: 'jun' }` | o medalhão de data do painel |
| `isPday('2026-06-08')` | `true` | segunda-feira? Calcula em UTC (`T00:00:00Z`), então não depende do fuso do servidor |
| `diasDisponiveisNoMes('2026-06')` | `26` | dias do mês menos as segundas (o "Y" do "X de Y dias") |

`isPday` é usado no calendário público, na imagem do mês e no `/api/agendar`.

---

## `phone.ts`: telefone

Lê qualquer telefone que a pessoa digitar (ou que o autopreenchimento do celular
colocar) e devolve o número arrumado. **Normaliza, não rejeita.** A mesma função
roda no formulário (membro e líder) e no servidor.

```ts
normalizarTelefone(valor: string): { formatado: string; internacional: boolean } | null
```

### Como lê (a ordem importa)

1. **Com `+` ou `00` na frente** → internacional: os primeiros dígitos são o
   país (qualquer país do mundo, até 15 dígitos, padrão E.164).
2. **Sem código do país** → Brasil primeiro (as alas são brasileiras):
   - 11 dígitos = celular (DDD + 9 + 8); 10 = fixo (DDD + 8);
   - o DDD precisa existir (lista `DDDS`);
   - fixo começa com 2–5;
   - **celular antigo digitado sem o 9** (8 dígitos começando com 6–9) **ganha o 9**;
   - zeros na frente ("041…", prefixo de discagem) saem.
3. **Brasil com 55 sem `+`** (12–13 dígitos começando com 55) → tira o 55. A
   regra é só pelo tamanho: um número brasileiro sem país tem no máximo 11
   dígitos, então isso não come o DDD 55 (RS).
4. **Sem `+` e não fecha como Brasil** → tenta **América Latina e
   EUA/Canadá/Caribe** (`PAISES_SEM_MAIS`: 1, 51–58, 501–509, 591–598). Ex.:
   "1 415 555 2671", "54 9 11 1234 5678", "598 9…". **Outros países só com `+`**,
   para um erro de digitação não virar telefone de outro país.

### Separar o país

Os códigos de país formam um conjunto "sem prefixo" (nenhum é começo de outro):
começa com 1 ou 7 → 1 dígito; está em `PAISES_2_DIGITOS` → 2; senão → 3. Assim dá
para separar o país de qualquer número do mundo.

### Formato gravado e mostrado

| Caso | Formato |
|---|---|
| Brasil celular | `41 99999 9999` (sem o 55, como os dados antigos) |
| Brasil fixo | `41 3333 4444` |
| EUA/Canadá (+1) | `+1 415 555 2671`; 10 dígitos, código de área e central não começam com 0/1 |
| Outros | `+54 911 1234 5678`: país + grupos de 4 a partir do fim, só para ficar legível; nacional com 4+ dígitos |

O banco confere de novo: só dígitos, espaços e `+`, com 7–15 dígitos
(`agendamento_telefone_valido`).

### No formulário

**Sem máscara enquanto digita.** Com tantos formatos ela nunca fica previsível,
e reescrever o campo a cada tecla joga o cursor para o fim (não dá para corrigir
um dígito no meio). O campo guarda o que a pessoa escreveu e só é arrumado ao
sair dele (`onBlur`), e de novo no servidor.

---

## `location.ts`: país, estado, cidade e fuso da ala

Só dados e validação, sem dependências. Usado no formulário de nova ala
(navegador) e na validação do servidor.

O **fuso** é o que importa para as regras de data: o "hoje" (dia passado
bloqueado), a janela de 2 meses e a virada do mês são calculados no fuso da ala.
No Brasil ele sai da UF; nos outros países o owner escolhe (EUA, México… têm
vários fusos).

| Export | Conteúdo |
|---|---|
| `FUSO_PADRAO` | `'America/Sao_Paulo'` |
| `UFS` | as 27 UFs: `{ sigla, nome, fuso }` (fuso da capital; ex. AM → `America/Manaus`, AC → `America/Rio_Branco`) |
| `PAISES` | países do foco (Brasil, América Latina, EUA, Canadá, Porto Rico, Rep. Dominicana): `{ codigo (ISO 2 letras), nome, fuso sugerido }`. O owner troca se a ala for em outro fuso do país |
| `fusoValido(fuso)` | formato IANA (`Continente/Cidade`) **e** conhecido pelo `Intl` (fuso inválido faz o `Intl` lançar `RangeError`) |
| `fusosDasAmericas()` | fusos `America/*` do `Intl.supportedValuesOf('timeZone')` (lista vazia se o navegador não suportar) |

---

## `wards.ts`: nome e slug da ala

Também importado pelo navegador (prévia do nome e do link ao criar ala). O
servidor usa as mesmas funções, então a prévia bate com o que é gravado.

### `normalizarNomeAla(nome)`

Nome de exibição, antes de gravar:

- espaços normalizados; **title case** (é nome próprio), com as preposições
  `de, da, do, das, dos, e` minúsculas no meio ("Ala Vila do Sol");
- garante o prefixo **"Ala "**: "são lourenço" → "Ala São Lourenço". Os acentos
  só existem se a pessoa digitar.

### `gerarSlug(nome)`

O link público (`/sao_lourenco`), na convenção do projeto. **Não invente outro
formato.**

1. separa letra e acento (`NFD`) e remove tudo que não é ASCII (tira acentos);
2. minúsculo; tira o "ala " da frente;
3. espaços e pontuação viram `_`; tira `_` das pontas;
4. no máximo 60 caracteres (sem `_` no fim).

Ex.: "Ala Jardim Brasil" → `jardim_brasil`. Sai no formato aceito pela validação
(`[a-z0-9_-]`). **Pode dar texto vazio** se o nome não tiver letras ou números:
quem chama trata (o servidor recusa).

---

## `scriptures.ts`: escrituras

`ESCRITURAS`: seis passagens do Livro de Mórmon de **força e esperança**, para
fortalecer os membros, no formato `«texto» — Referência`. Texto conferido na
versão oficial em português da Igreja.

`escrituraAleatoria()` sorteia uma. A home mostra uma a cada carregamento (ver
[routes_home.md](routes_home.md)).

---

## `site-url.ts`: URL pública do site

`siteUrl()` monta links absolutos, como o `redirectTo` do e-mail de redefinição
de senha, que precisa apontar para o site no ar e não para o localhost.

1. `NEXT_PUBLIC_BASE_URL` (sem `/` no fim), definida no ambiente como
   `https://lunchsud.vercel.app`. **Em produção é o que garante que o link do
   e-mail vá para o site no ar.**
2. Sem ela, no navegador: `window.location.origin` (bom o bastante em desenvolvimento).
3. No servidor sem a variável: `''`.

---

## `server/public-ward.ts`: dados da página pública

Usado pela página `/[slug]` e por `GET /api/agendamentos/[slug]`. Pelo
service-role, no servidor.

### `buscarAlaPorSlug(slugCru)` → `AlaPublica | null`

`AlaPublica = { id, nome, slug, fuso_horario }`.

- Envolvida em `cache()` do React: `generateMetadata` e a página fazem **uma**
  consulta só no mesmo carregamento.
- Passa por `parseSlug`: normaliza (link digitado com maiúscula funciona) e
  **descarta lixo sem consultar o banco** (robôs pedindo `/wp-login.php`, por
  exemplo). Slug inválido → `null` (vira 404).

### `buscarOcupados(ala)` → `DiaOcupado[] | null`

`DiaOcupado = { id, data, nome }`. O `id` casa com os eventos do Realtime (o
`DELETE` só traz o id).

- **Só a janela agendável**: de `hoje` até `fim` (`getDashboardRange` no fuso da
  ala). Dias passados aparecem bloqueados no calendário e não precisam de dados;
  sem esse filtro a lista crescia com todo o histórico.
- Seleciona `data::text` para manter `YYYY-MM-DD` sem fuso. Ordenado por data.
- **Nunca o telefone.** `null` = erro no banco.

---

## `server/session.ts`: quem está logado e o que pode

Contexto do líder a partir do Supabase Auth e das tabelas `perfil` e `ala_membro`
(lidas pelo service-role, sem depender de RLS).

```ts
type Contexto = { userId: string; nome: string; isOwner: boolean; alaId: number | null }
```

| Função | O que faz |
|---|---|
| `getUsuario()` | usuário do Supabase Auth (`auth.getUser()`, pelo cliente de cookies) ou `null` |
| `getContexto()` | monta o `Contexto`, ou `null` sem login (abaixo) |
| `requireAcesso()` | para páginas: sem login → `redirect('/admin')`; member sem ala → `redirect('/acesso')`; senão o contexto |
| `podeEditarAla(userId, isOwner, alaId)` | owner sempre; member só se tiver vínculo **aprovado** nessa ala |

### Ala em foco (`alaId`)

- **owner** (`perfil.is_owner`): acessa todas as alas. A ala em foco vem do
  cookie **`ala_atual`** (gravado por `/api/ala-atual`) ou, sem cookie, é a
  primeira ala por nome.
- **member**: a ala do vínculo `aprovado` (uma só). Sem vínculo aprovado → `null`.

---

## `server/validation.ts`: entrada das rotas

Princípio: **tudo que vem do cliente é hostil até prova em contrário.** Limita
tamanho, formato e conjunto de caracteres **antes** de tocar no banco.

`ValidationError`: as rotas pegam com `try/catch` e respondem 400 com mensagem
nossa, sem ecoar detalhes que ajudem a sondar a API.

### `lerJson(req, maxBytes = 10_000)`

1. `Content-Type` precisa conter `application/json`.
2. Recusa cedo pelo `Content-Length` declarado, antes de ler o corpo.
3. Lê o texto e confere o tamanho de novo (o cabeçalho pode mentir).
4. `JSON.parse`; inválido → `ValidationError('JSON inválido')`.

Evita payloads gigantes e corpos malformados.

### Regras de campo (internas)

| Campo | Regra |
|---|---|
| nome | espaços normalizados, 2–80 caracteres, sem `<` `>` (anti-HTML/script) nem caracteres de controle (`\p{Cc}`) |
| telefone | `normalizarTelefone` sobre no máximo 40 caracteres; grava o `formatado` |
| data | `^\d{4}-\d{2}-\d{2}$` e data real (`Date.parse`) |
| id | inteiro positivo |
| slug | `^[a-z0-9_-]{1,60}$`, minúsculo. O `_` entra pela convenção de nomes ("Jardim Brasil" → `jardim_brasil`) |
| endereço | opcional; até 200, sem `<` `>` nem controle; vazio vira `null` |
| cidade (sempre) e estado (fora do BR) | texto com espaços normalizados, cidade 2–80 e estado 1–60, sem `<` `>` nem controle |

### Parsers

| Parser | Rota | Retorno |
|---|---|---|
| `parseAgendar` | `/api/agendar` | `{ slug, data, nome, telefone }` |
| `parseEdicao` | `/api/agendamentos/update` | `{ id, data, nome, telefone }` |
| `parseId` | `/api/agendamentos/delete` | `id` |
| `parseMembroId` | `/api/acesso/aprovar`, `/remover` | `membroId` |
| `parseAlaId` | `/api/acesso/solicitar`, `/api/ala-atual` | `alaId` |
| `parseSlug` | slug da URL (`buscarAlaPorSlug`) | slug minúsculo |
| `parseNovaAla` | `/api/alas/criar` | `{ nome, slug, endereco, pais, estado, cidade, fuso }` |

`parseNovaAla`: nome saneado e normalizado (`normalizarNomeAla`); **slug sempre
gerado do nome** (`gerarSlug`); país da lista `PAISES`; no Brasil o estado é uma
UF e o **fuso sai dela**; fora, estado livre (1–60) e fuso validado por
`fusoValido`; cidade 2–80; endereço opcional. As mensagens ("Escolha o país.",
"Escolha o estado.", "Informe o estado ou província.", "Escolha o fuso
horário.", "Informe a cidade.", "Não foi possível gerar um link válido a partir
desse nome") são escritas para o owner e devolvidas pela rota.

Os checks do banco espelham estas regras (ver [database.md](database.md)).

---

## `supabase/`: clientes do Supabase

| Arquivo | Onde | Chave | Para quê |
|---|---|---|---|
| `realtime.ts` | navegador | anon | **só o WebSocket** (Realtime) do calendário |
| `service-role.ts` | **só servidor** (`server-only`) | service_role | ler e escrever no banco; **ignora a RLS** |
| `browser-session.ts` | navegador (`'use client'`) | anon | login, cadastro, logout e senha do líder (sessão em cookies) |
| `server-session.ts` | servidor | anon | descobrir **quem** está logado pelos cookies; respeita a sessão e a RLS |

### `realtime.ts`

`realtimeClient`: um `RealtimeClient` do `@supabase/realtime-js` apontando para
`wss://<projeto>/realtime/v1`, com a chave anon em `params.apikey` e no
`accessToken` (URL e autenticação iguais às que o supabase-js monta por dentro).
**Não troque pelo supabase-js completo**: ele traz login, storage e functions
que o navegador do membro não usa (~57 KB gzip a mais na página pública).

### `service-role.ts`

`supabaseServer`: `createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)`. Uso
exclusivo em rotas e Server Components. **Nunca importar em código que vai para
o navegador** (o `import 'server-only'` faz o build falhar).

### `browser-session.ts`

`criarSupabaseBrowser()`: `createBrowserClient` do `@supabase/ssr` com a chave
anon. A sessão do Supabase Auth fica em cookies, lidos no servidor (o
`proxy.ts` renova). Os componentes guardam a instância com
`useState(() => criarSupabaseBrowser())`.

### `server-session.ts`

`criarSupabaseServidor()`: `createServerClient` ligado aos cookies da
requisição (`next/headers`). Diferente do `service-role.ts` (sem usuário): este
sabe quem está logado. Em Server Components o `setAll` pode falhar (não dá para
gravar cookie no meio do render); o erro é ignorado de propósito, porque o
`proxy.ts` é quem renova a sessão.
