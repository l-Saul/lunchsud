# `src/lib/`: regras e utilitários

| Pasta | Roda onde | Conteúdo |
|---|---|---|
| `src/lib/` | servidor **e** navegador | `date`, `phone`, `location`, `wards`, `site-url`, `email-preferences`, `calendar-event` |
| `src/lib/server/` | **só servidor** | `public-ward`, `session`, `validation`, `mailer`, `email-templates`, `notifications` |
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
| `diaTile('2026-06-07')` | `{ dia: '7', semana: 'dom' }` | o medalhão de data do painel (dia da semana em UTC ao meio-dia, sem depender do fuso) |
| `isPday('2026-06-08')` | `true` | segunda-feira? Calcula em UTC (`T00:00:00Z`), então não depende do fuso do servidor |
| `diasDisponiveisNoMes('2026-06')` | `26` | dias do mês menos as segundas (o "Y" do "X de Y dias") |
| `nomeDoMes('2026-12')` | `'Dezembro'` | só o nome do mês |
| `somarDias('2026-10-30', 3)` | `'2026-11-02'` | soma dias em texto `YYYY-MM-DD` (conta em UTC, ao meio-dia, sem efeito de fuso) |
| `dataPorExtenso('2026-04-16')` | `'quinta-feira, 16 de abril'` | data por extenso dos e-mails |
| `diaDaSemanaEDia('2026-10-27')` | `'terça-feira, 27'` | linha do e-mail da semana |
| `tituloDoDia('2026-11-12')` | `'Quinta-feira, 12 de novembro'` | título do modal de agendar e da confirmação (`dataPorExtenso` com maiúscula) |
| `rotuloDoDia('2026-11-12')` | `'12 de novembro, quinta-feira'` | nome do dia para leitor de tela; começa pelo número, que é o texto visível do botão |

`isPday` é usado no calendário público, na imagem do mês, no `/api/agendar` e
nos avisos do cron.

---

## `calendar-event.ts`: o almoço na agenda do celular

Monta o evento do botão "Adicionar à agenda do celular" (confirmação do
`BookingModal`). Sem dependência de servidor: o link do Google é usado no
navegador e o `.ics` na rota.

- Evento de **dia inteiro** ("Almoço dos missionários"), com a descrição
  "Almoço dos missionários da \<ala\>. Precisa desmarcar? Fale com a liderança
  da ala." (decisão do dono: dia inteiro, porque o horário muda de casa para casa).
- `linkGoogleAgenda(dateISO, nomeAla)`: URL do Google Agenda
  (`action=TEMPLATE`, `dates=AAAAMMDD/AAAAMMDD` com o fim **exclusivo**, o dia
  seguinte). O link não aceita lembrete: vale o padrão da pessoa.
