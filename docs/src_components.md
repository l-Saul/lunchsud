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
| `field-classes` (`campo()`, `rotulo`) | todo campo de formulário do site |
| `SelectField` | `WardFilter`, `WardForm` (estado) |
| `PasswordField` | `AccountFields`, `ResetPasswordForm` |
| `AccountFields` | `LoginForm` (entrar e criar conta), `WardForm` (líder responsável do pedido) |
| `WardFilter` | home (abrir o calendário), modal do owner (trocar de ala), `/acesso` (pedir acesso) |
| `WardForm` | home (pedir ala nova, `RequestWard`), modal do owner (criar ala) |
| `ChoiceGroup` | `MonthTabs`, `WardForm` ("É ala ou ramo?") |
| `MonthTabs` | calendário da ala (`MonthCalendar`), cartão "Gerar imagem do calendário" (painel) |
| `Modal` | `BookingModal` (ala), `EditBookingModal`, confirmação de remover acesso, confirmação de desligar aviso (painel) |
| `ErrorMessage` | `BookingModal`, `EditBookingModal`, `UsersCard`, `NotificationsCard`, `WardForm`, `WardSwitcher`, `LoginForm`, `RequestAccess`, `ResetPasswordForm` |
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
**decidiu manter** (25/10/2026). A frase "Feito por um membro voluntário… Não é
mantido nem aprovado pela Igreja…" também saiu dos e-mails e do README: o dono
não quer esse aviso **em lugar nenhum**. Não recoloque.

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
| `dourado` | dourado `bg-gold`, texto marinho (7,8:1) | só o "Sair" do painel, sobre a linha azul (pedido do dono). As mesmas cores (sem `botao()`, por ser redondo e só ícone) estão no botão flutuante do owner, no `WardSwitcher` |

| `tamanho` | Medidas | Uso |
|---|---|---|
| `normal` (padrão) | `min-h-12` (48px), `px-5`, `text-base` | painel e modais do painel |
| `grande` | `min-h-13` (52px), `px-6`, `text-lg` | páginas públicas e de login (agendar, entrar, nova senha, 404) |

Base comum: `rounded-xl`, `font-semibold`, `inline-flex` centrado com `gap-2`
(ícone/Spinner + texto), `active:scale-[0.98]`, `disabled:opacity-70`. Fica
fora do padrão de propósito: botões só de ícone (X, lápis, copiar/compartilhar,
que têm medidas próprias), as abas do mês, os botões das alas na home, as chaves
de notificação e os botões de texto ("Remover" na lista, "Esqueci minha senha").

## `ChoiceGroup.tsx`

**Escolher uma opção entre poucas**, com botões grandes: a escolhida em azul
cheio com ✓ e sombra, as outras brancas com contorno azul de 2px. Props:
`opcoes` (`{ valor, rotulo }[]`), `ativo`, `onChange(valor)` e o nome do grupo
para leitor de tela (`label` ou `labelledBy`).

- `<button aria-pressed>` dentro de `role="group"`, não o padrão "abas" do ARIA
  (para poucas opções, setas e foco móvel são complexidade sem ganho). Nome
  acessível = texto visível.
- `text-lg`, `min-h-13`, duas colunas. Tocar no já escolhido não chama
  `onChange`. Rótulo comprido quebra a linha (`hyphens-auto wrap-break-word`).
- Tem o próprio `@container`: com pouco espaço para o tamanho da letra
  (`@max-[15rem]`), empilha.
- Para listas longas (estados, cidades), **não** use: vai `SelectField`.

## `MonthTabs.tsx`

As **abas de mês** ("Outubro", "Novembro", por `nomeDoMes`): só um
`ChoiceGroup` com os meses. Props: `meses` (`YYYY-MM`[]), `ativo`,
`onChange(ym)`, `label`. Mudar o visual = mudar o `ChoiceGroup`. Detalhes de uso
no calendário em [routes_slug.md](routes_slug.md).

## `field-classes.ts`

**O padrão de campo do site**, como o `botao()` é dos botões (pedido do dono:
"padronize os campos"). Todo `<input>`, `<select>` e `<textarea>` usa:

- `campo(erro = false)`: largura total, `rounded-xl`, borda cinza (rosa
  `accent` com erro), fundo branco, `px-4 py-3.5`, **`text-lg`** (abaixo de 16px
  o iPhone dá zoom sozinho), foco azul com anel, `appearance-none` (o iOS tira a
  sombra interna) e `disabled:opacity-60`. Quem chama só soma layout (ex.:
  `pr-12` para um ícone).
