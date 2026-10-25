# `/[slug]`: calendário da ala (agendamento público)

É **a página que o membro recebe** (link no grupo do WhatsApp, ex.
`/sao_lourenco`). A pessoa vê o calendário do mês atual e do seguinte, toca num
dia livre, digita nome e telefone e confirma. **Não precisa de conta.** Os dias
ocupados mudam ao vivo, sem recarregar.

Público: senhoras de 45 a 85 anos, no celular, muitas com letra do sistema
aumentada, internet fraca e o link aberto dentro do WhatsApp. Toda decisão desta
página parte disso.

## Arquivos

```
src/app/(member)/[slug]/
  page.tsx                    Server Component: busca a ala e os dias ocupados; metadata
  error.tsx                   tela de erro ("Tentar de novo")
  _components/
    WardBooking.tsx           estado da página, ao vivo, avisos; abre o modal
    BookingModal.tsx          modal de agendar (nome + telefone → /api/agendar) e confirmação
    MonthCalendar.tsx         abas de mês + grade do mês (só apresentação)
```

Dependências: `src/lib/server/public-ward.ts` (ala + ocupados),
`src/lib/date.ts` (janela, P-day, datas por extenso), `src/lib/phone.ts`
(telefone), `src/lib/calendar-event.ts` (evento da agenda),
`src/hooks/use-bookings-realtime.ts` (WebSocket), `src/components/{Flower,Spinner,NoticeBar}`.
APIs: `POST /api/agendar`, `GET /api/agendamentos/[slug]`, `GET /api/agenda/[slug]`
(ver [routes_api.md](routes_api.md)).

## Regras de negócio (não quebrar)

| Regra | Onde é garantida |
|---|---|
| **Um almoço por dia, por ala** | Banco: `unique (ala_id, data)`. API devolve 409 no `23505`. Calendário pinta o dia de rosa. |
| **Segunda = P-day** (membro não agenda) | `isPday()` no `MonthCalendar` (bloqueia o toque) e no `/api/agendar` (fonte da verdade). O banco **não** barra: o líder pode mover um almoço para segunda. |
| **Dia que já passou** não é agendável | `MonthCalendar` (compara com `hoje`) e `/api/agendar` (`data < hoje`). |
| **Janela = mês atual + seguinte** | Navegação do calendário (só 2 meses) e `/api/agendar` (`data >= fim` é recusada). |
| **Tudo no fuso da ala** | `hoje` e `mesAtual` vêm do servidor via `getDashboardRange(ala.fuso_horario)`. Nunca calcular com o relógio do celular. |
| **Sem conta** | Nenhuma sessão é lida; a rota nem passa pelo `proxy.ts`. |
| **Telefone nunca é exposto** | A página só recebe `id, data, nome`. O WebSocket também não traz telefone (permissão por coluna no banco). |

## `page.tsx` (Server Component)

### `generateMetadata`

Busca a ala pelo slug (`buscarAlaPorSlug`) e monta:

- **Título da aba** = só o nome da ala (`title: ala.nome`): aba curta, que não
  estoura (ver "Títulos da aba" em [src_app.md](src_app.md)).
- **Prévia de compartilhamento** (WhatsApp etc.): título
  `Calendário de almoços da <ala>` e descrição
  `Agende seu almoço para nossos missionários ❤️`. Quem recebe já sabe de qual
  ala é e o que fazer. **Sem imagem** (`openGraph` sem `images`, Twitter
  `card: 'summary'`): o preview mostra só texto.
- Slug que não existe: título `Página não encontrada` (qualquer endereço de um
  nível cai aqui, não só ala digitada errado) e `robots: noindex, nofollow`.

### Página

1. `buscarAlaPorSlug(slug)`. O nome real vem do banco: não dá para derivar do
   slug, que perde acentos e troca espaço por `_`. Slug inexistente ou
   malformado → `notFound()` (404 em português, ver [src_app.md](src_app.md)), nunca 500.
   `buscarAlaPorSlug` usa `cache()` do React, então `generateMetadata` e a
   página fazem **uma** consulta só.