- `arquivoIcs({ dateISO, nomeAla, slug, agora })`: texto `.ics` (RFC 5545)
  com `DTSTART;VALUE=DATE` / `DTEND` (dia seguinte), `UID` estável por ala e
  dia (adicionar duas vezes não duplica em quem respeita o UID) e um
  **`VALARM` às 9h da véspera** (`TRIGGER:-PT15H`, contado da meia-noite do
  dia). Texto escapado (`\`, `;`, `,`, quebra de linha), linhas dobradas em
  75 bytes e `CRLF`, como a norma pede.

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
| `parseData` | `?data=` de `/api/agenda/[slug]` | `YYYY-MM-DD` válido |
| `parseNovaAla` | `/api/alas/criar` | `{ nome, slug, endereco, pais, estado, cidade, fuso }` |
| `parsePreferencias` | `/api/avisos/preferencias` | `{ novo_almoco, dia_sem_almoco, proximo_mes, semana, pedido_acesso }` |

`parsePreferencias`: as cinco chaves de `TIPOS_AVISO` precisam ser booleanos de
verdade (nada de `"true"`). A ala vem à parte, por `parseAlaId`.

`parseNovaAla`: nome saneado e normalizado (`normalizarNomeAla`); **slug sempre
gerado do nome** (`gerarSlug`); país da lista `PAISES`; no Brasil o estado é uma
UF e o **fuso sai dela**; fora, estado livre (1–60) e fuso validado por
`fusoValido`; cidade 2–80; endereço opcional. As mensagens ("Escolha o país.",
"Escolha o estado.", "Informe o estado ou província.", "Escolha o fuso
horário.", "Informe a cidade.", "Não foi possível gerar um link válido a partir
desse nome") são escritas para o owner e devolvidas pela rota.

Os checks do banco espelham estas regras (ver [database.md](database.md)).

---

## Avisos por e-mail

O líder recebe avisos do calendário da ala no e-mail do perfil e escolhe quais
no card Notificações do painel ([routes_dashboard.md](routes_dashboard.md)).
Envio pelo **Gmail (SMTP)**, direto do Next, sem o Supabase. Os e-mails de login
(cadastro, senha…) são outra coisa: são do Supabase Auth ([database.md](database.md)).

**Regra central: a notificação é sempre usuário + ala.** Cada pessoa liga os
avisos que quer **em cada ala** a que tem acesso. O owner não tem regra especial:
recebe só das alas em que ligou algo, como qualquer líder. **Tudo vem desligado.**

**Os avisos só informam**, como uma notificação: **sem botão, sem link, sem
anexo**, e o telefone vai como texto comum. A única exceção são os dois e-mails
de pedido para usar o painel, que têm **um botão para o painel** (`/dashboard`):
quem recebe precisa entrar para aprovar ou para começar a usar.

| Aviso no card (chave) | Quando | Gatilho |
|---|---|---|
| **Novo almoço neste mês** (`novo_almoco`) | alguém agenda, pela página da ala, um almoço para um dia **do mês atual** (no fuso da ala). Agendamento para o mês seguinte não avisa | na hora |
| **Dia sem almoço** (`dia_sem_almoco`) | o dia daqui a **2 dias** ainda está livre; pula segunda (P-day) e dia fora da janela | cron 8h |
| **Almoços da semana** (`semana`) | segunda-feira: almoços de terça a domingo | cron 8h |
| **Almoços do mês seguinte** (`proximo_mes`) | um dia antes do último dia do mês (29/04 se abril tem 30 dias): avisa que o mês seguinte **já pode ser agendado** e mostra quem já agendou e os dias livres. É o único aviso de mês: não há outro no dia 1 | cron 8h |
| **Pedido para entrar no painel** (`pedido_acesso`) | outra pessoa criou conta de líder e pediu para usar o painel desta ala (com botão para o painel) | na hora |
| **Pedido aprovado** (sem chave) | o pedido da pessoa foi aprovado; vai **sempre**, para ela (com botão para o painel) | na hora |

**Não há aviso de almoço editado ou removido:** quem edita ou remove é o próprio
líder, no painel.

Quem recebe um aviso de uma ala: quem tem a chave ligada **naquela ala**, tem
`perfil.email` e **ainda tem acesso** a ela (member aprovado da ala, ou owner).
Quem perdeu o acesso para de receber, mesmo com a chave ligada. Quem pediu para
entrar no painel não recebe o próprio pedido.

**Linguagem:** o público não é de tecnologia. Frases simples e **completas**,
dizendo **quem** fez **o quê** e **quando**; nada de "acesso", "card",
"notificação", "usuário" nos e-mails. Sem enrolação, mas sem cortar o que faz
entender. Ex.: "Rita (rita@gmail.com) criou uma conta de líder e pediu para usar
o painel da Ala X", não "Novo pedido de acesso".

"Almoços do mês seguinte" levaria a **imagem do calendário**; sai **sem imagem**,
com o mês em lista: um dia por linha ("Terça-feira, 3 — Maria" e o telefone
embaixo, ou "… — sem almoço"), todos os dias do mês menos as segundas sem almoço
(segunda **com** almoço aparece: o líder pode mover para segunda).

### `email-preferences.ts`

Tipos e padrão, usados no card (navegador) e no servidor:
`PreferenciasEmail` (as cinco chaves acima, todas `boolean`), `TipoAviso` (o nome
de uma chave), `TIPOS_AVISO` (a lista, na ordem) e `PREFERENCIAS_PADRAO` (**tudo
`false`**). Sem linha em `email_preferencia` = padrão.

### `server/mailer.ts`

`enviarEmails(emails)` / `enviarEmail(email)`, com `Email = { para, assunto,
html, texto }`. Devolve, para cada e-mail, `'enviado' | 'falhou' | 'desligado'`.
**Nunca lança erro**: falha vai para o log (`[email] …`) e quem chama segue.

- SMTP do Gmail: `smtp.gmail.com`, porta 465 (TLS), com `GMAIL_USER` e
  `GMAIL_APP_PASSWORD` (senha de app do Google, não a senha da conta; os espaços
  com que o Google a mostra são tirados antes de usar). Uma conexão por chamada,
  fechada no fim; os e-mails saem um por vez.
- Remetente: `EMAIL_FROM` ou `"Almoço dos Missionários" <GMAIL_USER>` (o Gmail
  só aceita a própria conta ou um alias verificado nela). Limite do Gmail: ~500
  e-mails/dia (conta comum).
- **Trava de ambiente:** só em produção (`VERCEL_ENV === 'production'`) o
  e-mail vai para o destinatário real. Fora dela (local, preview), **todo e-mail
  vai para `EMAIL_TESTE_PARA`**, com o assunto `[teste → <destinatário real>] …`;
  sem essa variável, **nada é enviado** (`'desligado'`). O `.env` local aponta
  para o banco de produção: sem essa trava, testar mandaria e-mail aos líderes
  reais.
- Sem `GMAIL_USER`/`GMAIL_APP_PASSWORD` → `'desligado'`.
- `emailsLigados()`: `true` em produção ou com `EMAIL_TESTE_PARA`. Os avisos na
  hora nem consultam o banco quando está desligado.

### Modelo `server/email/aviso.html`

O **padrão visual de todo aviso** fica em `src/lib/server/email/aviso.html`
(junto do código que o usa), com o
mesmo visual do site e dos e-mails do Supabase (`supabase/email/`): faixa azul
no topo com o ícone e o nome do site, fundo creme, cartão branco (borda
`#e0e2e2`) com fitinha framboesa→dourado, florzinha, título com serifa e o
rodapé "Feito por um membro voluntário… Não é mantido nem aprovado pela Igreja…" em cinza. Estilos **inline**, sem Tailwind.
Para mudar o visual de todos os avisos, edite esse arquivo.

Marcadores que o código preenche:

| Marcador | Conteúdo |
|---|---|
| `{{titulo}}` | título (no `<title>` e no `<h1>`) |
| `{{previa}}` | texto escondido que aparece na lista da caixa de entrada |
| `{{site}}` | endereço do site (ícone do cabeçalho) |
| `{{conteudo}}` | destaque, parágrafos e lista, já em HTML |
| `{{botao_texto}}`, `{{botao_url}}` | o botão azul (só nos e-mails de pedido) |

Blocos que o código mantém ou tira inteiros:

| Bloco | Fica quando |
|---|---|
| `<!--botao-->…<!--/botao-->` | o e-mail tem botão (só os de pedido para usar o painel) |
| `<!--parar-->…<!--/parar-->` | o aviso pode ser desligado no card: "Para parar de receber este aviso, desligue-o no painel, em Notificações." (sem link). Sai no "Pedido aprovado" |

O arquivo é lido do disco na primeira vez
(`process.cwd()/src/lib/server/email/aviso.html`) e fica em memória. O
`next.config.ts` garante as duas pontas:

- **para o build** com "Falta o modelo dos avisos por e-mail" se o arquivo não
  existir (antes, apagar o modelo só aparecia como erro na hora de mandar);
- inclui o arquivo em todas as rotas `/api/**` (`outputFileTracingIncludes`),
  para ele ir junto no pacote das funções na Vercel.

Ele já morou em `messages/email/`, mas essa pasta é de planos e é limpa à mão:
o modelo foi apagado duas vezes.

### `server/email-templates.ts`

Monta cada aviso (assunto, HTML pelo modelo e texto puro) a partir dos dados.

Regras de texto:

- **Letra grande:** corpo 20px, botão 22px, título 30px, nada menor que 16px.
- Texto formal e direto, **sem "você"** (usa "seu/sua" e o imperativo).
- **Assunto diz o que aconteceu e sempre traz o nome da ala.**
- Datas por extenso com dia da semana ("terça-feira, 27 de outubro").
- **Sem link** (nem no telefone, que vai como texto: "Telefone: 41 99999 9999"),
  menos o botão dos e-mails de pedido. O texto puro também não leva endereço.
- **Tudo que vem do usuário é escapado** (`&`, `<`, `>`, aspas): um nome com
  `<script>` aparece como texto.
- Blocos do conteúdo com 20px entre um e outro; sem botão, o cartão termina no
  último bloco.

| Função | Assunto (sem o " — Ala X" do fim) | Conteúdo | Botão |
|---|---|---|---|
| `emailNovoAlmoco` | "Novo almoço no dia 12" | título "Novo almoço agendado" + destaque rosa: "Maria Souza agendou o almoço dos missionários para quinta-feira, 12 de novembro." e "Telefone: …" | — |
| `emailDiaSemAlmoco` | "Depois de amanhã ainda não tem almoço" | "Quarta-feira, 28 de outubro, ainda não tem ninguém para dar o almoço aos missionários na Ala X." + "Ainda dá tempo de alguém agendar pelo calendário da ala." | — |
| `emailSemana` | "Almoços desta semana" | "Estes são os almoços dos missionários da Ala X, de terça a domingo:" e a lista | — |
| `emailProximoMes` | "Almoços de novembro" | "Os membros da Ala X já podem agendar os almoços de novembro." + "Novembro já tem 1 almoço agendado e ainda tem 24 dias livres." (ou "…ainda não tem nenhum almoço agendado.") + "Dias de novembro:" em lista | — |
| `emailPedidoAcesso` | "Rita de Cássia pediu para entrar no painel" | "Rita de Cássia (rita@gmail.com) criou uma conta de líder e pediu para usar o painel da Ala X." + "Para aceitar, abra o painel e toque em "Aprovar", na parte Usuários." | Abrir o painel |
| `emailAcessoAprovado` | "Pedido aprovado" | "O seu pedido para usar o painel da Ala X foi aprovado." + "Toque no botão abaixo para entrar." | Entrar no painel |

`urlDoSite(caminho)` monta o endereço do botão e do ícone: `siteUrl()`
(`NEXT_PUBLIC_BASE_URL`) ou, sem ela, `https://lunchsud.vercel.app`.

### `server/notifications.ts`

Quem recebe o quê. Lê pelo service-role.

- `buscarPreferenciasEmail(userId, alaId)` → as chaves do usuário **naquela ala**
  (sem linha, ou se a tabela ainda não existir: tudo desligado).
- `inscritos({ alaId?, tipo? })` (interno): linhas de `email_preferencia` (da ala
  e/ou com a chave ligada), cruzadas com `perfil` (e-mail, owner) e `ala_membro`
  (vínculo aprovado). Descarta quem não tem e-mail ou perdeu o acesso à ala.
- Avisos na hora, chamados com `after()` pelas rotas; engolem qualquer erro
  (log) e não fazem nada com os e-mails desligados:
  - `avisarNovoAlmoco(alaId, almoco)`: chamado pelo `/api/agendar`; só segue se
    a data é do mês atual da ala;
  - `avisarPedidoDeAcesso(alaId, solicitanteId)`;
  - `avisarAcessoAprovado(alaId, userId)`: sempre, sem chave.
- `planejarAvisos(ala, { hoje, fim, mesSeguinte }, almocos, destinatarios)`:
  **função pura** que decide os avisos do cron de uma ala. Para cada pessoa com a
  chave ligada:
  - **almoços do mês seguinte**: se `hoje` = dia 1 do mês seguinte − 2 dias →
    referência = `mesSeguinte`;
  - **semana**: se `hoje` é segunda (`isPday`) → dias `hoje+1` a `hoje+6`,
    referência = `hoje`;
  - **dia sem almoço**: alvo = `hoje + 2` (`DIAS_ANTES_DIA_SEM_ALMOCO`); avisa se
    o alvo **não é segunda**, está **antes de `fim`** e **não tem almoço**;
    referência = o alvo.
- `rodarAvisosDoDia()` (o cron):
  1. lê quem ligou algum aviso de cron (`inscritos({})`) e as alas dessas pessoas;
  2. para cada ala: `hoje`/`fim`/`mesSeguinte` **no fuso da ala**
     (`getDashboardRange(ala.fuso_horario)`; o cron roda em UTC), os almoços de
     `hoje+1` até `fim` (cobre a semana, o dia sem almoço e o mês seguinte
     inteiro) e `planejarAvisos`;
  3. **em produção**, registra cada aviso em `email_envio` antes de mandar
     (`upsert … ignoreDuplicates`): se a linha já existe, o e-mail já saiu e é
     pulado (cron rodando de novo no mesmo dia não repete). Fora de produção não
     grava nada;
  4. envia tudo numa conexão; o que **não** foi enviado tem o registro apagado
     (pode sair numa nova execução);
  5. apaga registros com mais de 90 dias;
  6. devolve só contagens (`planejados`, `repetidos`, `enviados`, `falharam`,
     `desligados`).

Fuso: com o cron às 11:00 UTC, uma ala em São Paulo recebe às 8h e uma em
Manaus às 7h (hora local), cada uma com o "hoje" certo.

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