- `rotulo`: a classe do `<label>` (`text-base font-semibold text-text`).

Erro de campo: o texto vai embaixo do campo, ligado por `aria-describedby`, com
`aria-invalid` no campo (sem `role="alert"`; ver `CLAUDE.md`).

## `SelectField.tsx`

Lista de escolha (`<select>` nativo) com a cara do `campo()` e uma seta própria
à direita (`appearance-none` some com a seta do sistema, que era diferente em
cada aparelho). Recebe tudo que um `<select>` recebe, mais `erro`. É o
"dropdown" do site: no celular abre o seletor do próprio aparelho, que é o mais
fácil de usar.

## `PasswordField.tsx`

Campo de senha com o botão de olho "Mostrar senha" / "Ocultar senha"
(`aria-pressed`, ícone de 22px, à direita, dentro do campo). Guarda sozinho se
está mostrando. Recebe tudo que um `<input>` recebe (menos `type`), mais `erro`.

## `AccountFields.tsx`

**Os campos de conta do líder**, um componente só para o login e para o pedido
de ala nova (pedido do dono: "os campos iguais o cara faz para criar uma conta,
mesmo componente").

- `modo="entrar"`: E-mail (`autoComplete="username"`) e Senha
  (`current-password`).
- `modo="criar"`: **Seu nome** (`name`), **E-mail** (`email`), **Senha** e
  **Confirmar senha** (`new-password`), com os textos de exemplo "Digite seu
  nome aqui", "Digite seu e-mail aqui", "Digite sua senha aqui", "Digite a senha
  novamente".
- Controlado: `dados` (`DadosConta`: `nome`, `email`, `senha`, `confirmar`),
  `onChange(campo, valor)`, `erros` (texto por campo), `disabled`, `prefixo` dos
  `id` (o login usa `''`: `nome`, `email`, `senha`, `confirmar-senha`).
- `conferirConta(dados)` devolve os erros de "criar": "Informe seu nome.",
  "Digite um e-mail válido.", "A senha precisa ter pelo menos 6 caracteres.",
  "As senhas não conferem.". `ORDEM_CONTA` e `idDoCampoConta` servem para pôr o
  foco no primeiro campo errado.

## `WardFilter.tsx`

**A busca de ala**, um componente só para tudo que escolhe uma ala (pedido do
dono: "uma mudança ajusta tudo, mesmo tendo utilidades diferentes do botão
final"): a home (abre o calendário), o modal do owner (troca a ala em foco) e
o `/acesso` (escolhe a ala e depois "Pedir acesso").

- **Estado** e **Cidade** em `SelectField` (só os estados e cidades que têm ala
  ativa, em ordem alfabética; estado pelo nome, "Paraná"). Cidade fica
  desativada até escolher o estado. O texto vazio das duas é só "Escolha…" (o
  rótulo já diz o quê): a lista do sistema não quebra linha, e "Escolha o
  estado…" ficava cortado em 320px com letra grande.
- **Sem escolha automática** (regra do dono): os dois campos começam vazios em
  todo lugar, mesmo com um estado ou uma cidade só, e a pessoa escolhe. Trocar
  o estado limpa a cidade.
- Com estado e cidade, a `instrucao` (`text-lg`) e as alas da cidade: o mesmo
  botão em toda parte, branco com a fitinha na borda esquerda, `text-xl`, seta
  "›"; hover azul.
- `onEscolher(ala)` é o que muda de um uso para o outro. `marcada` (opcional)
  liga o `aria-pressed` e pinta de azul com ✓ a ala escolhida (owner: a ala em
  foco; acesso: a escolhida). `ocupada` + `textoOcupado` ("Abrindo…") mostram
  o spinner e travam a lista; `desativado` só trava.
- `AlaDoFiltro = { chave, nome, estado, cidade }`: `chave` é o slug na home e o
  `id` (texto) no painel e no acesso.
- Não tem cartão próprio: a home põe a busca num cartão branco; no modal e no
  `/acesso` ela já está dentro de um.

## `WardForm.tsx`

**O formulário de ala**, um componente só para o owner criar e para a home pedir
(regra do dono). `modo="owner"` (`onCriada`, `onCancelar`) ou `modo="pedido"`
(`onEnviado(email)`).

- Campos da ala, nesta ordem: **"É ala ou ramo?"** (`ChoiceGroup` Ala/Ramo),
  **Nome da ala/do ramo** (com "Vai aparecer como **Ala São Lourenço**" ao
  digitar; o owner vê também o link, "· link /pr_curitiba_sao-lourenco"),
  **Estado** (`SelectField` com as 27 UFs, "Escolha…") e **Cidade**.
  **Só Brasil: sem país. Sem endereço** (o dono tirou). Tudo com
  `autoComplete="off"` (é dado da ala).
- `modo="pedido"` acrescenta **"Líder responsável"**:
  - sem `contaLogada`: "Crie a conta de quem vai cuidar do calendário…" e o
    `AccountFields modo="criar"` (conta nova);
  - com `contaLogada` (`{ nome, email, ala }`, alguém logado): "Quem vai cuidar
    do calendário. Pode ser a sua conta ou uma conta nova." e um `ChoiceGroup`
    **"Minha conta"** (padrão) / **"Conta nova"** (rótulos curtos: "Usar a minha conta" quebrava a palavra no meio no cartão estreito do `/acesso`). Com a própria
    conta: "Você entrou como **Rita** (rita@…). O pedido vai com esta conta." e,
    **só se ela tiver ala**, o aviso rosa-claro "Atenção: ao enviar, você perde
    o acesso à **Ala X**. Para manter, escolha "Conta nova"." Sem ala, sem
    aviso. Envia `usarConta: true` no lugar de `lider`.
  - `onEnviado(email, usouConta)`. E o campo-armadilha `website`, fora da tela, e o `tempo`
  desde que o formulário abriu (ver `/api/alas/pedir` em
  [routes_api.md](routes_api.md)).
- **`modo="pedido"` em dois passos** (pedido do dono: o formulário inteiro
  parecia enorme e dava a impressão de que tudo era obrigatório de uma vez):
  "Passo 1 de 2 · A ala" (os campos da ala e **"Continuar"**) e "Passo 2 de 2 ·
  Quem vai cuidar do calendário" (um resumo da ala, "Ala X / Cidade (UF)", com
  **"Alterar"** para voltar, a parte do líder e **"Enviar pedido"**). A linha do
  passo recebe o foco ao trocar (o leitor de tela anuncia). O `modo="owner"`
  continua num passo só, sem líder.
- Estado e Cidade ficam **lado a lado** quando o formulário tem espaço
  (container query `@md`, 28rem: o modal da home); no cartão estreito do
  `/acesso`, um embaixo do outro.
- Confere antes de seguir: o passo 1 confere a ala, o passo 2 a conta. Erro
  embaixo de cada campo, foco no primeiro errado. Erro do servidor (ala repetida, e-mail com conta, teto de pedidos)
  vai no `ErrorMessage`, com o texto da rota.
- Botões: pedido → "Enviar pedido" largo ("Enviando…"); owner → "Cancelar" e
  "Criar e entrar" ("Criando…").
- `POST /api/alas/pedir` ou `/api/alas/criar`, corpo
  `{ tipo, nome, estado, cidade }` (+ `lider`, `website`, `tempo` no pedido).

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
  esconder os botões; caixa branca `rounded-2xl`, `z-60`.
- **Teclado do celular:** a camada fica do tamanho da parte visível da tela
  (`useVisualViewport`: `top` e `height` do `visualViewport`), então com o
  teclado aberto o modal encolhe e rola, e o último campo e o botão continuam
  alcançáveis. Ao focar um campo (`onFocus`), depois de 350 ms (o teclado
  subindo) o campo é rolado para o meio (`scrollIntoView({ block: 'center' })`).
  No Android, o `interactiveWidget: 'resizes-content'` do viewport já encolhe a
  tela; no iPhone, que ignora isso, quem resolve é o `visualViewport`. Com zoom
  de pinça (`scale ≠ 1`) a camada volta a ocupar a tela toda. Margem da caixa `p-5`
  e em volta dela `p-3` no celular (`sm:p-6` / `sm:p-4` a partir de 640px): em
  320px com letra grande, as margens maiores apertavam o título até quebrar a
  palavra no meio.
- Foco, fundo inerte, trava da rolagem e Esc: `useModalLayer`
  ([src_hooks.md](src_hooks.md)). O foco começa na **caixa** (o leitor de tela lê
  o título; o teclado do celular não abre sozinho), ou no elemento marcado com
  `data-foco-inicial` (na confirmação, a opção segura: "Cancelar", "Manter
  ligado").
- Quem usa decide o conteúdo, inclusive o X e os botões.

## `ErrorMessage.tsx`

**Erro geral de formulário ou ação**: caixa rosa-claro (`bg-accent-soft`), ícone
"!" e texto rosa (`text-accent`, `font-semibold`), `role="alert"` e fade ao
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
