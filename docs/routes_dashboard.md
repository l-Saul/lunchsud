# `/dashboard`: painel do líder

Onde o líder **confere, edita e remove** os almoços da ala, vê o **histórico**,
escolhe os **avisos por e-mail**, **aprova ou remove** outros líderes e **gera a
imagem do mês** para mandar no grupo do WhatsApp. O owner também **troca de
ala** e **cria alas**.

## Arquivos

```
src/app/(leader)/dashboard/
  page.tsx                          Server Component: busca TODOS os dados; monta os cards
  _components/
    BookingsCard.tsx                card "Agendamentos" (mês atual + seguinte)
    CollapsibleMonth.tsx            um mês recolhível dentro do BookingsCard
    EditBookingModal.tsx            lápis + modal de editar/remover um almoço
    HistoryCard.tsx                 card "Histórico de almoços" (3 meses anteriores)
    NotificationsCard.tsx           card "Notificações" (avisos por e-mail)
    UsersCard.tsx                   card "Usuários" (aprovar/remover acesso)
    WardSwitcher.tsx                botão flutuante do owner + modal: pedidos de ala, trocar e criar ala
    OpenCalendarButton.tsx          atalho para o calendário público da ala
    ShareLinkButtons.tsx            copiar e compartilhar o link da ala (ao lado do atalho)
    LogoutButton.tsx                botão Sair
    DashboardClientGuard.tsx        volta ao login se a sessão cair
    DashboardRealtime.tsx           painel ao vivo (WebSocket → router.refresh)
    month-image/
      MonthImageExport.tsx          cartão "Gerar imagem do calendário" (baixar / enviar no WhatsApp)
      MonthImage.tsx                o calendário desenhado na imagem
```

**Divisão de responsabilidade:** `page.tsx` faz todas as consultas; os cards só
exibem e chamam as APIs. Mudanças voltam à tela por `router.refresh()` (o
Server Component busca de novo).

## Papéis e escopo

| | owner (`perfil.is_owner`) | member |
|---|---|---|
| Alas | todas; a "ala em foco" vem do cookie `ala_atual` (ou a 1ª por nome) | só a do seu vínculo aprovado |
| Trocar de ala / criar ala | sim (`WardSwitcher`) | não (o botão nem aparece) |
| Editar/remover almoço | da ala em foco | da sua ala |
| Aprovar/remover usuário | de qualquer ala | da sua ala |

Toda escrita é filtrada pela ala em foco **no servidor** (ver [routes_api.md](routes_api.md)).
Sem login → `/admin`; logado sem ala aprovada → `/acesso` (`requireAcesso`).

## Regras de negócio

- **Janela do painel = mês atual + seguinte, no fuso da ala**
  (`getDashboardRange(ala.fuso_horario)`; sem ala em foco, `FUSO_PADRAO`).
- **"X de Y dias"**: `Y = dias do mês − segundas sem almoço`
  (`diasDisponiveisNoMes(ym, datas)`; nos Agendamentos e no Histórico). Segunda
  com almoço movido pelo líder conta no Y, e a barra do histórico fica no
  máximo cheia (100%).
- **Histórico = só os 3 meses anteriores** ao atual (`getHistoricoRange(3, fuso)`).
  Não carregue mais que isso.
- **O líder pode o que o membro não pode:** mover um almoço para segunda (P-day),
  para um dia passado ou para fora da janela. Só `/api/agendar` (membro) barra
  isso; o banco não.
- **Telefone** só aparece aqui (e na imagem do mês, que o líder gera).

## `page.tsx` (Server Component)

- `dynamic = 'force-dynamic'`, `revalidate = 0`. Metadata: título "Painel da
  ala", `robots: noindex, nofollow`.
- `requireAcesso()` → `{ userId, nome, isOwner, alaId }`.

### Consultas (todas pelo service-role)

| Dado | Consulta | Sem ala em foco |
|---|---|---|
| Ala em foco | `ala`: `nome, slug, fuso_horario` por `id` | `null` |
| Agendamentos | `agendamento`: `id, data, nome, telefone`, `ala_id = alaId`, `inicio ≤ data < fim`, por data | `[]` |
| Histórico | `agendamento`: `data`, `histInicio ≤ data < histFim`; contado por mês (`YYYY-MM`), do mais recente ao mais antigo, com `disponiveis` de cada mês | `[]` |
| Usuários | `ala_membro`: `id, status, user_id` da ala em foco (por status), depois `perfil`: `id, nome, email` desses usuários | `[]` |
| Alas para troca (só owner) | `ala` **ativas**: `id, nome, slug, estado, cidade`, por nome | — |
| Pedidos de ala (só owner) | `ala` **pendentes**: `id, nome, cidade, estado, criado_em, pedido_por, pedido_conta_nova`, por `criado_em`; depois `perfil`: `id, nome, email` de quem pediu. `pedidoEm` = `dataPorExtenso(diaNoFuso(criado_em))` | — |
| E-mail do líder | `perfil`: `email` do usuário logado | não busca |
| Avisos por e-mail | `buscarPreferenciasEmail(userId, alaId)`: a linha de `email_preferencia` do usuário **nesta ala** (sem linha: tudo desligado) | não busca (card escondido) |

