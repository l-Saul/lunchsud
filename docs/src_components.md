# `src/components/`: componentes compartilhados

Só entra aqui o que **2 ou mais páginas** usam. Componente de uma página só fica
na pasta dela, em `_components/`.

| Componente | Usado em |
|---|---|
| `Flower` | `HeaderBand` (todas as páginas), calendário (dia ocupado e legenda), imagem do mês |
| `Footer` | layout raiz (todas as páginas) |
| `HeaderBand` | todas as páginas: home, ala, erro da ala, 404, login, acesso, redefinir senha, painel |
| `LoadingOverlay` | `WardSwitcher` (painel) |
| `button-classes` (`botao()`) | todo botão de ação do site (público e painel) |
| `MonthTabs` | calendário da ala (`MonthCalendar`), cartão "Gerar imagem do calendário" (painel) |
| `Modal` | `BookingModal` (ala), `EditBookingModal`, confirmação de remover acesso, confirmação de desligar aviso (painel) |
| `ErrorMessage` | `BookingModal`, `EditBookingModal`, `UsersCard`, `NotificationsCard`, `CreateWardForm`, `LoginForm`, `RequestAccess`, `ResetPasswordForm` |
| `NoticeBar` | página da ala (avisos do calendário), painel (`ShareLinkButtons`: "Link copiado!") |
| `Spinner` | todos os botões de ação, `LoadingOverlay`, home |

## `Flower.tsx`

Florzinha decorativa (5 pétalas em elipse girando de 72 em 72 graus), em SVG:
pétalas rosa `#ed3a65` e miolo dourado `#ffb81c`, da paleta da Igreja.

- Prop: `size` (padrão 18).
- Sempre `aria-hidden="true"`: é enfeite.
- Cor em **hex**, não token do tema: ela também é desenhada na imagem do mês,
  e o `html-to-image` captura estilos resolvidos. As pétalas são um rosa mais
  claro que o `accent` (`#bd0057`) de propósito: parecem flor, e enfeite não
  precisa de contraste de texto.
- Aparece na divisória da faixa de toda página ("linha · flor · linha"), no
  dia ocupado do calendário e na imagem do mês. É o toque feminino e delicado
  do site.

## `Footer.tsx`

Rodapé global, renderizado pelo layout em todas as páginas. **Azul-marinho**
(`bg-primary`), fechando a página como a faixa do cabeçalho abre; foco dourado
(`--focus-color`), como na faixa. **Uma linha só** (`max-w-3xl`), sem frase de
aviso, sem nome do site e sem "©" (o dono tirou tudo isso):

- **À esquerda:** o **ícone de Cristo** (`public/christ-icon.png`, 80px de
  altura, 96px a partir de 640px: o dono pediu bem visível) num link para o
  **site oficial da Igreja** (`https://www.churchofjesuschrist.org/?lang=por`,
  nova aba). Nome pelo `aria-label` "Site oficial da Igreja (abre em outra
  aba)"; imagem com `alt=""`; sem rótulo ao lado.
- **À direita:** "Desenvolvido por **Luis Henrique Engel Saul**" (link para
  `https://luishsaul.com.br/#contato`, nova aba, ícone de link externo e "(abre
  em outra aba)" só para leitor de tela), alinhado à direita. No celular ele
  quebra em duas linhas **ao lado** do ícone (`basis-40` + `grow`); só desce
  para baixo do ícone com letra muito grande (`flex-wrap`).

O ícone foi recortado de `public/lds.jpg` (na verdade um WebP, branco sobre
transparente) logo abaixo da barra, sem o nome da Igreja. **Atenção:** o Cristo
no arco é o símbolo oficial da Igreja (marca registrada). O dono foi avisado do
risco de usar a marca num site não oficial, sem frase de aviso no site, e
**decidiu manter** (25/10/2026). Os e-mails continuam com a frase "Feito por um
membro voluntário… Não é mantido nem aprovado pela Igreja…" no rodapé.

Todo link externo: `target="_blank"` com `rel="noopener noreferrer"` e aviso de
nova aba (ícone na tela, texto para leitor de tela).

## `HeaderBand.tsx`

A **faixa azul do cabeçalho**, igual em **todas as páginas** (pedido do dono:
um padrão só no site todo). É o "céu" do site (utilitário `bg-band` do
`globals.css`); o resto da página fica no fundo creme.

```tsx
<HeaderBand title="Painel da ala" />
```

- Uma prop só, `title`, no `h1` (**o único `h1` da página**; cartão não repete
  o título), centrado, `text-3xl` (36px a partir de 640px), `wrap-anywhere`;
  embaixo, a divisória dourada com a florzinha (26px). Espaço `py-8`
  (`sm:py-10`): o dono pediu a faixa maior.
