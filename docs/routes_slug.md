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
    WardBooking.tsx           estado da página, ao vivo, mensagens; abre o modal
    BookingModal.tsx          modal de agendar (nome + telefone → /api/agendar)
    MonthCalendar.tsx         grade do mês (só apresentação)
```

Dependências: `src/lib/server/public-ward.ts` (ala + ocupados),
`src/lib/date.ts` (janela, P-day), `src/lib/phone.ts` (telefone),
`src/hooks/use-bookings-realtime.ts` (WebSocket), `src/components/{Flower,Spinner}`.
APIs: `POST /api/agendar`, `GET /api/agendamentos/[slug]` (ver [routes_api.md](routes_api.md)).

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

- **Título da aba** = só o nome da ala (`title: { absolute: ala.nome }`). O
  `absolute` ignora o template `"%s · Almoço dos Missionários"` do layout: aba
  curta, que não estoura.
- **Prévia de compartilhamento** (WhatsApp etc.): título
  `Calendário de almoços da <ala>` e descrição
  `Agende seu almoço para nossos missionários ❤️`. Quem recebe já sabe de qual
  ala é e o que fazer. **Sem imagem** (`openGraph` sem `images`, Twitter
  `card: 'summary'`): o preview mostra só texto.
- Slug que não existe: título `Ala não encontrada` e `robots: noindex, nofollow`.

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

- Título: **"Não foi possível abrir o calendário"**
- Texto: "Verifique a internet e toque no botão abaixo para tentar de novo."
- Botão **"Tentar de novo"** → `retry()` (busca os dados de novo no servidor e
  limpa o erro). Alvo grande (`min-h-13`), verde.

Visual igual ao do 404: cartão branco, fitinha verde→rosa→verde no topo,
florzinha.

## `WardBooking.tsx` (client)

Dono do estado da página. Recebe do servidor `slug`, `alaId`, `nomeAla`,
`ocupados`, `hoje` e `mesAtual`.

### Estado

| Estado | Para quê |
|---|---|
| `diaSelecionado` | dia aberto no modal (`null` = modal fechado) |
| `nome`, `telefone` | ficam **aqui**, não no modal: continuam preenchidos se a pessoa fechar o modal e abrir outro dia (ou depois de um conflito) |
| `mensagem`, `tipoMensagem` | mensagem embaixo do calendário depois de agendar (`sucesso`) ou de o dia ser ocupado por outra pessoa (`erro`) |
| `diasOcupados` | lista viva de `{ id, data, nome }`, começa com o que veio do servidor |
| `ocupadoPor` | nome de quem ocupou o dia tocado |
| `aviso` | `'pday'` ou `'passado'`: mensagem ao tocar num dia que não abre o agendamento |
| `baseDate` | 1º dia do mês visível (atual ou seguinte) |

### Janela navegável

`inicioMesAtual` e `inicioMesSeguinte` saem de `mesAtual` (servidor). `canPrev`
e `canNext` só deixam alternar entre esses dois meses, a mesma janela que o
`/api/agendar` aceita.

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
| Dia livre | abre o `BookingModal` (`diaSelecionado`), limpa `ocupadoPor` e `aviso` |
| Dia ocupado | mostra "Este dia já foi agendado por **\<nome\>**." |
| Segunda | mostra "Segunda-feira é dia de **P-day**. Escolha outro dia." |
| Dia passado | mostra "Esse dia **já passou**. Escolha outro dia." |
| Voltar/Avançar | troca o mês e limpa seleção, `ocupadoPor` e `aviso` |

Cada toque limpa as outras mensagens, então só uma aparece por vez.

### Mensagens embaixo do calendário

Todas com `animate-aparecer` (fade de 200 ms para chamar o olho). A `key` muda
com o conteúdo, então o fade roda de novo quando a mensagem troca.

- Ocupado: `wrap-anywhere`, porque o nome vem do usuário e pode ter 80
  caracteres sem espaço. Sem isso ele empurrava a página para o lado.
- Resultado do agendamento (`role="status"`, `aria-live="polite"`):
  - sucesso, em **verde** (`text-secondary`): "Almoço agendado com sucesso. Muito obrigado!"
  - conflito, em **rosa** (`text-accent`): "Este dia acabou de ser ocupado. Escolha outro."
  - Antes ficava azul sobre o fundo azul, invisível. Só aparece com o modal fechado.

### Callbacks do modal

- `fecharModal`: fecha e limpa a mensagem; **mantém nome e telefone**.
- `aoAgendar({ id, data, nome })`: marca o dia na hora (o evento do WebSocket
  chega depois com o mesmo `id` e só substitui), mostra o agradecimento, limpa
  nome e telefone, fecha o modal.
- `aoConflito()`: fecha o modal, mostra a mensagem de conflito e chama
  `atualizarOcupados()`. Nome e telefone ficam, para a pessoa escolher outro dia
  sem redigitar.

`dataSelecionada` (`YYYY-MM-DD` do dia no mês visível) também é a `key` do modal:
trocar de dia monta um modal novo, sem erro antigo na tela (antes, o erro do
conflito aparecia de novo no modal seguinte).

### Layout

- Cabeçalho: nome da ala (`h1`, 4xl, branco), divisória com florzinha,
  "Toque em um dia livre para agendar o almoço." Duas florzinhas decorativas
  estáticas nos cantos (opacidade baixa, `aria-hidden`).
- Margens enxutas no celular (`px-2`): cada pixel vira largura dos 7 dias. Em
  360px os dias chegam a 44px, o alvo de toque recomendado (WCAG 2.5.5).
- Calendário num cartão branco com fitinha verde→rosa→verde no topo. **Sem
  animação de entrada**: aparece junto com a página (vem do servidor).
- `main` com fundo transparente, para o "céu" do `body` aparecer.

## `BookingModal.tsx` (client)

Modal de agendar um dia. Exporta `BookingModal` e o tipo `Agendado = { id, data, nome }`.

### Props

| Prop | Tipo | Uso |
|---|---|---|
| `slug` | `string` | enviado à API |
| `dia` | `number` | dia do mês, para o título |
| `nomeMes` | `string` | `'novembro'`, para o título |
| `data` | `string` | `YYYY-MM-DD` enviado à API |
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
   dele e o geral **"Preencha corretamente os campos destacados."**
4. `POST /api/agendar` com `{ slug, data, nome, telefone }`.
5. Resultado:
   - **Sem internet** (fetch lança): o modal continua aberto com o que foi
     digitado e mostra **"Sem conexão com a internet. Verifique e tente de
     novo."** Antes o botão ficava preso em "Confirmando…".
   - **409** → `onConflict()`.
   - **Outro erro** → mostra o `error` da API (escrito para o membro) ou "Não
     foi possível agendar. Tente de novo." O modal fica aberto, com nome e
     telefone, para tentar de novo.
   - **Sucesso** → `onBooked({ id, data, nome: nome.trim() })`. O `id` devolvido
     pela API casa com o evento do WebSocket que chega em seguida.

Mensagens de campo: nome → "Informe seu nome."; telefone → "Confira o telefone,
com DDD. De outro país? Comece com + e o código do país."

### Campos e preenchimento automático

É um `<form noValidate>` de verdade: é o que faz o celular oferecer o nome e o
telefone salvos, e a tecla "Ir" do teclado enviar (`type="submit"`). O
`noValidate` deixa os erros serem os nossos, em português, embaixo de cada campo.

| Campo | Atributos |
|---|---|
| Nome (`#nome`) | `name="name"`, `autoComplete="name"`, `autoCapitalize="words"`, `maxLength=80` |
| Telefone (`#telefone`) | `name="tel"`, `type="tel"`, `autoComplete="tel"`, `inputMode="tel"`, `maxLength=25` |