2. `buscarOcupados(ala)`: dias ocupados **só da janela agendável** (de hoje até
   o fim do mês seguinte, no fuso da ala). Erro no banco → `throw` →
   `error.tsx`.
3. `getDashboardRange(ala.fuso_horario)` → `hoje` (`YYYY-MM-DD`) e `mesAtual`
   (`YYYY-MM`). São os **mesmos** valores que o `/api/agendar` usa para aceitar
   ou recusar. Calcular no aparelho podia mostrar outro dia/mês na virada
   (fuso ou relógio errado do celular) e dar erro na hora de agendar.
4. Renderiza `<WardBooking slug alaId nomeAla ocupados hoje mesAtual />`.

A rota é dinâmica (`ƒ` no build): os dias ocupados são lidos a cada acesso.

## `error.tsx`

Aparece quando o carregamento falha (banco fora do ar, internet caindo no meio).
Substitui a tela padrão do Next (em inglês) por um cartão calmo:

- Título (na faixa): **"Não foi possível abrir o calendário"**
- Texto: "Verifique a internet e toque no botão abaixo para tentar de novo."
- Botão **"Tentar de novo"** → `retry()` (busca os dados de novo no servidor e
  limpa o erro). Alvo grande (`min-h-13`), azul.

Visual igual ao do 404: faixa padrão no topo e, no creme, cartão branco com
fitinha framboesa→dourado→framboesa, o texto e o botão (sem título nem flor no
cartão).

## `WardBooking.tsx` (client)

Dono do estado da página. Recebe do servidor `slug`, `alaId`, `nomeAla`,
`ocupados`, `hoje` e `mesAtual`.

### Estado

| Estado | Para quê |
|---|---|
| `diaSelecionado` | dia aberto no modal (`null` = modal fechado) |
| `nome`, `telefone` | ficam **aqui**, não no modal: continuam preenchidos se a pessoa fechar o modal e abrir outro dia (ou depois de um conflito) |
| `diasOcupados` | lista viva de `{ id, data, nome }`, começa com o que veio do servidor |
| `aviso` | `{ tipo: 'info' \| 'erro', conteudo }` mostrado na `NoticeBar`, ou `null` |
| `baseDate` | 1º dia do mês visível (atual ou seguinte) |

### Janela navegável

`inicioMesAtual` e `inicioMesSeguinte` saem de `mesAtual` (servidor). As abas
do calendário recebem só esses dois meses (`meses={[mesAtual, mesSeguinte]}`),
a mesma janela que o `/api/agendar` aceita.

Para filtrar o que chega ao vivo há também a janela em texto: `inicioJanela =
hoje` e `fimJanela` = dia 1 do mês após o seguinte (exclusivo).

### Ao vivo (WebSocket)

`useBookingsRealtime(alaId, aplicarMudanca)` (ver [src_hooks.md](src_hooks.md)).
`aplicarMudanca` aplica o evento **direto no estado, sem requisição**:

- `DELETE` → remove pelo `id` (o Realtime só manda a chave primária).
- `INSERT`/`UPDATE` → tira da lista o item com o mesmo `id` **ou a mesma data**
  (um almoço por dia) e adiciona o novo **se a data estiver na janela**: o líder
  pode mover um almoço para fora dela.
- `null` (reconectou: queda de rede ou volta para a aba) → `atualizarOcupados()`,
  que busca a lista inteira em `GET /api/agendamentos/[slug]` (`cache:
  'no-store'`). Eventos podem ter se perdido no intervalo.

Por que aplicar direto: com 50 pessoas olhando a mesma ala, cada agendamento
gerava 50 buscas no servidor; agora, nenhuma.

`atualizarOcupados` só é usado para ressincronizar (reconexão) e depois de um
conflito (409). Erros de rede são ignorados em silêncio: a lista atual continua
na tela.

### Toques no calendário

| Toque | O que acontece |
|---|---|
| Dia livre | abre o `BookingModal` (`diaSelecionado`) e tira o aviso |
| Dia ocupado | aviso: "Este dia já foi agendado por **\<nome\>**." |
| Segunda | aviso: "Segunda-feira é **P-day**, o dia de descanso dos missionários. Escolha outro dia." (explica o termo na própria frase) |
| Dia passado | aviso: "Esse dia **já passou**. Escolha outro dia." |
| Aba de mês (`onSelectMonth`) | troca o mês, tira a seleção e o aviso |