Os usuários são **sempre os da ala em foco** (member: a sua; owner: a
selecionada). Como todos são da mesma ala, o card não mostra o nome da ala em
cada um.

### Layout (de cima para baixo)

1. `DashboardClientGuard` envolvendo tudo; `DashboardRealtime` se houver ala em foco.
2. `HeaderBand title="Painel da ala"` (só o título e a flor).
3. **Linha da ala:** logo abaixo da faixa, em
   **destaque com cor** (pedido do dono: "mais cor e vida"): degradê do azul de
   ação ao marinho (`bg-linear-to-r from-secondary to-primary`), sombra, foco
   dourado. O **nome da ala em foco** em branco (`text-xl`, negrito; "Selecione
   uma ala" sem ala) e o `LogoutButton` **dourado** à direita. Sem enfeite (o
   dono recusou a faixinha vertical)
   (`flex-wrap`: com letra grande o botão desce). A pessoa lê em que ala está e
   acha o "Sair" logo de cara. Sem o " · owner" de antes (termo técnico na tela).
4. Se a ala tem slug, uma linha com `OpenCalendarButton` (ocupa o espaço que sobra) e
   os dois botões de ícone do `ShareLinkButtons` (copiar e compartilhar), todos com
   a mesma altura (`items-stretch`, `gap-2`, `sm:gap-3`).
5. `MonthImageExport` (cartão "Gerar imagem do calendário") → `BookingsCard` →
   `HistoryCard` → `NotificationsCard` (só com ala em foco) → `UsersCard`.
6. `WardSwitcher` (só owner, mesmo sem nenhuma ala: é por ele que se cria a primeira e se aprovam pedidos): **fora** da `<section>` dos
   cartões, no fim do `<main>`. É o botão fixo no canto inferior esquerdo da
   tela (ver a seção dele).

Do item 3 em diante tudo fica no `<main>`, sobre o fundo creme, em
`max-w-3xl`, com **`gap-[1.575rem]`** entre os grupos (25,2px: o `gap-6` + 5%,
pedido do dono). Os cartões são brancos com `ring-1 ring-primary/10` e
`shadow-md`.

**Letra no painel** (escala do `CLAUDE.md`): título da faixa `text-2xl`,
título de cartão `text-xl`, subtítulo de seção (`h3`: mês, "Aguardando
aprovação", "Com acesso", "Nova ala") `text-lg`, todo o resto `text-base`
(16px). Sem `sm:text-*` para "compensar".
Nome da ala na faixa, nomes e e-mails nos cartões quebram a linha
(`wrap-anywhere`), nunca "…".

## `BookingsCard.tsx` (Server Component)

Props: `mesAtual`, `mesSeguinte` (`YYYY-MM`), `agendamentos` (`{ id, data, nome, telefone }[]`).

- Cabeçalho "Agendamentos" (barrinha rosa). A imagem do mês tem cartão próprio,
  logo antes (`MonthImageExport`).
- Um `CollapsibleMonth` por mês, com o rótulo (`formatMonthLabel`), o total e os
  disponíveis.
- Mês vazio: "Nenhum almoço agendado ainda." (caixa tracejada).
- Cada almoço: medalhão azul de ação (`bg-secondary`, o mesmo azul dos botões; `size-14`) com o dia e o dia da semana ("27 /
  ter", `diaTile`; o mês já está no título), nome (`wrap-anywhere`: quebra a
  linha, nunca "…"; aguenta 80 caracteres sem espaço), telefone e o
  `EditBookingModal`. **Uma coluna** sempre: em duas, os nomes eram cortados.

## `CollapsibleMonth.tsx` (client)

Um mês do card de Agendamentos que **recolhe e expande ao clicar no nome**. Um
mês tem ~30 dias: recolher o de cima evita rolar tudo para editar o de baixo.

- Props: `label` ("Junho 2026"), `total` (agendados), `disponiveis` (dias
  agendáveis, sem segundas), `defaultOpen` (padrão `true`), `children`.
- Cabeçalho é um `<button>` com `aria-expanded`: seta azul de 24px que gira
  (−90° fechado), o nome do mês e o selo rosa "X de Y dias". Sem texto
  "Abrir"/"Fechar" (o dono testou e não gostou).
- Abre e fecha **animando a altura só com CSS**: a linha do grid vai de `0fr` a
  `1fr` (200 ms). Fechado, o conteúdo fica `inert` (fora do Tab e do leitor de tela).
- **Cabeçalho grudado no topo** (pedido do dono): com o mês aberto, ao rolar a
  lista o cabeçalho fica no alto da tela (`sticky top-0`), para fechar sem subir
  tudo. Ele vive dentro da `<section>` do mês, então **sai sozinho quando o mês
  acaba** (o do mês seguinte assume) e quando a pessoa sai do card. Fechado, não
  gruda (a seção tem só a altura do cabeçalho). Fundo branco de ponta a ponta do
  card (`-mx-4`/`sm:-mx-8`, a mesma medida do `p-4`/`sm:p-8` do `BookingsCard`;
  mude os dois juntos) e `-my-2 py-2`, que dá folga no topo sem mudar o layout
  parado. Grudado, ganha `shadow-md` (estado `fixado`, medido no `scroll` pelo
  `<div>` marcador antes do cabeçalho; `IntersectionObserver` não serve: num
  pulo de rolagem o marcador vai de "abaixo da tela" para "acima" sem disparar).
- **Fechar grudado não larga a pessoa no fim:** antes de fechar, se o cabeçalho
  está grudado, a página sobe na hora (`scrollBy` com `behavior: 'instant'`; o
  `html` tem `scroll-behavior: smooth`) a distância entre o marcador e o
  cabeçalho. O cabeçalho fica parado sob o dedo e o mês seguinte aparece logo
  abaixo. Sem isso, a lista sumia e a pessoa caía no meio do mês seguinte ou do
  Histórico.

## `EditBookingModal.tsx` (client)

Botão de **lápis** (`aria-label="Editar agendamento"`, 44px, SVG inline) que
abre o modal de editar ou remover um almoço. Props: `id`, `data`, `nome`, `telefone`.
Modal `max-w-lg`; rótulos em texto escuro (`text-base`) e campos em `text-lg`.

### Campos

`form` é uma cópia editável da linha.

| Campo | Detalhes |
|---|---|
| Data (`type="date"`) | qualquer data: o líder pode mover para segunda ou para o passado |
| Nome | `autoComplete="off"`: dado de outra pessoa; senão o celular sugere o nome do próprio líder |
| Telefone | `type="tel"`, `inputMode="tel"` (tecla `+`), `maxLength=25`, `autoComplete="off"`; **sem máscara** ao digitar, arrumado no `onBlur` com `normalizarTelefone` |

Os três campos usam o padrão `campo()` do site (`field-classes`, ver
[src_components.md](src_components.md)), com a mesma altura e largura no celular.
O `appearance-none` + `min-w-0` dele corrigem o `<input type="date">` do iOS Safari,
que senão ignora `width: 100%` e fica mais largo que os outros (estoura o container).

### Salvar

1. Valida com as **mesmas regras do servidor** (`parseEdicao`): nome com 2+
   caracteres e telefone que `normalizarTelefone` entende. Senão o líder via só
   "Erro ao atualizar". Mensagens: "Informe o nome." / "Confira o telefone, com
   DDD (ou + e o código do país)." (embaixo do campo, ligadas por
   `aria-describedby`); o foco vai para o primeiro campo errado.