- `inputMode="tel"`, não `"numeric"`: o teclado de telefone tem a tecla `+`.
- **Sem máscara enquanto digita**, nem filtro de caractere: o campo guarda
  exatamente o que a pessoa escreveu (com espaço, traço, `+`…). Reformatar a cada
  tecla jogava o cursor para o fim e impedia corrigir um dígito no meio.
- **No `onBlur`** o número é mostrado como foi entendido (`normalizarTelefone(...).formatado`):
  aparece o 9 do celular antigo, o país separado etc. O servidor normaliza de novo.
- Label "Seu telefone (com DDD)", placeholders "Digite seu nome aqui" / "Digite seu telefone aqui".

### Abrir, fechar e rolar

- Abre com fade (`animate-aparecer` no fundo, `animate-surgir` na caixa) e fecha na hora.
- Fecha por **Cancelar**, **X** (`aria-label="Fechar"`, 44px), **Esc** e **toque
  fora** da caixa.
- **Trava o scroll do fundo** de forma que funciona no iPhone: o iOS ignora
  `overflow: hidden` no `body` para toque, então o `body` vira `position: fixed`
  com `top: -scrollY` e a posição é restaurada ao fechar. Sem isso, rolar dentro
  do modal mexia a página atrás. O efeito roda **uma vez** ao montar; o `onClose`
  mais recente fica num `ref`, para o Esc sempre chamar a versão atual.