Cada toque troca o aviso, então só um aparece por vez.

Os avisos aparecem no **`NoticeBar`** ([src_components.md](src_components.md)),
no **topo da tela**, e ficam até a próxima ação ou até o X ("Fechar aviso"):
explicam algo, então a pessoa precisa de tempo para ler. Ocupado e o texto do
P-day em azul (`info`); conflito em rosa (`erro`).

### Callbacks do modal

- `fecharModal`: fecha; **mantém nome e telefone**.
- `aoAgendar({ id, data, nome })`: marca o dia na hora (o evento do WebSocket
  chega depois com o mesmo `id` e só substitui) e limpa nome e telefone. **Não
  fecha o modal:** ele vira o cartão de confirmação.
- `aoConflito()`: fecha o modal, mostra o aviso de erro "Este dia acabou de ser
  ocupado. Escolha outro dia." e chama `atualizarOcupados()`. Nome e telefone
  ficam, para a pessoa escolher outro dia sem redigitar.

`dataSelecionada` (`YYYY-MM-DD` do dia no mês visível) também é a `key` do modal:
trocar de dia monta um modal novo, sem erro antigo na tela (antes, o erro do
conflito aparecia de novo no modal seguinte).

### Layout

- `HeaderBand title={nomeAla}`: a faixa padrão (nome da ala e flor). Sem as florzinhas decorativas nos cantos de antes. Altura
  contida: o calendário começa na primeira tela do celular.
- Abaixo, no `<main>` sobre o creme: "Toque em um dia livre para agendar o
  almoço." (`text-lg`, texto escuro) e o calendário.
- **Acesso do líder**, depois do calendário: um espaço grande (~70px no celular,
  ~90px no computador, para não parecer parte do calendário), uma linha fina
  (`border-t border-primary/10`), outro espaço e uma linha branca **da largura do
  calendário** com **"Faz parte da presidência?"** (texto do dono) e, embaixo, "Entre no painel da ala
  para ver quem agendou e organizar os almoços." à esquerda, e o botão azul
  padrão **"Entrar"** à direita (`flex-wrap`: com letra grande o botão desce).
  Leva a `/admin` (logado, o `/admin` manda direto para o painel). A linha em
  si é discreta (sem sombra); o texto diz que é para o líder, e a irmã que
  agenda não confunde com um passo do agendamento. "Painel de controle" foi descartado:
  técnico demais. Os avisos são do
  `NoticeBar`, no topo da tela.
- Margens enxutas no celular (`px-2`): cada pixel vira largura dos 7 dias. Em
  360px os dias chegam a 44px, o alvo de toque recomendado (WCAG 2.5.5).
- Calendário num cartão branco (`pt-4`: as abas não encostam na fitinha) com fitinha framboesa→dourado→framboesa no topo. **Sem
  animação de entrada**: aparece junto com a página (vem do servidor).
- O cartão do calendário: `ring-1 ring-primary/10` + `shadow-md` sobre o creme.

## `BookingModal.tsx` (client)

Modal de agendar um dia e, depois do sucesso, o **cartão de confirmação**.
Exporta `BookingModal` e o tipo `Agendado = { id, data, nome }`.

### Props

| Prop | Tipo | Uso |
|---|---|---|
| `slug` | `string` | enviado à API |
| `nomeAla` | `string` | confirmação e evento da agenda |
| `data` | `string` | `YYYY-MM-DD` enviado à API; vira o título por extenso (`tituloDoDia`: "Quinta-feira, 12 de novembro") |
| `nome`, `telefone` | `string` | valores controlados pelo `WardBooking` |
| `onNomeChange`, `onTelefoneChange` | `(v) => void` | atualizam o `WardBooking` |
| `onClose` | `() => void` | Cancelar, X, Esc, toque fora |
| `onBooked` | `(Agendado) => void` | sucesso |
| `onConflict` | `() => void` | 409: outra pessoa marcou o dia antes |