2. `POST /api/agendamentos/update { id, data, nome, telefone }`.
3. Sucesso → fecha e `router.refresh()` (atualiza a lista sem recarregar a página).
   Dia já ocupado (409) → dentro do modal, no `ErrorMessage`: **"Já há um
   almoço nesse dia. Escolha outro dia e toque em Salvar de novo."** Outro erro →
   **"Não foi possível salvar. Confira se já não há almoço nesse dia e tente de
   novo."** Sem internet →
   **"Sem conexão com a internet. Verifique a internet e tente de novo."** (o
   botão não fica preso em "Salvando…"). A mensagem da API ("Erro ao
   atualizar") é técnica e não aparece.

Mover para um dia que já tem almoço viola o `unique (ala_id, data)`: é o erro
mais comum, por isso a mensagem fala dele.

É um `<form noValidate>`: **Enter salva**. No nome, `enterKeyHint="next"` e Enter
leva ao telefone; no telefone, `enterKeyHint="done"`.

### Remover

**Confirmação inline**, não `window.confirm` (que falha em vários celulares):
"Remover agendamento" troca para os botões **"Manter"** e **"Confirmar remoção"**
(rosa, `accent`, nunca vermelho). Confirmar → `POST /api/agendamentos/delete { id }`.
Mesmo tratamento de sucesso; erro → "Não foi possível remover. Atualize a
página e tente de novo." (o almoço pode já ter sido removido em outro aparelho).

### Modal

- Usa o **`Modal`** ([src_components.md](src_components.md)), `max-w-lg`:
  fundo inerte, foco na caixa ao abrir e **de volta no lápis** ao fechar.
- Fecha por **toque fora**, **Esc** e **X** (fecho explícito: no celular o
  toque no fundo pode não pegar). Fechar zera a confirmação de remoção e o erro.
- O lápis não cresce no hover (sem "pulinho", regra de animação).
- Fundo rolável: com o teclado aberto o modal pode passar da tela e ainda dá
  para rolar até os botões.
- Botões com alvos **≥ 48px** (`min-h-12`), empilhados e largos; "Salvando…" /
  "Removendo…" com Spinner, todos desativados enquanto uma ação roda.
- Abre com fade (`animate-aparecer` + `animate-surgir`), fecha na hora.

## `HistoryCard.tsx` (Server Component)

Exporta `HistoryCard` e o tipo `MesHistorico = { ym, total, disponiveis }`.

- Uma linha por mês (só os que tiveram almoço): rótulo do mês, barra rosa
  proporcional (`total / disponiveis`, mínimo 6% para a barra sempre aparecer) e
  "total/disponíveis".
- A barra é `role="img"` com `aria-label="X de Y dias"`.
- Vazio: "Ainda não há almoços anteriores."
- Rótulo do mês com largura fixa `w-32` (cabe "Setembro 2026" em `text-base`).

## `NotificationsCard.tsx` (client)

Card **"Notificações"**, antes de Usuários. O líder escolhe quais **avisos por
e-mail desta ala** quer receber. Os avisos só informam (sem botão nem link; o
rodapé deles diz para desligar aqui, em Notificações). Como os avisos são montados e
enviados está em [src_lib.md](src_lib.md) ("Avisos por e-mail"); a rota, em
[routes_api.md](routes_api.md).

**A notificação é sempre usuário + ala.** O card vale só para a **ala em foco**.
O owner não tem nada diferente: ele liga o que quiser em cada ala, trocando de
ala no painel. O `page.tsx` só mostra o card com uma ala em foco e usa
`key={alaId}`: ao trocar de ala o card recomeça com as preferências da ala nova.

Props: `alaId`, `email` (do `perfil`; `null` → "Esta conta não tem e-mail
cadastrado.") e `preferenciasIniciais`.

### Topo

- Linha do título: "Notificações" à esquerda e, à direita, o estado do
  salvamento (`role="status"`, `aria-live`): "Salvando…" com Spinner →
  **"Salvo."** (azul). Fica na mesma linha do título para não deixar um espaço
  vazio entre o texto e as chaves.
- Para onde vão os avisos, em duas linhas: "Os avisos chegam no e-mail:"
  (cinza) e, embaixo, o **e-mail** em destaque (`text-lg`, negrito,
  `wrap-anywhere`). Sem e-mail: "Esta conta ainda não tem e-mail cadastrado.".
  O dono tirou o "Escolha quais e-mails quer receber…": as chaves já dizem isso.
- Erro de salvamento: `ErrorMessage` (caixa rosa) entre o topo e as chaves, só
  quando há erro.
- Espaçamento: 20px entre o topo e as chaves, 12px entre uma chave e outra.

### Avisos (todos desligados por padrão)

Uma lista só, sem títulos de grupo. Cada chave tem um título curto e **uma frase
completa** dizendo quando o e-mail chega e o que vem nele. Curto não pode virar
vago: "Quando alguém agenda um almoço" dava a entender que qualquer mudança no
calendário manda e-mail.

| Chave | Título | Frase |
|---|---|---|
| `novo_almoco` | Novo almoço neste mês | "Quando alguém agenda um almoço para um dia deste mês, chega um e-mail com o nome, o dia e o telefone." |
| `dia_sem_almoco` | Dia sem almoço | "Quando faltam dois dias e o dia ainda está sem almoço, chega um e-mail avisando qual é o dia." |
| `semana` | Almoços da semana | "Toda segunda-feira, chega um e-mail com os almoços de terça a domingo, com nome e telefone." |
| `proximo_mes` | Almoços do mês seguinte | "Um dia antes do fim do mês, chega um e-mail avisando que o mês seguinte já pode ser agendado, com quem já agendou e quais dias ainda estão livres." |
| `pedido_acesso` | Pedido para entrar no painel | "Quando outro líder cria uma conta e pede para usar o painel desta ala, chega um e-mail com um botão para abrir o painel e aprovar o pedido." |

As frases não falam em link: os avisos não têm. Só o e-mail de pedido tem um
botão, e a frase dele diz isso. "Almoços do mês seguinte" já é o aviso de que o
mês abriu: não há outro aviso no dia 1.

- Nada vem ligado: o líder escolhe o que quer receber.
- Cada chave é um `<button role="switch" aria-checked>` do tamanho da linha
  (≥ 56px), com título, frase e o interruptor. **Nome curto:** só o título
  (`aria-labelledby`); a frase vai por `aria-describedby`.
- Interruptor de 28 × 48px (`h-7 w-12`, bolinha `size-5`): **ligado** = trilho
  framboesa (`accent`, pedido do dono; branco sobre ele dá 5,9:1), bolinha
  branca à direita; **desligado** = trilho branco com contorno
  cinza `faded` (5,4:1) e bolinha cinza à esquerda (antes era cinza-claro,
  ~1,5:1, abaixo do mínimo de 3:1). O estado se vê pela cor do trilho **e**
  pela posição da bolinha, e o leitor de tela lê pelo `aria-checked`. **Sem
  texto "Ligado"/"Desligado"** embaixo: o dono tirou, junto com o tamanho
  antigo (32 × 56px), que achou grande. O alvo de toque continua sendo a linha
  inteira.
- A lista está em `AVISOS`, no próprio componente.
- Não há aviso de almoço editado ou removido: quem faz isso é o próprio líder.
- O e-mail "Pedido aprovado" **sempre** é enviado à pessoa aprovada e não aparece aqui.

### Desligar pede confirmação

**Ligar é direto** (um toque). **Desligar abre um modal** antes, para um toque
sem querer não cortar um aviso:

- Só o título **"Desligar este aviso?"**, sem texto: o modal abre logo depois
  do toque na chave, então já está claro qual é o aviso.
- Botões **"Manter ligado"** (já com o foco, a opção segura) e **"Desligar"**
  (rosa, `accent`). Alvos ≥ 48px, lado a lado quando cabem (`flex-wrap` com
  `basis` em rem).
- Fecha sem mudar nada por "Manter ligado", **Esc** ou **toque fora**. Só
  "Desligar" muda a chave e salva.
- Usa o **`Modal`** com `alerta` (`role="alertdialog"`), igual ao de remover
  acesso do `UsersCard`. O foco começa em "Manter ligado" (`data-foco-inicial`)
  e, ao fechar, **volta à chave** que foi tocada.

### Salvar ao tocar

Sem botão "Salvar" (menos passos). Cada toque atualiza a tela na hora e manda
**todas** as chaves + o `alaId` para `POST /api/avisos/preferencias`.

- Toques rápidos entram numa **fila**: só um envio por vez, e ao terminar manda
  o estado mais recente.
- Se um envio falhar, a tela **volta ao último estado salvo** e mostra o erro:
  "Não foi possível salvar. Tente de novo.", "Sem internet. Verifique a conexão e
  tente de novo." ou,
  se a ala em foco mudou em outra aba (409), "A página está desatualizada.
  Atualize a página."

## `UsersCard.tsx` (client)

Exporta `UsersCard` e o tipo `Usuario = { id (do vínculo ala_membro), nome, email, status }`.

- Seções **"Aguardando aprovação"** (só se houver) e **"Com acesso"** ("Ninguém
  com acesso ainda."). Sem nenhum: "Nenhum usuário vinculado ainda."
- Cada linha: nome (ou "(sem nome)"), e-mail, **Aprovar** (pendentes) e **Remover**.
  **A própria conta** aparece com "(você)" depois do nome (`Usuario.voce`, do
  `page.tsx`: `user_id === ctx.userId`) e **também pode ser removida** (decisão
  do dono). A confirmação muda: título "Tirar o seu acesso?", "Você vai sair do
  painel desta ala. Para voltar, precisa pedir acesso de novo." e o botão
  "Tirar meu acesso". Se ela for a **única com acesso** (o único aprovado),
  aparece antes, em destaque rosa-claro: "Você é a única pessoa com acesso a
  esta ala. Sem você, ninguém vê os almoços nem aprova pedidos." Feito, vai
  direto para `/acesso` (`router.push`).
  `flex-wrap` com `basis-40`: em tela estreita os botões descem.
- **Uma ação por vez:** enquanto uma roda, todos os botões ficam travados, e o
  botão da ação mostra o verbo ("Aprovando…" / "Removendo…") com Spinner.
- `POST /api/acesso/aprovar` ou `/remover` com `{ membroId }`. Depois de dar
  certo, `router.refresh()` e a limpeza do estado rodam **na mesma transição**
  (`useTransition`): o "Aprovando…" fica até a lista nova chegar e os dois
  aparecem juntos. Erro → `ErrorMessage` no topo do cartão: "Não foi possível
  aprovar. Atualize a página e tente de novo." / "Não foi possível remover o
  acesso. Atualize a página e tente de novo."; sem internet → "Sem conexão com
  a internet. Verifique a internet e tente de novo." (some na próxima ação).
- **Remover pede confirmação** num modal que cobre a tela (fundo desfocado,
  `role="alertdialog"`): "Remover acesso?" / "Tem certeza que deseja remover o
  acesso de **\<nome\>**? Para voltar, a pessoa precisará pedir acesso de novo."
  Cancelar / Remover (rosa). Usa o **`Modal`** com `alerta`: foco começa em
  **Cancelar** (a opção segura) e, ao fechar, volta ao "Remover" da linha.
- `Linha` é um componente **fora** do `UsersCard` (recebe `emAndamento`,
  `onAprovar`, `onRemover`). Definido dentro do render, ele era recriado a cada
  mudança de estado: as linhas remontavam e o foco não tinha para onde voltar.
- O componente renderiza o próprio `<section>` (cartão branco). O modal é
  `fixed`, então ficar dentro do cartão não muda nada.

## `WardSwitcher.tsx` (client, só owner)

**Discreto de propósito** (pedido do dono): só o owner vê, então não ocupa
espaço no painel. Antes era um cartão branco entre a linha da ala e os botões;
virou um **botão redondo flutuante no canto inferior esquerdo** que abre um
modal.

- **Botão:** `size-15` (60px, ícone de 30px) no celular e `sm:size-18` (72px,
  ícone `sm:size-9` de 36px) a partir de 640px: o dono pediu maior,
  "principalmente no desktop, que tem espaço". **Dourado** (`bg-gold`, pedido do dono) com
  ícone de engrenagem azul-marinho (as cores do `botao('dourado')`), sombra e
  **`opacity-60`** (meio transparente, deixa ver a página atrás; fica inteiro
  no hover e no foco).
  `aria-label` e `title` "Administração geral", `aria-haspopup="dialog"`.
- **Pedidos esperando:** com ala pedida pela home, o botão fica **inteiro**
  (sem transparência) e ganha um círculo framboesa com o número no canto
  (`aria-hidden`); o nome vira "Administração geral: 2 alas esperando
  aprovação" (1: "1 ala esperando aprovação").
- **Posição:** **sempre flutuando** (pedido do dono): `fixed bottom-4 left-4`
  (`sm:bottom-6 sm:left-6`, alinhado à margem do `<main>`), por cima de tudo (`z-30`:
  acima do cabeçalho grudado dos meses, abaixo dos modais e do `NoticeBar`).
  No fim da página ele fica por cima do ícone de Cristo do `Footer`, que está
  no mesmo canto: o dono sabe e preferiu assim (antes era `sticky` e parava
  acima do rodapé; ele não quis).
- **Modal** (`Modal`, `max-w-lg`): título `h2` **"Administração geral"**
  (`text-xl`; quebra a linha com letra grande: `min-w-0 hyphens-auto
  wrap-break-word`, senão empurrava o X para fora em 320px) e o X "Fechar"
  (44px), como o `EditBookingModal`. Sem o "Acesso a todas as alas" do cartão
  antigo. Dentro, de cima para baixo:
  1. **"Esperando aprovação (N)"** (só com pedidos): um cartão por ala pedida,
     com o nome, "Curitiba (PR) · pedido em sábado, 25 de outubro" e "Líder:
     Rita · rita@…" (nome e e-mail quebram a linha). Botões **"Aprovar ala"**
     (azul) e **"Recusar"** (contorno). Recusar pede confirmação ali mesmo, em
     rosa-claro: "Recusar e apagar este pedido? A conta criada no pedido também
     é apagada." com "Voltar" e "Sim, recusar" (framboesa). Embaixo: "Depois de
     aprovar a ala, aprove o líder na parte Usuários do painel dela." Erro →
     `ErrorMessage` "Não foi possível aprovar/recusar o pedido. Tente de novo."
     (ou sem internet).
  2. **Trocar de ala** (`h3`): o **`WardFilter`** (o mesmo da home e do
     `/acesso`; ver [src_components.md](src_components.md)): estado e cidade
     começam vazios; na lista da cidade, a ala em foco aparece marcada (azul
     com ✓).
     Tocar numa ala troca na hora; na atual, nada. (O `<select>` de alas de
     antes saiu: no computador o menu do sistema era escuro e pequeno.)
  3. **Criar nova ala**: botão tracejado "+ Criar nova ala" que abre o
     **`WardForm modo="owner"`** (o mesmo formulário do pedido da home, sem a
     parte do líder) com o título "Nova ala"; "Cancelar" fecha o formulário.

### Pedido de ala (dois passos, decisão do dono)

1. **"Aprovar ala"** → `POST /api/alas/aprovar` (a ala vira ativa) → fecha o
   modal e **põe a ala em foco** ("Abrindo a ala…"), como ao criar.
2. Na ala aberta, o líder responsável está em **Usuários → Aguardando
   aprovação**: "Aprovar" ali (`/api/acesso/aprovar`) libera o painel e manda a
   ele o "Pedido aprovado". Antes do passo 1 esse botão não funcionaria (a rota
   recusa ala pendente).
- **"Recusar"** → `POST /api/alas/recusar` → `router.refresh()`; o cartão some
  da lista (o modal fica aberto).
- Um efeito em `[pedidos]` limpa a ação em andamento e a confirmação quando a
  lista chega de novo do servidor.

### Trocar

1. Ignora se for a mesma ala ou se já houver transição.
2. **Fecha o modal** e mostra o `LoadingOverlay` "Trocando de ala…" (tela
   toda). Fechar antes é de propósito: os dois são camadas de `useModalLayer`
   e não devem ficar abertos juntos.
3. `focarAla(alaId)` → `POST /api/ala-atual { alaId }` (grava o cookie
   `ala_atual`). Devolve `false` em erro **ou sem internet**: aí o overlay some
   e nada muda (a marca de ala atual vem de `atualId`).
4. Deu certo → `router.refresh()`. O overlay **fica** até o servidor renderizar
   os dados novos: um efeito em `[atualId]` limpa a transição quando a ala em
   foco muda (exceção `eslint-disable-next-line react-hooks/set-state-in-effect`).

### Ala criada ou aprovada (`entrarNaNova`, chamado pelo `WardForm` e pelo "Aprovar ala")

Fecha o modal e tenta focar a ala nova. Se conseguiu, mostra "Abrindo a ala…" e o efeito de
`[atualId]` encerra o overlay. Se não conseguiu, **só recarrega**, sem overlay
(não haveria troca de ala para encerrá-lo e a tela ficaria presa); a ala nova
aparece na lista.

## `OpenCalendarButton.tsx` (client)

"Abrir calendário" → `router.push('/<slug>')`. O loading ("Abrindo…" +
Spinner) **fica ligado de propósito** até a navegação desmontar a tela: a página
da ala é renderizada no servidor e demora um instante, e assim o líder vê que a
ação foi acionada.

- Divide a linha com o `ShareLinkButtons`: `flex-1 min-w-0`, texto centralizado
  e com `text-balance` (se precisar quebrar, as linhas ficam equilibradas).
- O ícone de calendário só aparece a partir de `sm` (640px): no celular o texto
  precisa do espaço.
- Toque: `active:scale-[0.98]`, sem "pulinho" no hover.

## `ShareLinkButtons.tsx` (client)

Dois botões **só com ícone**, ao lado do "Abrir calendário", para o líder
mandar o link da ala no grupo do WhatsApp. Props: `slug`, `nomeAla`. O link é
`siteUrl()` + `/<slug>` (em produção, `https://lunchsud.vercel.app/<slug>`).

| Botão | O que faz |
|---|---|
| **Copiar** (ícone de duas folhas) | copia o link (`navigator.clipboard`; se não houver, cópia por um campo escondido). O ícone vira ✓ e aparece o aviso **"Link copiado!"** (`NoticeBar`, no topo, tipo `sucesso`), que some em 3 s. Se nada funcionar: "Não foi possível copiar. O link é: \<link\>" (tipo `erro`), que **fica** com X para a pessoa ter tempo de copiar à mão |
| **Compartilhar** (ícone de três pontos ligados) | no celular abre o menu de compartilhar do sistema (`navigator.share`), com título "Calendário de almoços da \<ala\>", texto "Agende seu almoço para nossos missionários ❤️" e o link (o mesmo da prévia da página da ala). Sem esse menu (computador) abre o WhatsApp (`wa.me`) numa aba nova com a mesma mensagem. Cancelar o menu não faz nada |

- **Mesma cor do botão principal** (azul `bg-secondary`, ícone branco), cantos
  `rounded-xl` como os do padrão (`button-classes.ts`) e mesma altura; largura 3rem no celular e 3.5rem a partir de `sm`
  (≥ 44px de alvo). **Altura mínima própria** (`min-h-12`, `sm:min-h-13`): com
  letra grande a fileira quebra e o botão vai sozinho para a linha de baixo;
  sem isso ele ficava com a altura do ícone (24px, achado na varredura).
- Sem texto visível, então cada um tem `aria-label` ("Copiar o link do
  calendário da ala", "Compartilhar o link do calendário da ala") e `title`
  (dica no computador).
- O aviso é o `NoticeBar` ([src_components.md](src_components.md)): no alto
  da tela, por cima do painel (não empurra nada), anunciado ao leitor de tela.

## `LogoutButton.tsx` (client)

1. `signOut({ scope: 'local' })`: só limpa os cookies da sessão neste aparelho,
   sem a ida à rede que o `'global'` (padrão) faz para revogar a sessão em todos
   os dispositivos. Era o que deixava o Sair lento.
2. Em `finally`, **navegação real** com `window.location.assign('/admin')` (não
   `router.push`): uma requisição limpa ao `/admin`, com os cookies já apagados
   e sem cache de RSC. Evita o vaivém `/admin` ↔ `/dashboard` que prendia a tela.

`botao('dourado')` (pedido do dono), na linha azul da ala (fora da faixa):
fundo dourado, texto marinho (7,8:1), ícone de saída + **"Sair"**, 48px de
altura. Enquanto sai: `disabled`, `aria-busy`, Spinner no lugar do ícone e
**"Saindo…"**.

## `DashboardClientGuard.tsx` (client)

Escuta `onAuthStateChange`: em `SIGNED_OUT` (logout em outra aba ou sessão
expirada) faz `router.replace('/admin')`. Sincroniza o logout entre abas.

## `DashboardRealtime.tsx` (client)

Mantém o painel ao vivo: assina o WebSocket da ala em foco
(`useBookingsRealtime`) e, a cada mudança, chama `router.refresh()`, que busca de
novo os dados do Server Component sem recarregar a página.

Aqui **não dá para aplicar o evento direto** como na página pública: o painel
mostra o telefone, que nunca vem pelo WebSocket. Como são poucos líderes, o
custo é pequeno. Renderiza `null`.

## Imagem do mês (`month-image/`)

O líder escolhe o mês e gera uma **imagem PNG do calendário com nomes e
telefones** para mandar no grupo da ala.

### `MonthImageExport.tsx` (client)

O cartão **"Gerar imagem do calendário"** (título do dono), logo **antes** de
Agendamentos. Props: `meses` (`YYYY-MM`[]: o atual e o seguinte),
`agendamentos`.

- **Prévia:** miniatura **sempre quadrada** (`size-[224px]`, cantos e sombra)
  da imagem do mês escolhido: o próprio `MonthImage` (1024×1024) reduzido com
  **`transform: scale(224/1024)`** a partir do canto. Muda ao trocar o mês.
  `role="img"` com `aria-label` "Prévia da imagem de \<mês\>" (o conteúdo é
  `aria-hidden`). No computador fica à esquerda das abas e dos botões; no
  celular, em cima. Não precisa dar para ler: é para reconhecer o mês.
  **Não use `zoom`:** com `zoom`, o Chrome aplica o "tamanho mínimo de letra" do
  computador da pessoa, a letra cresce, os dias esticam e a miniatura ficava
  comprida e estranha (aconteceu no PC do dono). Com `transform`, o desenho é
  feito em tamanho real e só depois diminuído. Tamanho em px de propósito: com
  letra grande ela não cresce e não estoura.
- **Mês:** as abas `MonthTabs` ("Outubro" / "Novembro", as mesmas do calendário
  público; `label` "Mês da imagem"). Começa no mês atual.
- **"Baixar imagem"** (ícone de download): salva `almocos-<mês>-<ano>.png`
  (ex.: `almocos-novembro-2026.png`) por um `<a download>`.
- **"Enviar no WhatsApp"** (ícone de balão): abre o menu de compartilhar do
  aparelho com a imagem (`navigator.share({ files, title: 'Almoços de
  <mês>' })`); a pessoa escolhe o WhatsApp. **Só aparece se o aparelho
  compartilha arquivo** (`navigator.canShare({ files })`, testado ao montar):
  no computador quase nunca, então lá só há "Baixar" (e ele fica azul,
  `primario`); com os dois, "Enviar no WhatsApp" é o azul e "Baixar" o
  `secundario`. Cancelar o menu (`AbortError`) não mostra erro.
- Os dois lado a lado (`grow basis-48`), empilhados no celular. Enquanto gera,
  os dois ficam `disabled` e o tocado mostra Spinner + "Gerando…".
- Falha ao gerar → `ErrorMessage` "Não foi possível gerar a imagem. Tente de
  novo."

Como a imagem é feita:

1. Um container `#export-root` **0×0, fixo e escondido** (`overflow: hidden`,
   `z-index: -1`, `pointer-events: none`) recebe por portal (`createPortal`,
   só depois de montar no navegador) o `#calendar-export`: o `MonthImage` em
   **1024×1024** (`LADO_DA_IMAGEM`), só para virar imagem. O PNG sai com
   2048×2048 (`pixelRatio: 2`).
2. `gerarDiasDoMes(mes, agendamentos)` monta `{ data, numero, agendamentos }`
   para cada dia (via `useMemo`).
3. Espera **2 frames** (`requestAnimationFrame` duplo, para o DOM escondido já
   ter pintado), captura com `html-to-image` (`toPng`, `pixelRatio: 2`, fundo
   branco) e cria o arquivo.

Atenção: `gerarDiasDoMes` monta a data com `toISOString()` (UTC). Funciona nos
fusos das Américas (atrás de UTC); num navegador em fuso à frente de UTC as
datas sairiam um dia antes.

### `MonthImage.tsx` (client)

O calendário **desenhado para a imagem**, separado do calendário público.

- **Estilos inline + SVG, de propósito**: o `html-to-image` não depende do
  Tailwind, então a imagem sai igual em qualquer aparelho. Não troque por classes
  Tailwind nem por emojis. Cores em hex, da paleta do site:
  marinho `#003057` (cabeçalho, dias livres, nomes), framboesa `#bd0057` (dia
  com almoço, sábado e domingo), rosa-claro `#fdecf1` com borda `#fda1b2`
  (fundo do dia com almoço), dourado `#ffb81c` (divisória do cabeçalho), cinza
  `#676b6e` sobre `#eff0f0` (P-day), fundo creme `#faf7f5`.
- **Quadrada, 1024×1024** (`LADO_DA_IMAGEM`), em qualquer mês (pedido do dono:
  "sempre naquele quadrado" e "aproveite mais as bordas"): moldura creme fina
  (12px), cartão branco ocupando o resto, e a grade **estica para preencher a
  altura** (`gridTemplateRows: repeat(semanas, minmax(0, 1fr))`, `semanas` = 5
  ou 6). Cada dia tem `minHeight: 0` e `overflow: hidden`: o que não cabe é
  cortado, nunca empurra a imagem.
- Cabeçalho azul: "Almoço dos Missionários", mês e ano, divisória com florzinha.
- Dias da semana ("Dom", "Seg"…) e "P-day" em 16px, **sem maiúsculas**. Os
  tamanhos em px aqui são da imagem (ela tem largura fixa), não da tela.
- Dias da semana (sábado e domingo em framboesa) e grade com
  **`repeat(7, minmax(0, 1fr))`**: 7 colunas sempre iguais. Só `1fr` deixava um
  nome longo sem espaço esticar a coluna e empurrar o sábado para fora da imagem
  (achado com Playwright).
- Dia: medalhão com o número (azul livre, rosa com almoço, cinza P-day); P-day
  escrito no centro; com almoço, nome e telefone. **Almoço numa segunda ganha
  do P-day** (`pday = isPday(data) && !temAlmoco`): o líder pode mover um
  almoço para segunda, e a imagem vai para o grupo, então ela mostra quem vai
  receber os missionários (antes mostrava só "P-day" e escondia o nome, achado
  na varredura). O calendário público continua mostrando P-day na segunda: lá
  a irmã não agenda segunda de qualquer jeito.
- **Nome**: quebra até palavra sem espaço (`overflowWrap: anywhere`), fonte
  menor se tiver mais de 16 caracteres (15 em vez de 18) e **no máximo 3 linhas**
  (2 nos meses de 6 semanas, em que o dia é mais baixo; o nome completo fica no
  painel). Telefone também quebra.
- Rodapé: só o lema **"A caridade nunca falha"** entre duas florzinhas, em
  serifa, 22px, negrito médio, azul-marinho (o dono trocou o "Obrigada por
  servir os missionários" pelo lema). Também está embaixo do calendário
  público (ver [routes_slug.md](routes_slug.md)).

## Pontos de atenção

- O painel exige login: o Playwright usado nos testes não entra. Teste à mão:
  trocar de ala, criar ala, editar/remover almoço, aprovar/remover usuário,
  histórico e imagem do mês.