- **Nada além do título:** sem ícone (o de Cristo fica no rodapé), sem botão e
  sem subtítulo. O "Sair" e o nome da ala do painel ficam numa linha logo
  abaixo da faixa ([routes_dashboard.md](routes_dashboard.md)).
- `<header>` é o `banner` da página; o conteúdo vai num `<main>` **depois** dele
  (header → main → footer).
- **Foco dourado:** define `--focus-color: var(--color-gold)`. Dentro da faixa o
  contorno de foco azul quase não aparece (1,89:1); o dourado tem ≥ 6:1.
- Altura ~140px no celular (mais com título em duas linhas). Na
  página da ala o calendário ainda começa na primeira tela do celular (as abas
  a ~230px em 390×844).

| Página | `title` |
|---|---|
| Home | Almoço dos Missionários |
| Ala | o nome da ala |
| Login | Acesso do líder |
| Acesso | Acesso ao painel |
| Nova senha | Nova senha |
| Painel | Painel da ala |
| 404 | Página não encontrada |
| Erro da ala | Não foi possível abrir o calendário |

## `button-classes.ts`

**O padrão dos botões do site.** Todo botão de ação usa `botao(tipo,
tamanho)`, que devolve as classes; quem chama só acrescenta **layout** (largura,
`grow`, `basis`, margem), nunca cor, altura, canto ou peso.

```tsx
<button className={`${botao('primario', 'grande')} w-full`}>Confirmar almoço</button>
<Link href="/admin" className={botao()}>Entrar</Link>
```

| `tipo` | Visual | Uso |
|---|---|---|
| `primario` (padrão) | azul `bg-secondary`, texto branco, sombra | a ação principal da tela |
| `secundario` | branco, contorno cinza, texto escuro | Cancelar, Manter, Voltar |
| `perigo` | framboesa `bg-accent`, texto branco | remover, desligar (na confirmação) |
| `dourado` | dourado `bg-gold`, texto marinho (7,8:1) | só o "Sair" do painel, sobre a linha azul (pedido do dono) |

| `tamanho` | Medidas | Uso |
|---|---|---|
| `normal` (padrão) | `min-h-12` (48px), `px-5`, `text-base` | painel e modais do painel |
| `grande` | `min-h-13` (52px), `px-6`, `text-lg` | páginas públicas e de login (agendar, entrar, nova senha, 404) |

Base comum: `rounded-xl`, `font-semibold`, `inline-flex` centrado com `gap-2`
(ícone/Spinner + texto), `active:scale-[0.98]`, `disabled:opacity-70`. Fica
fora do padrão de propósito: botões só de ícone (X, lápis, copiar/compartilhar,
que têm medidas próprias), as abas do mês, os botões das alas na home, as chaves
de notificação e os botões de texto ("Remover" na lista, "Esqueci minha senha").

## `MonthTabs.tsx`

As **abas de mês**: um botão por mês (`nomeDoMes`: "Outubro", "Novembro"), o
escolhido em azul cheio com ✓ e sombra, o outro branco com contorno azul de
2px. Props: `meses` (`YYYY-MM`[]), `ativo`, `onChange(ym)`, `label` (nome do
grupo para leitor de tela).

- `<button aria-pressed>` dentro de `role="group"`, não o padrão "abas" do ARIA
  (para duas opções, setas e foco móvel são complexidade sem ganho). Nome
  acessível = texto visível.
- `text-lg`, `min-h-13`. Tocar no já escolhido não chama `onChange`.
- Tem o próprio `@container`: com pouco espaço para o tamanho da letra
  (`@max-[15rem]`), empilha.
- Detalhes de uso no calendário em [routes_slug.md](routes_slug.md).

## `Modal.tsx`

**O modal do site.** Todo modal usa ele; não refaça a casca à mão.

```tsx
<Modal onClose={fechar} labelledBy="id-do-titulo" alerta className="max-w-sm text-center">
    <h3 id="id-do-titulo">…</h3>
    …
</Modal>
```

- Props: `onClose` (toque fora, Esc), `labelledBy` (id do título, vira o
  `aria-labelledby`), `alerta` (`role="alertdialog"`, para confirmação de
  remover/desligar; senão `dialog`), `className` da caixa (padrão `max-w-md`).
- **Portal no `<body>`** (`createPortal`): o modal sai de dentro da página, e
  assim o resto pode ficar inerte. Só é montado depois de um toque (nunca no
  servidor).
- Casca padrão: fundo azul `bg-primary/50` **desfocado** (regra do dono), fade
  ao abrir (`animate-aparecer` + `animate-surgir`) e fechamento na hora; fundo
  rolável (`overflow-y-auto overscroll-contain`) para o teclado do celular não
  esconder os botões; caixa branca `rounded-2xl p-6`, `z-60`.