Os erros (`erroNome`, `erroTelefone`, `erro`) e o `loading` são do modal.

### Fluxo do `agendar()`

1. Já enviando (`loading`)? Ignora: tocar de novo não faz nada.
2. Limpa os erros da tentativa anterior.
3. Valida no aparelho: nome com 2+ caracteres (após `trim`) e telefone que
   `normalizarTelefone` entende. Falhou → borda rosa no campo, mensagem embaixo
   dele (ligada por `aria-describedby`, **sem** `role="alert"`), o resumo
   **"Corrija os campos marcados em rosa e toque em Confirmar almoço."** (o
   único alerta, no `ErrorMessage`) e o **foco vai para o primeiro campo com
   erro**. Antes três alertas eram lidos juntos, embaralhados.
4. `POST /api/agendar` com `{ slug, data, nome, telefone }`.
5. Resultado:
   - **Sem internet** (fetch lança): o modal continua aberto com o que foi
     digitado e mostra **"Sem conexão com a internet. Verifique a internet e
     toque em Confirmar almoço de novo."** Antes o botão ficava preso em
     "Confirmando…".
   - **409** → `onConflict()`.
   - **Outro erro** → mostra o `error` da API (escrito para o membro) ou "Não
     foi possível agendar. Toque em Confirmar almoço de novo." O modal fica
     aberto, com nome e telefone, para tentar de novo.
   - **Sucesso** → `onBooked({ id, data, nome: nome.trim() })` e o modal vira a
     confirmação. O `id` devolvido pela API casa com o evento do WebSocket que
     chega em seguida.

Mensagens de campo: nome → "Informe seu nome."; telefone → "Confira o telefone,
com DDD. De outro país? Comece com + e o código do país."

### Campos e preenchimento automático

É um `<form noValidate>` de verdade: é o que faz o celular oferecer o nome e o
telefone salvos, e a tecla "Ir" do teclado enviar (`type="submit"`). O
`noValidate` deixa os erros serem os nossos, em português, embaixo de cada campo.

| Campo | Atributos |
|---|---|
| Nome (`#nome`) | `name="name"`, `autoComplete="name"`, `autoCapitalize="words"`, `enterKeyHint="next"`, `maxLength=80` |
| Telefone (`#telefone`) | `name="tel"`, `type="tel"`, `autoComplete="tel"`, `inputMode="tel"`, `enterKeyHint="done"`, `maxLength=25` |

- A tecla do teclado diz **"Próximo"** no nome e **"OK"** no telefone. No nome,
  Enter leva ao telefone (sem isso, o Enter enviaria o formulário pela metade e
  mostraria erro no telefone vazio).
- **Sem exemplo de telefone** embaixo do rótulo (o dono pediu para tirar): o
  rótulo "Seu telefone (com DDD)" e o preenchimento automático bastam.
- Campo com erro: `aria-invalid` e `aria-describedby` apontando para a mensagem
  do campo (`#nome-erro`, `#telefone-erro`).

- `inputMode="tel"`, não `"numeric"`: o teclado de telefone tem a tecla `+`.
- **Sem máscara enquanto digita**, nem filtro de caractere: o campo guarda
  exatamente o que a pessoa escreveu (com espaço, traço, `+`…). Reformatar a cada
  tecla jogava o cursor para o fim e impedia corrigir um dígito no meio.
- **No `onBlur`** o número é mostrado como foi entendido (`normalizarTelefone(...).formatado`):
  aparece o 9 do celular antigo, o país separado etc. O servidor normaliza de novo.
- Label "Seu telefone (com DDD)", placeholders "Digite seu nome aqui" / "Digite seu telefone aqui".

### Abrir, fechar e rolar

- Usa o **`Modal`** ([src_components.md](src_components.md)): fundo desfocado,
  página atrás travada, fundo inerte, Esc e toque fora. O foco entra na caixa
  (o leitor lê o título, o teclado do celular não abre sozinho) e, ao fechar,
  **volta ao dia** do calendário que abriu o modal.
- Fecha por **Cancelar**, **X** (`aria-label="Fechar"`, 44px), **Esc** e **toque
  fora** da caixa.