- O fundo é um container rolável (`overflow-y-auto overscroll-contain`): com o
  teclado aberto o modal pode passar da tela e ainda dá para rolar até os botões.
- `role="dialog"`, `aria-modal`, `aria-label="Agendar dia X de <mês>"`.

### Botões

- **Cancelar** (`type="button"`) e **Confirmar** (`type="submit"`) ficam em
  `flex flex-wrap-reverse` com `basis-28` (em rem): **lado a lado quando cabem**,
  um embaixo do outro em tela estreita ou letra grande. Como o `basis` é em rem,
  ele cresce com a letra. Antes, com letra 130%, o Confirmar saía da tela.
  `wrap-reverse`: empilhados, o Confirmar fica em cima.
- **Não fixar a barra de botões no rodapé (sticky).** Testado em 320px com letra
  130%: ela cobria o campo de telefone. Melhor rolar na ordem natural
  (nome → telefone → Confirmar).
- Confirmar enquanto envia: `disabled`, `aria-busy`, `<Spinner />` e
  **"Confirmando…"**. Tocar de novo não faz nada. Cancelar também fica desativado.
- Erro geral: `role="alert"`, com `key={erro}` para o fade rodar a cada erro novo.

## `MonthCalendar.tsx` (client)

Grade de um mês. **Só apresentação**: quem busca os dados e decide o mês é o
`WardBooking`.

### Props

`ocupados` (`{ data, nome }[]`), `baseDate`, `hoje` (`YYYY-MM-DD` no fuso da ala;
antes disso o dia está bloqueado), `selectedDay`, `onSelectDay`,
`onSelectOcupado(nome)`, `onSelectPday`, `onSelectPassado`, `onPrev`, `onNext`,
`canPrev`, `canNext`.

### Estados do dia (em ordem de prioridade)

| Estado | Visual | Toque |
|---|---|---|
| Passado (`data < hoje`, comparação de texto `YYYY-MM-DD`) | esmaecido (`text-primary/30`) | `onSelectPassado` |
| P-day (`isPday`) | cinza-azulado, número + "P-day" em letra pequena | `onSelectPday` |
| Ocupado | rosa (`bg-accent`), texto branco | `onSelectOcupado(nome)` |
| Selecionado | verde (`bg-secondary`) com sombra | — |
| Livre | branco com borda; hover verde-claro | `onSelectDay(dia)` |

Dia passado e P-day **não abrem o agendamento**: só a mensagem embaixo do
calendário explica o porquê. Segunda que já passou aparece só como passada (sem
o rótulo "P-day").

### Acessibilidade

- Cada dia é `role="button"`, `tabIndex=0`, `aria-pressed` (selecionado) e
  `aria-label` descritivo: "Dia 5, já passou, indisponível", "Dia 6, P-day,
  indisponível", "Dia 7, ocupado por Maria", "Dia 8, selecionado", "Dia 9,
  disponível".
- Enter e Espaço ativam o dia.
- `active:scale-95` ao tocar ("recebi seu toque").
- Botões **Voltar**/**Avançar** com ícone + texto, `aria-label` "Mês anterior" /
  "Próximo mês". Desativados fora da janela (`opacity-30`).
- Legenda: Disponível / Ocupado / P-day.

### Modo compacto (letra grande ou tela estreita)

O calendário é um `@container`. Com `@max-[15rem]` (calendário estreito **para
o tamanho da letra**):

- o nome do mês sobe para cima dos botões (grade de 2 colunas);
- os dias da semana viram iniciais (D S T Q Q S S, como no calendário de papel).

O limite é em **rem**, então cresce junto com a letra do sistema: com fonte 130%
o modo compacto entra antes. Sem isso, com letra grande o "Avançar" saía da tela
e "SEG TER QUA" se encavalavam.

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