- Foco, fundo inerte, trava da rolagem e Esc: `useModalLayer`
  ([src_hooks.md](src_hooks.md)). O foco começa na **caixa** (o leitor de tela lê
  o título; o teclado do celular não abre sozinho), ou no elemento marcado com
  `data-foco-inicial` (na confirmação, a opção segura: "Cancelar", "Manter
  ligado").
- Quem usa decide o conteúdo, inclusive o X e os botões.

## `ErrorMessage.tsx`

**Erro geral de formulário ou ação**: caixa rosa-claro (`bg-accent-soft`), ícone
"!" e texto rosa (`text-accent`, `font-medium`), `role="alert"` e fade ao
aparecer. Antes era só texto rosa solto, fácil de não ver.

- Uso: `{erro && <ErrorMessage key={erro}>{erro}</ErrorMessage>}`. A `key` faz o
  fade (e o anúncio) rodar de novo quando o erro muda. `className` para margem.
- O texto diz **o que fazer** ("Verifique a internet e tente de novo").
- **Um por vez:** erro de campo não usa este componente nem `role="alert"`; fica
  embaixo do campo, ligado por `aria-describedby`.
- `wrap-anywhere`: o texto pode trazer e-mail ou link longo.

## `LoadingOverlay.tsx`

Carregamento **na tela toda**: fundo azul translúcido desfocado, Spinner grande
(`h-12 w-12 border-4`) e um texto (padrão "Carregando…").

- Para transições que demoram um instante, como o owner trocando de ala
  ("Trocando de ala…", "Abrindo a ala…"): deixa claro que algo está acontecendo.
- `role="status"`, `aria-live="polite"`, `z-80` (acima dos modais).
- É uma camada como a de um modal (`useModalLayer`, [src_hooks.md](src_hooks.md)):
  vai para o `<body>` por portal, trava a página atrás e deixa o resto
  **inerte** (nada responde ao toque nem ao teclado enquanto carrega).
- Aparece com fade curto e some na hora: **renderize condicionalmente**
  (`{texto && <LoadingOverlay texto={texto} />}`).

## `NoticeBar.tsx`

O **aviso na tela** do site (o "toast"), sempre **no topo**, com o mesmo
visual em todo lugar: cartão branco, borda esquerda colorida, ícone e texto
`text-lg`.

- Props: `aviso` (`{ tipo: 'info' | 'sucesso' | 'erro', conteudo }` ou `null`)
  e `onClose` (opcional). Exporta o tipo `Aviso`.
- `info` (ícone "i") e `sucesso` (✓) com borda azul; `erro` ("!") com borda e
  ícone rosa. Texto `wrap-anywhere` (pode ter nome de usuário ou link longo).
- **Com `onClose`** aparece o X ("Fechar aviso", 44px) e o aviso **fica até a
  pessoa fechar** (ou até a próxima ação de quem chamou): é o que **explica**
  algo (dia ocupado, P-day, conflito, falha ao copiar). **Sem `onClose`**, quem
  chama tira sozinho: o que só **confirma** uma ação ("Link copiado!") some em
  3 s.
- **Anunciado:** a região `role="status"` (`aria-live="polite"`) fica **sempre
  montada** (o componente é renderizado mesmo com `aviso` nulo) e só o conteúdo
  muda; região criada junto com o texto costuma não ser lida. O X fica fora
  dela, para não ser lido junto.
- `fixed` no topo, `z-70` (acima dos modais), largura até `max-w-xl`, respeita
  o entalhe do iPhone (`env(safe-area-inset-top)`). Fade ao aparecer
  (`animate-aparecer`).
- **Não abre espaço na página:** fica por cima. Para o foco do teclado nunca
  ficar escondido atrás dele (WCAG 2.4.11), mede a própria altura
  (`ResizeObserver`) e grava em `--altura-aviso` no `<html>`, que vira o
  `scroll-padding-top` do `globals.css`. Antes ele ficava no rodapé e
  reservava um espaço no fim da página, que aparecia vazio.

## `Spinner.tsx`

O "estou trabalhando" dos botões. Um círculo com a borda de cima transparente,
girando com `animate-spin` (só CSS, sem JavaScript).

- Prop: `className` (padrão `h-5 w-5`; nos botões pequenos `h-4 w-4`).
- Usa a **cor do texto do botão** (`border-current`): branco no botão azul, rosa
  no botão de remover.
- `aria-hidden`: fica **sempre ao lado de um verbo** ("Confirmando…",
  "Salvando…"). É o texto que diz o que acontece; o círculo é só visual.
- Com `prefers-reduced-motion` ele **continua girando, só que devagar** (1,5 s):
  parado, a pessoa acha que travou e toca de novo (ver [src_app.md](src_app.md)).

Padrão de todo botão de ação enquanto espera: `disabled` + `aria-busy` +
`<Spinner />` + verbo no gerúndio. Assim tocar de novo não faz nada e a pessoa
sabe que está indo.