- `aria-labelledby` no título do momento (`#agendar-titulo` ou
  `#agendado-titulo`).

### Botões

- **Cancelar** (`type="button"`) e **Confirmar almoço** (`type="submit"`) ficam em
  `flex flex-wrap-reverse` com `basis-40` (em rem; "Confirmar almoço" não quebra dentro do botão): **lado a lado quando cabem**,
  um embaixo do outro em tela estreita ou letra grande. Como o `basis` é em rem,
  ele cresce com a letra. Antes, com letra 130%, o Confirmar saía da tela.
  `wrap-reverse`: empilhados, o Confirmar fica em cima.
- **Não fixar a barra de botões no rodapé (sticky).** Testado em 320px com letra
  130%: ela cobria o campo de telefone. Melhor rolar na ordem natural
  (nome → telefone → Confirmar).
- Confirmar enquanto envia: `disabled`, `aria-busy`, `<Spinner />` e
  **"Confirmando…"**. Tocar de novo não faz nada. Cancelar também fica desativado.
- Erro geral: `ErrorMessage` (caixa rosa com ícone), com `key={erro}` para o
  fade rodar a cada erro novo.

### Confirmação (depois de agendar)

O modal não fecha: troca o conteúdo pelo cartão de confirmação, e o **foco vai
para o título** (leitor de tela anuncia na hora).

- Círculo azul com ✓, **"Almoço agendado!"** (`h2` `text-2xl`), a data por
  extenso ("Quinta-feira, 12 de novembro") e o nome da ala.
- **"Adicionar à agenda do celular"** (botão principal, azul). Evento de **dia
  inteiro**, com lembrete na véspera às 9h ([src_lib.md](src_lib.md),
  `calendar-event.ts`). O destino depende do aparelho:
  - **Apple** (iPhone, iPad, Mac; `navigator.userAgent`): link para
    `GET /api/agenda/<slug>?data=…`, que devolve um `.ics`. Arquivo gerado no
    navegador (blob) costuma não abrir a Agenda no Safari; servido pelo site, abre.
  - **Outros** (Android, Windows): link do **Google Agenda**
    (`calendar.google.com/calendar/render?action=TEMPLATE…`), em nova aba, que
    abre o app direto. O lembrete fica o padrão da pessoa (o link não aceita).
- **"Voltar ao calendário"** (contorno) fecha o modal. Esc e toque fora também.
- "Precisa desmarcar? Fale com a liderança da ala." (a pessoa não desmarca
  sozinha; "liderança" porque o líder pode ser homem ou mulher).

## `MonthCalendar.tsx` (client)

Grade de um mês. **Só apresentação**: quem busca os dados e decide o mês é o
`WardBooking`.

### Props

`ocupados` (`{ data, nome }[]`), `baseDate`, `hoje` (`YYYY-MM-DD` no fuso da ala;
antes disso o dia está bloqueado), `selectedDay`, `onSelectDay`,
`onSelectOcupado(nome)`, `onSelectPday`, `onSelectPassado`, `meses` (os dois
`YYYY-MM` da janela) e `onSelectMonth(ym)`.

### Abas de mês

Componente compartilhado `MonthTabs` ([src_components.md](src_components.md)),
o mesmo do cartão de imagem do painel. No lugar de "Voltar"/"Avançar", duas
**abas com o nome do mês**: o atual à
esquerda, o seguinte à direita (`nomeDoMes`). Como só existem dois meses, a
pessoa vê os dois de uma vez e toca no que quer, sem adivinhar para onde
"Voltar" leva.

- **Escolhida:** azul cheio (`bg-secondary`), texto branco, ✓ antes do nome e
  sombra. **A outra:** branca com contorno azul de 2px e texto azul. Três sinais
  além da cor (fundo cheio × contorno, ✓, sombra).
- `<button aria-pressed>` dentro de `role="group"` "Mês do calendário" (não o
  padrão "abas" do ARIA, que exige setas e foco móvel; para duas opções é
  complexidade sem ganho). O nome acessível é o texto visível ("Novembro"):
  comando de voz funciona.
- `text-lg`, `min-h-13` (52px). Tocar na aba já escolhida não faz nada.
- O mês com o ano ("Outubro 2026") fica num `h2` só para leitor de tela
  (`sr-only`): na tela, a aba escolhida já diz o mês.
- Modo compacto (`@max-[15rem]`): as abas empilham (uma por linha).

### Estados do dia (em ordem de prioridade)

| Estado | Visual | Toque |
|---|---|---|
| Passado (`data < hoje`, comparação de texto `YYYY-MM-DD`) | número cinza `text-faded` (5,38:1: é clicável, então precisa ser legível), sem fundo nem borda | `onSelectPassado` |
| P-day (`isPday`) | listrinhas (`bg-pday`), número `text-muted`, borda cinza; sem texto "P-day" dentro do dia (não cabia sem letra minúscula) | `onSelectPday` |
| Ocupado | rosa-claro (`bg-accent-soft`), número framboesa, florzinha no canto (`aria-hidden`) | `onSelectOcupado(nome)` |
| Selecionado | azul cheio (`bg-secondary`), número branco, sombra | — |
| **Livre** | **branco, número marinho em negrito, borda azul de 2px** (`border-secondary/60`); hover azul-claro | `onSelectDay(dia)` |

O destaque é do **dia livre**: é o que a pessoa procura. O ocupado ficou suave
(antes era framboesa cheio e chamava mais atenção que o livre). Cada estado tem
um sinal além da cor: borda (livre), florzinha (ocupado), listras (P-day),
sem borda (passado).

Dia passado e P-day **não abrem o agendamento**: só a mensagem embaixo do
calendário explica o porquê. Segunda que já passou aparece só como passada (sem
as listrinhas).

### Acessibilidade

- Cada dia é um **`<button>` de verdade** (Enter e Espaço vêm do navegador),
  **sem `aria-pressed`**: escolher um dia não é ligar e desligar algo, e o
  leitor de tela anunciava "botão de alternância, não pressionado" em cada um.
- `aria-label` começa pelo texto visível (comando de voz: "tocar em 12") e diz
  a data por extenso (`rotuloDoDia`): "12 de novembro, quinta-feira, livre",
  "…, ocupado por Maria", "…, P-day", "…, já passou", "…, escolhido".
- `active:scale-95` ao tocar ("recebi seu toque").
- Dias da semana "Dom Seg Ter…" (`text-base`, sem maiúsculas; iniciais no
  modo compacto); número do dia em `text-lg`.
- Legenda: **Livre** / Ocupado / P-day (a mesma palavra da instrução "Toque em
  um dia livre"), quadradinhos de `h-5 w-5` com o mesmo visual dos dias (borda
  azul, rosa-claro com florzinha, listrinhas).

### Modo compacto (letra grande ou tela estreita)

O calendário é um `@container`. Com `@max-[15rem]` (calendário estreito **para
o tamanho da letra**):

- as abas de mês empilham;
- os dias da semana viram iniciais (D S T Q Q S S, como no calendário de papel).

O limite é em **rem**, então cresce junto com a letra do sistema: com fonte 130%
o modo compacto entra antes. Sem isso, com letra grande as abas saíam da tela
e os dias da semana se encavalavam. Testado em 320px com letra a 200%.

### Troca de mês

A grade tem `key` por mês, então é recriada a cada troca. Depois da **primeira**
troca (`trocouDeMes`) ela ganha `animate-aparecer` (avisa que os dias mudaram).
No primeiro carregamento, não: o calendário tem que aparecer na hora.

## Como testar

Playwright (fora do repositório), na ala São Lourenço, cobriu: 320px (iPhone SE)
com letra 100% e 130%, 360px Android com 130%, 390, 430, 768 e 1366px; nomes de
80 caracteres sem espaço; telefones BR/LatAm/EUA; toque triplo em Confirmar (1
requisição); offline; conflito entre dois aparelhos; ao vivo entre aparelhos
(sem buscas extras). **Agendar no `npm run dev` grava no banco de produção**:
use só a ala combinada e mande o SQL de limpeza ao usuário.
