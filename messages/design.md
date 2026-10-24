# Plano de design e acessibilidade — Almoço dos Missionários

Plano para deixar o site mais fácil, mais acessível e mais bonito para quem
realmente o usa: **irmãs da Sociedade de Socorro, de 45 a 85 anos, membros da
Igreja, com pouca familiaridade com tecnologia, quase sempre no celular.**

Cada item diz **o que mudar, por quê e em quais arquivos**. Os caminhos seguem a
estrutura atual (`src/app/(member)/…`, `src/app/(leader)/…`).

> **Revisão final — 24/10/2026.** O plano foi conferido contra o código atual e
> contra uma **auditoria automática no site rodando** (axe-core 4.14 com as regras
> WCAG 2.2 A/AA + boas práticas, mais medições próprias com Playwright). Os
> resultados medidos estão na seção 7.4; os itens já resolvidos estão marcados
> com ✅; os achados novos da auditoria são A27–A33.

---

## 0. Resumo das decisões

1. **Sai o verde-água (teal `#1fb9a0`).** Além de não agradar, ele reprova no
   contraste: o texto branco dos botões tem **2,46:1** (mínimo 4,5:1; a
   auditoria apontou isso em **todas as páginas**), e o contorno de foco fica
   abaixo de 3:1.
2. **Entra o azul da Igreja (`#006184`)** como cor de ação: botões, dia
   escolhido, links e foco. O texto branco sobre ele tem **6,90:1**.
3. **Elemento feminino = rosa-framboesa (`#bd0057`) + florzinha + dourado**, todos
   da paleta oficial da Igreja. O framboesa tem **6,36:1**; o rosa atual
   (`#e0588f`) tem **3,52:1**.
4. **✅ APROVADO: fundo claro**, como no site da Igreja. O fundo das páginas fica
   creme e os cartões brancos. O "céu" azul vira uma **faixa de cabeçalho**
   (seção 5).
5. **No calendário, o destaque passa para os dias LIVRES** (é o que a irmã
   procura), mais uma **lista de próximos dias livres** em botões grandes.
6. **Letra que cresce com a tela:** 18px no celular → 22px no computador, sem
   quebrar o zoom (seção 8.1). Mínimo de 16px em tudo que precisa ser lido, nada
   fixo em px, nada em MAIÚSCULAS. O **painel no computador**, hoje pequeno, tem
   plano próprio (seção 8.2).
7. **Toda resposta aparece onde a pessoa está olhando** e é anunciada para o
   leitor de tela.
8. **Telefone só no painel do líder.** Quem agenda nunca vê o telefone de
   ninguém (seção 1).
9. **Tela de confirmação** depois de agendar: dia por extenso + "Adicionar à
   agenda do celular".

---

## 1. Público e princípios

| Quem | Como usa | O que dificulta |
|---|---|---|
| **Irmã que agenda** (45–85 anos), sem conta | Recebe o link no grupo do WhatsApp, abre no celular, marca um dia | Letra pequena, pouco contraste, botões sem texto, palavras em inglês, mensagens que aparecem fora da tela |
| **Líder** (painel, com login), geralmente da mesma faixa | Confere, edita, liga para as irmãs, manda a imagem do mês no grupo | Muitos textos pequenos e cinza-claro, telefone que não dá para tocar, termos técnicos ("owner"), avisos em `alert()` |

**O que a idade traz** (e o design precisa compensar):

- **Visão.** Vista cansada (quase todas acima de 45), catarata (mais
  ofuscamento e menos contraste percebido), degeneração macular, glaucoma.
  → Letra grande, texto escuro sobre claro, contraste alto, nada só por cor.
- **Mãos.** Tremor e artrite deixam o toque impreciso, geram toque duplo e
  dificultam gestos.
  → Alvos grandes e espaçados, nada de arrastar, deslizar ou segurar, e o
  segundo toque não faz nada.
- **Memória e confiança.** Pouca familiaridade e medo de "estragar algo".
  → Poucos passos, um caminho só, confirmação clara, linguagem simples.
- **Aparelho.** Android simples, tela pequena, letra do sistema aumentada,
  internet fraca, navegador Samsung Internet com modo escuro.
  → Leve, sem efeitos pesados, testado com letra no máximo.

**Princípios (valem para toda decisão):**

1. **Uma coisa por tela.** Uma pergunta, uma ação principal.
2. **Texto sempre junto do ícone.** Nunca só um ícone ou só uma cor para dizer algo.
3. **Cor nunca sozinha.** Todo estado tem um segundo sinal (texto, ícone ou padrão).
4. **Letra grande e escura.** Corpo de 18–20px, nada que precise ser lido abaixo de 16px, contraste ≥ 4,5:1 (meta: 7:1 no texto principal).
5. **Alvos de toque ≥ 48px**, com espaço entre eles (ver nota de WCAG na seção 9).
6. **A resposta aparece onde a pessoa está olhando** e fica até a próxima ação (nada some sozinho em poucos segundos).
7. **Linguagem da Igreja, em português.** "Ala", "P-day", "líder" sim; "owner", "dashboard", "login" não.
8. **Elegância madura, não infantil.** Feminino com sobriedade: rosa profundo, dourado, flor delicada, serifa.
9. **Privacidade: o telefone só aparece no painel do líder logado.** A página
   pública e tudo que a irmã vê mostram, no máximo, o nome de quem agendou. Isso
   já é regra do banco (`anon`/`authenticated` não leem `telefone`); o design
   não pode criar exceções.

---

## 2. O que o site da Igreja usa (análise)

Analisei `churchofjesuschrist.org/my-home?lang=por` (versão pública, sem login)
e a página inicial. O site usa um design system próprio (variáveis CSS
`--unity-*`, componentes `eden-*`). Não consegui abrir uma página específica da
Sociedade de Socorro (o endereço em português dá "página não existe"), então a
análise é da paleta geral da Igreja, que é a mesma em todas as seções.

**Paleta oficial (valores extraídos do CSS do site):**

| Família | Tokens | Uso no site da Igreja |
|---|---|---|
| Azul | `blue40 #003057` · `blue35 #005175` · **`blue30 #006184`** · `blue25 #007da5` · `blue20 #01b6d1` · link `#157493` | `#006184` é a cor de destaque principal (`--unity-accent-color-primary`): botões e informação. `#003057` é o marinho dos fundos escuros |
| Rosa/framboesa | `red30 #8f124a` · `red25 #a6004e` · **`red20 #bd0057`** · `red12 #ed3a65` · `red7 #ff7591` · `red5 #fda1b2` | Destaques e ícones |
| Dourado | `yellow15 #faa61a` · **`yellow10 #ffb81c`** · `yellow5 #ffd61a` | Ícones e detalhes |
| Texto e cinzas | texto `#212225` · `gray40 #53575b` · `gray30 #878a8c` · `gray5 #e0e2e2` · `gray3 #eff0f0` | Texto principal e secundário, bordas, fundos alternativos |

**Outras observações:**

- **Fundo branco**, texto quase preto, cabeçalho com toque de azul. Leitura em
  "texto escuro sobre claro", o que confirma a escolha do fundo claro.
- **Texto do corpo em 18px** com entrelinha 1,6, como a nossa base.
- **O peso do corpo é 300 (fino).** Não copiar: letra fina some para olhos mais
  velhos. Aqui o mínimo é **400**, e 600 nos botões.
- **Cantos quase retos** (raio de 2px). O nosso site é bem arredondado; manter
  o arredondado é uma das formas de dar o toque feminino e acolhedor.
- **Não existe verde-água na paleta.**

---

## 3. Nova paleta

Todos os valores vêm da paleta da Igreja, exceto dois tons de apoio (rosa-claro
e creme), que são clareamentos para fundos.

| Papel | Cor | Hex | Contraste | Onde usar |
|---|---|---|---|---|
| **Fundo da página** | Creme | `#faf7f5` | texto principal sobre ele: 14,91:1 | Fundo de todas as páginas (abaixo da faixa) |
| Cartões | Branco | `#ffffff` | — | Calendário, formulários, painel |
| Marinho | Azul Igreja escuro | `#003057` (hoje `#143157`, quase igual) | branco sobre ele: 13,46:1 | Faixa de cabeçalho, rodapé, número dos dias, títulos |
| **Ação** | **Azul Igreja** | **`#006184`** (hover `#005175`) | branco sobre ele: **6,90:1** | Botões principais, dia escolhido, links, contorno de foco, interruptor ligado |
| **Identidade feminina** | **Rosa-framboesa** | **`#bd0057`** | sobre branco: **6,36:1** | Flor, fitinha, barrinhas dos títulos, dia ocupado (texto), erros, remover |
| Rosa-claro (apoio) | — | `#fdecf1` | framboesa sobre ele: 5,59:1 | Fundo do dia ocupado, caixa de erro, destaques suaves |
| Dourado | Dourado Igreja | `#ffb81c` | sobre marinho: 7,77:1 | **Só decoração**: miolo da flor, luz da faixa, fitinha. Nunca texto sobre claro |
| Texto | Quase preto | `#212225` (hoje `#0f172a`) | sobre branco: 15,91:1 | Texto principal |
| Texto secundário | Cinza Igreja | `#53575b` (hoje `#64748b`) | sobre branco: **7,29:1** / creme 6,83:1 | Descrições, legendas, rótulos, placeholders |
| Dia que já passou | Cinza médio | `#676b6e` | sobre branco: **5,38:1** (hoje 1,81:1) | Número dos dias passados (A30) |
| Rosa sobre marinho | — | `#fda1b2` | sobre marinho: 6,79:1 | Só se houver aviso dentro da faixa azul |

**Sem verde no site.** Sucesso = azul + ícone ✓ + texto ("Almoço agendado").

**Por que o rosa não virou a cor dos botões:** ele já significa "ocupado",
"erro" e "remover". Se também fosse "confirmar", a mesma cor diria "pare" e
"siga". O azul fica com a ação; o rosa fica com a identidade.

**Daltonismo:** é raro em mulheres (cerca de 0,5%), mas o azul e o framboesa
podem ficar parecidos para quem não distingue o vermelho. Por isso os estados
nunca dependem só da tonalidade. Por exemplo: o dia escolhido é um **fundo azul
cheio + ✓**, e o dia ocupado é um **fundo rosa-claro + flor**.

### Como trocar (tokens em `src/app/globals.css`, linhas 9–14)

| Token atual | Valor atual | Novo valor |
|---|---|---|
| `--color-primary` | `#143157` | `#003057` |
| `--color-secondary` | `#1fb9a0` | `#006184` → troca o teal no site inteiro de uma vez (usado em 21 arquivos) |
| `--color-accent` | `#e0588f` | `#bd0057` |
| `--color-background` | `#ffffff` | `#ffffff` (cartões) |
| `--color-text` | `#0f172a` | `#212225` |
| `--color-muted` | `#64748b` | `#53575b` |
| (novo) `--color-creme` | — | `#faf7f5` (fundo da página) |
| (novo) `--color-rosa-claro` | — | `#fdecf1` |
| (novo) `--color-dourado` | — | `#ffb81c` |

Pode manter os nomes `secondary`/`accent` para não mexer nos 21 arquivos.

**Cores escritas direto no código (não usam o token), trocar à mão:**

- [ ] `src/app/(leader)/dashboard/_components/month-image/MonthImage.tsx` — o verde `#1fb9a0` da imagem exportada (divisória e Dom/Sáb).
- [ ] `src/components/Flower.tsx` — pétalas `#e0588f` → `#ed3a65` (`red12`) e miolo → `#ffb81c`.
- [ ] `src/app/globals.css` — o céu (`body::before`/`::after`) sai do fundo da página (seção 5).
- [ ] `src/app/layout.tsx` — `themeColor` (cor da barra do navegador) = marinho da faixa.
- [ ] `supabase/email/*.html` — botão `#1fb9a0` → `#006184`; fitinha; divisória `#79d5c6`; caixa do código `#e9f8f5`; flor `#e0588f`.
- [ ] E-mails de aviso (`src/lib/server/email-templates.ts` + o modelo HTML que ele lê) — texto `#0f172a` → `#212225`, secundário `#64748b` → `#53575b`; tons rosados `#fdf2f8`/`#f6d6e6` podem virar `#fdecf1`.
- [ ] `CLAUDE.md` — seção "Cores" (cita o verde) e armadilha "Fundo celestial" (regra antiga do fundo transparente).

---

## 4. Elemento feminino (Sociedade de Socorro)

| Elemento | Como | Onde |
|---|---|---|
| Florzinha | Já existe (`Flower.tsx`). Pétalas framboesa + miolo dourado. Uma por bloco, nunca como fundo repetido. Sempre `aria-hidden` | Faixa de cabeçalho, divisórias, imagem exportada, e-mails |
| Fitinha | Faixa no topo dos cartões: **framboesa → dourado → framboesa** | Cartões, modal, e-mails |
| Lema | **"A caridade nunca falha"**, discreto, em serifa (sem itálico longo) | Faixa da home ou rodapé |
| Formas | Cantos arredondados e sombras suaves (já temos) | Todo o site |
| Tipografia | Serifa nos títulos (Source Serif): tom sereno e elegante | Mantém |
| Tons suaves | Creme no fundo, rosa-claro nos destaques | Página toda |

**Evitar:** rosa-chiclete, purpurina, corações, muitos enfeites, emojis.

---

## 5. ✅ Fundo claro (aprovado)

**Estrutura de toda página:**

```
┌─────────────────────────────────┐
│  FAIXA AZUL (céu marinho)       │  ← gradiente marinho + luz dourada/rosa
│   ✿  Ala Ecoville               │     título branco em serifa + flor
│   (lema ou instrução curta)     │
└─────────────────────────────────┘
  fundo creme #faf7f5
  ┌─────────────────────────────┐
  │ cartão branco + fitinha     │  ← calendário / formulário / painel
  │ texto escuro #212225        │
  └─────────────────────────────┘
  rodapé: texto cinza #53575b sobre creme, com linha fina acima
```

- **Faixa de cabeçalho:** guarda a identidade do "céu" (gradiente marinho +
  auroras dourada/rosa, **sem o verde**). Altura contida: no celular, o
  calendário precisa começar na primeira tela, sem rolar.
- **Instrução principal** ("Toque em um dia livre…"): fica **abaixo** da faixa,
  em texto escuro de 20px sobre o creme. Lê melhor do que branco sobre azul.
- **Mensagens, avisos e confirmações:** todos sobre fundo claro, em texto escuro.
- **Imagem da home** (Cristo + nome da Igreja, hoje branca): fica dentro da
  faixa azul, ou ganha uma versão escura para o fundo claro.
- **Toda página com `<main>`** (a home hoje usa `<section>`, A29).
- **O que muda no código:**
  - o céu sai do `body::before/::after` e vira um componente de cabeçalho;
  - o `body` passa a ter fundo creme;
  - textos `text-white` das páginas viram texto escuro.
- **`CLAUDE.md`:** reescrever a armadilha "Fundo celestial". A regra antiga
  ("páginas com fundo transparente para o céu aparecer") deixa de valer.
- **Modo escuro forçado:** declarar `color-scheme: only light` (ver A19).

---

## 6. Revisão ponta a ponta (tela por tela)

### 6.1 Link no WhatsApp

- ✅ Título "Calendário de almoços da \<ala\>" + convite.
- Sugestão: imagem de prévia com o nome da ala e a flor (chama mais atenção no grupo).

### 6.2 Home (lista de alas) — `src/app/(member)/page.tsx`

- ✅ Botões grandes, texto 20px, escritura.
- **Sem `<main>`** (linha 47 usa `<section>`): o axe acusa `landmark-one-main` e
  `region`. Quem navega por regiões no leitor de tela não acha o conteúdo (A29).
- **Com letra a 200% num celular de 320px, a página estoura para 401px**: o
  título "Almoço dos Missionários" e os botões das alas não quebram a linha
  (A28).
- **Lembrar a última ala** (no aparelho): "Continuar na Ala Ecoville" no topo.
- Escritura (linha 76): sem itálico (ou só uma linha curta), 18px, texto escuro.
  A referência ("Helamã 5:12") está em 15,8px.
- Lema "A caridade nunca falha" na faixa.

### 6.3 Página da ala (calendário) — `MonthCalendar.tsx` + `WardBooking.tsx`

Arquivos em `src/app/(member)/[slug]/_components/`.

- ✅ **Já feito:** modo compacto por container query (`@max-[15rem]`): em tela
  estreita ou letra grande, o mês sobe e os dias da semana viram iniciais
  (D S T Q Q S S). A auditoria confirmou: **sem rolagem horizontal em 320px**,
  nem com letra a 200%.
- ✅ **Já feito:** margens enxutas no celular. Em 360px os dias chegam a 44px; em
  320px ficam com **37×37px** (passa o mínimo WCAG de 24px, abaixo do ideal).

**Troca de mês.** Hoje são dois botões "VOLTAR" / "AVANÇAR" (13,5px, em
maiúsculas, linhas 74–105). "Voltar" pode ser confundido com "voltar à página
anterior", e o botão desabilitado fica quase invisível (`opacity-30`). Além
disso, o nome que o leitor de tela anuncia ("Mês anterior") **não contém o
texto visível** ("Voltar"): quem usa comando de voz diz "Voltar" e nada
acontece (axe: `label-content-name-mismatch`, WCAG 2.5.3, A31). Como **só
existem dois meses**, trocar por **dois botões grandes com o nome do mês**:

```
┌──────────────┬──────────────┐
│ ✓ Outubro    │   Novembro   │   ← ativo: azul cheio, texto branco, ✓
└──────────────┴──────────────┘
```

Semântica: dois `<button>` com `aria-pressed` (um botão de alternância para
cada mês), não o padrão "abas" do ARIA. O padrão abas exige navegação por setas
e foco móvel; para duas opções isso é complexidade sem ganho (ver A13).

**Estados do dia** (hoje o ocupado é o mais chamativo, mas a irmã procura o livre):

| Estado | Fundo | Número | Segundo sinal | Ao tocar |
|---|---|---|---|---|
| **Livre** | branco | marinho, **negrito** | borda azul de 2px | abre o agendamento |
| **Escolhido** | azul `#006184` | branco | ✓ pequeno | — |
| **Ocupado** | rosa-claro `#fdecf1` | framboesa | florzinha no canto (`aria-hidden`) | mostra quem agendou (só o nome) |
| **P-day** | cinza `#eff0f0` | cinza `#676b6e` | listrinhas diagonais | explica o P-day |
| **Já passou** | sem fundo | **cinza `#676b6e` (≥ 4,5:1)** | sem borda | explica que passou |

- **Dia que já passou com contraste de 1,81:1** (linha 172, `text-primary/30`).
  A exceção de contraste do WCAG vale só para componente **inativo**, e esse dia
  é clicável (mostra "Esse dia já passou"). Então precisa de ≥ 4,5:1 (A30).
- O rótulo "P-DAY" dentro do dia tem **9px fixos** (linha 185; 10px no
  computador): tirar e usar listrinhas, legenda e mensagem ao tocar. A
  mensagem explica uma vez: "Segunda-feira é **P-day** (dia de descanso dos
  missionários). Escolha outro dia." O rótulo do leitor ("Dia 26, P-day…")
  também não contém o texto visível "26 P-DAY" (A31).
- **Cada dia anuncia "botão de alternância, não pressionado"** (`aria-pressed`
  nos 31 dias, linha 159). Escolher um dia não é ligar/desligar algo. Usar
  `<button>` simples; o estado vai no nome ("…, escolhido") (A27).
- **Antes do primeiro dia livre, o leitor de tela passa por todos os dias que
  já passaram** (no dia 24, foram 23 botões "já passou, indisponível"). A lista
  de dias livres (abaixo) resolve: ela vem primeiro na ordem de leitura.
- Dias da semana: de "DOM SEG…" (maiúsculo, 15,8px) para "Dom Seg…" em 16px.
- Legenda: quadradinhos de 20px, texto de 16px, com os mesmos sinais da grade.

**Lista de próximos dias livres (nova).** Logo abaixo do calendário (e antes
dele na ordem do leitor de tela), os próximos 5–7 dias livres como **botões
grandes de largura total**:

```
Próximos dias livres
┌─────────────────────────────────┐
│ Quinta-feira, 12 de novembro  › │
├─────────────────────────────────┤
│ Sábado, 14 de novembro        › │
└─────────────────────────────────┘
```

Quem tem tremor, enxerga pouco ou usa letra grande toca num botão enorme em vez
de mirar num quadradinho de 37px.

**Mensagens.** Ao tocar num dia ocupado, P-day ou passado, a mensagem aparece
embaixo do calendário (`WardBooking.tsx`, linhas 181–197).

- Na medição atual, **ela ficou dentro da tela** no iPhone SE (375×667) e no
  iPhone 14 (390×844), porque o layout mais enxuto subiu a mensagem. Com letra
  grande ela volta a descer, então a faixa fixa ainda é recomendada.
- **Ela não é anunciada:** nenhuma das três mensagens está numa região "ao
  vivo" (medido). A irmã que usa leitor de tela toca e não ouve nada (A8).
- **Correção:** uma **faixa fixa no rodapé da tela**, com `role="status"`
  **sempre montada** (o texto muda dentro dela), ícone + texto, que fica até a
  próxima ação. Reservar espaço embaixo da página do tamanho da faixa, para ela
  nunca cobrir o elemento com foco (WCAG 2.4.11).

### 6.4 Janela de agendar — `BookingModal.tsx`

- ✅ **Já feito:** campos dentro de `<form>`, então o Enter do teclado confirma.
- ✅ **Já feito:** Cancelar/Confirmar quebram a linha com letra grande
  (`flex-wrap` + `basis` em `rem`). Antes, com letra 130%, o Confirmar saía da tela.
- Título com **dia da semana por extenso**: "Quinta-feira, 12 de novembro" (hoje
  "Agendar dia 12 de outubro").
- **Dica visível do telefone** abaixo do rótulo: "Exemplo: (41) 99999-9999".
  Hoje o formato só aparece no erro.
- **Lembrar nome e telefone** da própria irmã (no aparelho dela), com "Não é a
  senhora? Limpar". É o telefone **dela mesma**, digitado por ela; não expõe o
  de ninguém. Atende o WCAG 3.3.7 (não pedir de novo o que já foi informado).
- **Teclado do celular:** `enterKeyHint="next"` no nome e `"done"` no telefone
  (hoje nenhum dos dois tem).
- **Erros (medido):** ao confirmar vazio, aparecem **3 alertas ao mesmo tempo**
  ("Informe seu nome.", "Confira o telefone…", "Preencha corretamente…"), e o
  leitor lê tudo junto, embaralhado. Os campos têm `aria-invalid`, mas **sem
  `aria-describedby`**. Correção: o erro de cada campo ligado por
  `aria-describedby` (sem `role="alert"`), um único resumo anunciado e o foco
  indo para o primeiro campo com erro (A11, A33).
- Erros em 16px (hoje `text-sm` = 15,8px), com ícone, em caixa rosa-claro.
- Botão principal "Confirmar almoço".
- **Foco (medido):** ver A10. O modal abre pelo teclado e fecha com Esc, mas o
  foco não entra nele, o Tab sai para os dias do fundo e, ao fechar, o foco se
  perde.

### 6.5 Depois de agendar (confirmação) — maior ganho

Hoje o modal fecha e aparece uma frase embaixo do calendário. Proposta:
**cartão de confirmação**, com o foco indo para o título dele:

```
        ✓  (círculo azul)
   Almoço agendado!
   Quinta-feira, 12 de novembro
   Ala Ecoville

 [ (ícone) Adicionar à agenda do celular ]
 [        Voltar ao calendário         ]

  Precisa desmarcar? Fale com a líder da ala.
```

- **Adicionar à agenda — como fazer funcionar de verdade:**
  - **iPhone:** arquivo `.ics` gerado só no navegador (blob/data URL) costuma
    não abrir a Agenda no Safari. Servir o `.ics` por uma rota do site
    (ex.: `/api/agenda?…`) com `Content-Type: text/calendar` é o caminho
    confiável.
  - **Android:** o Chrome só baixa o `.ics`, e a irmã precisaria abrir o
    arquivo (difícil para esse público). Oferecer um link "Google Agenda"
    (`calendar.google.com/calendar/render?action=TEMPLATE&…`), que abre o app
    direto.
  - Mostrar o botão certo para cada aparelho e testar nos dois.
- "Precisa desmarcar?" explica o caminho, já que a irmã não desmarca sozinha.
  Manter essa ajuda **sempre no mesmo lugar** das telas (WCAG 3.2.6).

### 6.6 Erros e falta de internet

- ✅ Mensagens em português, escritas para a irmã.
- Erro sempre em caixa com ícone (não só texto colorido) e com o que fazer:
  "Verifique a internet e toque em Confirmar de novo".

### 6.7 Login, cadastro e "esqueci a senha" (líder) — `src/app/(leader)/admin/_components/LoginForm.tsx`

- ✅ **Já feito:** o aviso de "esqueci a senha" agora manda procurar o e-mail
  "Redefina sua senha do Almoço dos Missionários" (não cita mais o remetente
  antigo do Supabase).
- ✅ **Já feito:** login aceita gerenciador de senhas e colar (`autoComplete`
  correto) e tem "mostrar senha" (WCAG 3.3.8).
- **"Esqueci minha senha" e "Não tem conta? Criar conta" têm 23px de altura
  (medido), abaixo do mínimo WCAG de 24px (2.5.8).** Como não estão dentro de
  uma frase, não se encaixam na exceção de link em texto (A32). Viram **botões
  secundários** de 48px, texto 16–18px.
- **Regra da senha visível antes do erro:** "Mínimo de 6 caracteres" embaixo do
  campo. Hoje só aparece depois do erro (A15; também em `ResetPasswordForm.tsx`).

### 6.8 Pedido de acesso — `src/app/(leader)/acesso/_components/RequestAccess.tsx`

- Dizer o que acontece depois: "Uma líder da ala vai aprovar. A senhora recebe
  um e-mail quando for aprovada." (e-mail K de `messages/emails-do-lider.txt`).

### 6.9 Painel do líder (só com login) — `src/app/(leader)/dashboard/`

| Hoje | Proposta |
|---|---|
| "· owner" (`page.tsx:121`) e "Acesso owner" (`WardSwitcher.tsx:64`) | "Administração geral" / "Acesso a todas as alas" |
| Telefone em cinza `text-sm`, sem ação (`BookingsCard.tsx`) | **Botões "Ligar" (`tel:`) e "WhatsApp" (`wa.me`)**, 48px, com texto. **Só aqui, no painel**; nunca na página pública |
| Quadradinho da data com mês em 10px fixo e maiúsculo (`BookingsCard.tsx:62`) | "12 · qui" em ≥ 14px |
| Mês recolhível: seta pequena (`CollapsibleMonth.tsx`) | Seta maior + texto "Abrir"/"Fechar" |
| Erros em `alert()` (`EditBookingModal.tsx:69,72`, `UsersCard.tsx:37,46`) | Mensagem dentro do modal/cartão (A14) |
| Botão de exportar a imagem (`month-image/MonthImageExport.tsx`) | "Baixar imagem do calendário" (computador) / "Enviar no WhatsApp" (celular) |
| Rótulos do modal de edição em `text-sm` cinza | 16px, cor de texto |
| Nomes e e-mails cortados com "…" (`page.tsx:119`, `BookingsCard.tsx:65`, `UsersCard.tsx:76,77`) | Quebrar a linha; nunca esconder o nome (A26) |
| `CreateWardForm.tsx` com 11 textos pequenos; `WardSwitcher.tsx` com 3 | ≥ 16px |
| No computador, tudo fica pequeno | Letra que cresce com a tela + seção 8.2 |
| ✅ Usuários: a linha quebra em tela estreita (`UsersCard.tsx`) | — |

### 6.10 Tela de notificações (nova) — `NotificationsCard.tsx`

Revisão de código (o painel exige login e não entrou na auditoria automática).

- ✅ **Padrão certo:** cada aviso é um `<button role="switch" aria-checked>` de
  largura total com 56px de altura; o desenho do interruptor é `aria-hidden`; o
  "Salvo." fica numa região `role="status"` **sempre montada**, e o erro em
  `role="alert"`. É o componente mais acessível do site hoje.
- **Contraste do interruptor:** ligado em teal (2,46:1) e desligado em
  `slate-300` (~1,5:1), ambos abaixo de 3:1 para componente de interface
  (WCAG 1.4.11). Com o azul `#006184`, o ligado passa; o desligado precisa de
  borda/trilho ≥ 3:1 (ex.: cinza `#878a8c`).
- **Escrever o estado:** "Ligado"/"Desligado" ao lado do interruptor. A posição
  da bolinha é um sinal sutil para quem enxerga pouco; texto não deixa dúvida.
- "Salvo." em teal sobre branco (2,46:1) → azul.
- Descrições em `text-sm` cinza (4 ocorrências) → 16px, `#53575b`.
- O nome anunciado de cada interruptor junta título + descrição. Pode ficar
  mais curto com `aria-describedby` na descrição.

### 6.11 Imagem exportada (WhatsApp) — `month-image/MonthImage.tsx`

- Cores novas (divisória e Dom/Sáb em framboesa ou azul).
- Tirar as maiúsculas dos rótulos (`textTransform: 'uppercase'`, linhas 103 e 177).
- Conferir se os nomes continuam legíveis depois que o WhatsApp comprime.

### 6.12 E-mails

- **Supabase (`supabase/email/`):** cores novas (seção 3); alinhar ao fundo
  claro: corpo creme, faixa azul só no cabeçalho, como no site.
- **Avisos ao líder (`src/lib/server/email-templates.ts`):** ✅ letra de
  18–20px, dentro da regra. Trocar as cores (seção 3).
- ⚠️ **Em andamento:** o `email-templates.ts` lê o modelo
  `messages/email/aviso.html`, que **não estava no disco** durante esta
  revisão. Se continuar assim, todo envio de aviso falha (`readFileSync`).
  Conferir ao terminar os ajustes.

### 6.13 Rodapé — `src/components/Footer.tsx`

- Texto `#53575b` sobre creme, mínimo 16px (hoje 15,8px).
- Link externo (linha 19) avisa "(abre em outra aba)".
- O link "Luis Henrique Engel Saul" tem 23px de altura, mas está dentro de uma
  frase ("Desenvolvido por …"), então entra na exceção de link em texto do
  WCAG 2.5.8. Aumentar a entrelinha é bom, mas não é falha.

---

## 7. Acessibilidade — análise e melhorias

### 7.1 O que já está bom (manter)

- Base de 18px em `%` (acompanha a letra do navegador); `lang="pt-BR"` em todas
  as páginas; título da aba descritivo em todas as páginas testadas.
- Zoom liberado (o `viewport` não trava `maximumScale`).
- **Sem rolagem horizontal em 320px** na home, na ala e no login (medido);
  calendário em modo compacto com letra grande (container query).
- Campos com ≥ 16px (o iPhone não dá zoom sozinho ao tocar), `autoComplete`,
  `inputMode="tel"`; modal de agendar com `<form>`.
- `aria-label` nos botões só de ícone; spinner com `aria-hidden` ao lado de um verbo.
- Foco visível (contorno de 3px); `prefers-reduced-motion` respeitado, com
  exceção correta do spinner.
- Alvos de toque ≥ 44px na maior parte do site; segundo toque bloqueado
  enquanto envia.
- Remoção com confirmação inline (sem `window.confirm`); modais fecham por
  X/Esc/toque fora (Esc medido ✅).
- Interruptores de notificação com `role="switch"` e status sempre montado.
- Um `h1` por página, com texto certo em todas as páginas testadas.

### 7.2 Problemas encontrados

Legenda de quem é afetado: **V** visão · **M** mãos/toque · **C** compreensão/memória · **L** leitor de tela (TalkBack/VoiceOver) · **A** aparelho simples.
**Medido** = confirmado na auditoria automática (seção 7.4).
Pastas: `(m)` = `src/app/(member)/[slug]/_components/`, `(d)` = `src/app/(leader)/dashboard/_components/`.

| # | Problema | Onde | Quem | Melhoria | WCAG |
|---|---|---|---|---|---|
| A1 | Teal nos botões (2,46:1) e no contorno de foco (< 3:1). **Medido em todas as páginas** | `globals.css:10,67` | V | Azul `#006184` | 1.4.3, 1.4.11 |
| A2 | Rosa dos erros em texto (3,52:1) | vários | V | Framboesa `#bd0057` | 1.4.3 |
| A3 | Texto secundário `#64748b` (4,76:1, no limite); placeholders `muted/60` bem abaixo | vários | V | `#53575b`; placeholder ≥ 4,5:1 | 1.4.3 |
| A4 | Texto de 9–10px **fixo em px** (não cresce com a letra do celular). **Medido: 9px no celular, 10px no computador** | `(m)MonthCalendar.tsx:185`, `(d)BookingsCard.tsx:62` | V | Remover; tudo em `rem` | 1.4.4 |
| A5 | MAIÚSCULAS em rótulos (mais difíceis de ler). **Medido** | `(m)MonthCalendar.tsx:86,105,109,185`, `(d)BookingsCard.tsx:62`, `(d)month-image/MonthImage.tsx:103,177` | V C | Caixa normal | boa prática |
| A6 | Escritura inteira em itálico. **Medido** | `(member)/page.tsx:76` | V | Sem itálico | boa prática |
| A7 | Estados do dia só por cor | `(m)MonthCalendar.tsx` | V L | Segundo sinal (seção 6.3) | 1.4.1 |
| A8 | Mensagem ao tocar no dia **não é anunciada** (fora de região "ao vivo"). **Medido** | `(m)WardBooking.tsx:181–197` | L, todos | Faixa fixa com `role="status"` **sempre montada** | 4.1.3 |
| A9 | Região "ao vivo" do sucesso é criada junto com o texto; leitores costumam não anunciar | `(m)WardBooking.tsx:216–220` | L | Região sempre montada + cartão de confirmação recebe foco | 4.1.3 |
| A10 | Modais sem gestão de foco. **Medido:** o foco fica no dia tocado (fora do modal); o Tab sai para os dias do fundo; o fundo não é inerte; ao fechar, o foco vai para o `body` | `(m)BookingModal.tsx:127`, `(d)EditBookingModal.tsx:126`, `(d)UsersCard.tsx:143` | L M | `<dialog>` com `showModal()`: foco, fundo inerte e Esc vêm do navegador. **Continua precisando** da trava de rolagem do `body` (o `<dialog>` não trava) e de devolver o foco ao dia ao fechar. iOS ≥ 15.4 | 2.4.3, 2.1.2 |
| A11 | Erro não ligado ao campo. **Medido:** `aria-invalid="true"` com `aria-describedby` vazio nos dois campos | `(m)BookingModal.tsx:167,194`, `(d)EditBookingModal.tsx:170,195` | L | `aria-describedby` → id do erro | 1.3.1, 3.3.1 |
| A12 | Dia é `<div role="button">` e o leitor diz só "Dia 24, disponível" (sem mês nem dia da semana). **Medido** na árvore de acessibilidade | `(m)MonthCalendar.tsx:156–158` | L | `<button>` nativo + "Quinta-feira, 12 de novembro, livre" | 2.4.6 |
| A13 | Troca de mês não é anunciada | `(m)MonthCalendar.tsx` | L | Dois `<button aria-pressed>` com o nome do mês (seção 6.3); **não** o padrão "abas" do ARIA | 4.1.2 |
| A14 | Erros do painel em `alert()` (texto do sistema, some com um toque, confunde) | `(d)EditBookingModal.tsx:69,72`, `(d)UsersCard.tsx:37,46` | C V | Mensagem dentro do modal/cartão, com o que fazer | 3.3.1 |
| A15 | Regra da senha só aparece depois do erro | `LoginForm.tsx:74`, `ResetPasswordForm.tsx:36` | C | Dica visível antes | 3.3.2 |
| A16 | Formato do telefone não é mostrado antes | `(m)BookingModal.tsx`, `(d)EditBookingModal.tsx` | C | "Exemplo: (41) 99999-9999" | 3.3.2 |
| A17 | ✅ Enter confirma no agendar (`<form>`). Falta `enterKeyHint` (medido: ausente) e `<form>` no modal de edição | `(m)BookingModal.tsx:147`, `(d)EditBookingModal.tsx` | M C | `enterKeyHint` + `<form>` no painel | boa prática |
| A18 | Link externo abre outra aba sem avisar | `Footer.tsx:19` | C L | "(abre em outra aba)" | 3.2.5 |
| A19 | Sem `color-scheme` (**medido: ausente em todas as páginas**): o modo escuro forçado do Chrome/Samsung Internet pode inverter as cores | `layout.tsx` (`viewport`) | V A | `colorScheme` no `viewport` = `only light`; testar no Samsung Internet | — |
| A20 | No iPhone, o Safari não segue o tamanho de letra do sistema | `globals.css:35` | V | Ver nota técnica na seção 8.1 | 1.4.4 |
| A21 | `backdrop-blur` em 5 telas: pesado em Android simples (tela trava, toque "não responde") | `(m)BookingModal.tsx:120`, `(d)EditBookingModal.tsx:119`, `(d)UsersCard.tsx:143`, `(d)WardSwitcher.tsx:55`, `LoadingOverlay.tsx:13` | A M | Fundo sólido semitransparente, sem desfoque | — |
| A22 | Dias de 37×37px em 320px (medido): passa o mínimo WCAG (24px), abaixo do ideal para tremor | `(m)MonthCalendar.tsx` | V M | Lista de dias livres (seção 6.3) | 2.5.8 ✅ / 2.5.5 |
| A23 | Botões desabilitados com `opacity-30`: a pessoa não entende se é botão | `(m)MonthCalendar.tsx:81,100` | V C | Some com os botões de mês; regra geral: desabilitado em cinza legível | — |
| A24 | Botão fechar do modal só com "X" | modais | C | Manter "Cancelar" sempre visível ao lado da ação (já é assim no agendar) | — |
| A25 | Base fixa em 18px em qualquer tela (**medido: 18px a 1366px**): no computador o painel fica pequeno, e o `text-sm` vira 15,8px | `globals.css:35`, `(leader)/dashboard/*` | V | Letra que cresce com a tela (8.1) + painel (8.2) | boa prática |
| A26 | Nomes e e-mails cortados com "…" (`truncate`): a informação some | `(leader)/dashboard/page.tsx:119`, `(d)BookingsCard.tsx:65`, `(d)UsersCard.tsx:76,77` | V C | Quebrar a linha | 1.4.4, 1.4.10 (sem perda de conteúdo) |
| **A27** | **Novo.** `aria-pressed` nos 31 dias: o leitor anuncia "botão de alternância, não pressionado" em cada um, e escolher dia não é alternar | `(m)MonthCalendar.tsx:159` | L | Tirar `aria-pressed`; estado no nome ("…, escolhido") | 4.1.2 |
| **A28** | **Novo.** Home com letra a 200% num celular de 320px: título e botões das alas não quebram e a página vai para **401px** (o celular afasta o zoom) | `(member)/page.tsx` (título `text-3xl` e botões das alas) | V | `min-w-0` no texto dos botões + `wrap-anywhere`/`hyphens-auto` (com `lang="pt-BR"` hifeniza certo) | 1.4.4, 1.4.10 |
| **A29** | **Novo.** Home sem `<main>` (axe: `landmark-one-main`, `region`) | `(member)/page.tsx:47` | L | Trocar `<section>` por `<main>` | 1.3.1 (boa prática) |
| **A30** | **Novo.** Dias que já passaram com contraste de **1,81:1**, e eles são clicáveis (não valem como "inativos") | `(m)MonthCalendar.tsx:172` | V | `#676b6e` (5,38:1), sem borda/fundo para diferenciar | 1.4.3 |
| **A31** | **Novo.** Texto visível fora do nome acessível: "VOLTAR" → "Mês anterior", "AVANÇAR" → "Próximo mês", "26 P-DAY" → "Dia 26, P-day…" (axe: `label-content-name-mismatch`). Comando de voz falha | `(m)MonthCalendar.tsx:80,99,158` | L M | Nome acessível começando pelo texto visível | 2.5.3 |
| **A32** | **Novo.** "Esqueci minha senha" e "Não tem conta? Criar conta" com **23px de altura**, fora de frase | `(leader)/admin/_components/LoginForm.tsx` | M | Botões secundários de 48px | 2.5.8 |
| **A33** | **Novo.** Confirmar vazio dispara **3 `role="alert"` ao mesmo tempo**, lidos embaralhados | `(m)BookingModal.tsx:176,207,215` | L C | Erros por campo via `aria-describedby`, um resumo anunciado, foco no 1º campo com erro | 3.3.1, 4.1.3 |

### 7.3 Soluções novas de acessibilidade (além de corrigir a lista)

1. **Lista de próximos dias livres** (seção 6.3): alternativa à grade, para
   visão baixa, tremor, letra grande e leitor de tela (que hoje passa por todos
   os dias que já passaram antes de achar um livre).
2. **Faixa de mensagens fixa** no rodapé da tela: um único lugar onde toda
   resposta aparece, visível e anunciada, sem cobrir o foco.
3. **Cartão de confirmação + agenda do celular** (seção 6.5), com o caminho
   certo para iPhone e Android.
4. **Botão "Letra maior"** (opcional) na faixa: aumenta a base e fica salvo no
   aparelho. Não substitui o zoom nem a letra do sistema; só soma.
5. **Datas sempre por extenso e com dia da semana** ("quinta-feira, 12 de
   novembro"), na tela, no leitor de tela e nos e-mails. `src/lib/date.ts` já
   tem `dataPorExtenso`/`diaDaSemanaEDia` (usados nos e-mails): reaproveitar
   na tela.
6. **Glossário embutido:** "P-day" explicado na primeira menção da mensagem.

### 7.4 Auditoria automática (24/10/2026)

**Como foi feita:** Chromium (Playwright) contra o `next dev` local, celular de
390×844 com movimento reduzido; axe-core 4.14 com as regras `wcag2a`,
`wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa` e `best-practice`. Mais medições
próprias: tamanho e caixa de cada texto visível, tamanho de cada alvo, nome
acessível × texto visível, `color-scheme`, foco do teclado no modal (sem enviar
agendamento), posição e anúncio das mensagens, 320px e letra a 200%,
computador a 1366px.

| Página | axe (violações) | Medições |
|---|---|---|
| `/` (home) | `landmark-one-main`, `region` (moderadas) | menor texto 15,8px (4 textos < 16px); itálico; **401px com letra a 200% em 320px** |
| `/ecoville` (ala) | **`color-contrast` em 21 elementos** (teal 2,46:1; dias passados 1,81:1) e **`label-content-name-mismatch` em 3** (sérias) | menor texto **9px**; 17 textos < 16px; maiúsculas; dias de 37px em 320px; sem rolagem horizontal |
| Modal de agendar | `color-contrast` (botão teal) | abre pelo teclado ✅; Esc fecha ✅; `<form>` ✅; foco fora do modal ❌; Tab sai ❌; fundo não inerte ❌; foco perdido ao fechar ❌; sem `aria-describedby` ❌; 3 alertas simultâneos ❌ |
| Mensagem do dia ocupado | — | dentro da tela no iPhone SE e no 14 ✅; não anunciada ❌ |
| `/admin` (e `/acesso`, que redireciona) | `color-contrast` (botão Entrar) | 2 alvos de 23px de altura ❌ |
| `/redefinir-senha` | `color-contrast` (botão) | — |
| Página inexistente (404) | `color-contrast` (botão) | título "Ala não encontrada" também para endereços que não são de ala (ajustar para "Página não encontrada") |
| Computador (1366px) | — | base de 18px; menor texto 10px (P-day) |
| Todas | — | `color-scheme` ausente; `lang="pt-BR"` ✅; um `h1` ✅ |

**Limites da auditoria (testar à mão):**
- **O painel não entrou:** exige login. Foi feita revisão de código (seções 6.9
  e 6.10).
- **Ferramenta automática acha só uma parte dos problemas;** o resto vem dos
  testes com pessoas (seção 11).
- **Sem leitor de tela real:** foi usada a árvore de acessibilidade do
  Chromium. Falta testar com TalkBack e VoiceOver.
- **Sem Safari/iPhone real e sem Samsung Internet.**

---

## 8. Tamanhos de letra

Base em `%`, que já acompanha a letra do navegador. **Nada em `px` fixo para
texto.** Os tamanhos abaixo são os do celular; no computador tudo cresce junto
(seção 8.1).

| Uso | Tamanho mínimo |
|---|---|
| Títulos de página | 30–36px, serifa |
| Títulos de cartão / modal | 22–24px, serifa |
| Texto principal, botões, campos | 18–20px, peso ≥ 400 (botões 600) |
| Legendas, rótulos, rodapé | **16px** |
| Proibido para texto que precisa ser lido | `text-xs` (13,5px), `text-sm` (15,8px), `text-[9px]`, `text-[10px]`, MAIÚSCULAS, itálico longo |

Entrelinha 1,5–1,6. Parágrafos curtos (no máximo 2–3 linhas no celular).

**Onde há texto pequeno hoje** (`text-xs` / `text-sm` / `text-[Npx]`), por
arquivo: `CreateWardForm.tsx` 11 · `MonthCalendar.tsx` 7 · `UsersCard.tsx` 5 ·
`EditBookingModal.tsx` 5 · `NotificationsCard.tsx` 4 · `LoginForm.tsx` 4 ·
`BookingModal.tsx` 3 · `WardSwitcher.tsx` 3 · `HistoryCard.tsx` 3 ·
`BookingsCard.tsx` 3 · `Footer.tsx` 2 · `MonthSelect.tsx` 2 ·
`RequestAccess.tsx` 2 · outros 1 cada.

### 8.1 Letra que acompanha o tamanho da tela

Hoje a base é 18px em qualquer tela (medido também a 1366px). No celular está
certo; num monitor, visto de mais longe, fica pequeno (é o que acontece no
painel). Fazer a base crescer com a largura da tela, **com piso e teto**:

```css
html {
    /* 18px no celular → ~20px no tablet → 22px no computador */
    font-size: clamp(112.5%, 100% + 0.5vw, 137.5%);
}
```

| Largura da tela | Base |
|---|---|
| 320–390px (celular) | 18px |
| 768px (tablet) | ~20px |
| 1024px (notebook pequeno) | ~21px |
| ≥ 1200px (computador) | 22px |

**Por que assim:**

- **Mistura `%` com `vw` dentro de `clamp()`.** Só `vw` quebraria o zoom do
  navegador e ignoraria a letra que a pessoa escolheu (falha no WCAG 1.4.4). Com
  `%`, quem aumentou a letra no navegador continua ganhando o aumento: o piso e o
  teto crescem junto.
- **Piso de 18px:** no celular nada diminui.
- **Teto de 22px:** evita letra exagerada em monitor grande (linha curta demais,
  rolagem demais).
- **O layout cresce junto.** O Tailwind usa `rem` para espaçamentos e larguras
  máximas (`max-w-3xl` = 48rem: ~864px hoje, ~1056px no computador). Cartões,
  botões e alvos de toque aumentam na mesma proporção, como um zoom bem calibrado.
- **Os pontos de quebra (`sm:`, `lg:`) não se movem:** em media query, `rem` usa
  o tamanho padrão do navegador, não o `font-size` do `html`. As container
  queries em `rem` do calendário (`@max-[15rem]`) acompanham a letra, como já
  pretendido.
- **Breakpoint só para layout, não para letra.** Com a base fluida, o mesmo
  `text-lg` já cresce sozinho. Tirar os `sm:text-*` usados para compensar, que
  deixam a escala desigual entre as telas.
- **Linhas com no máximo ~65 caracteres** (`max-w-prose`): com letra maior em
  tela larga, parágrafo comprido cansa a leitura.
- **Letra do sistema no iPhone (A20) — conflito a resolver.** O
  `font: -apple-system-body` faz o Safari seguir a letra do sistema, mas no
  tamanho padrão do iPhone ele dá **17px**, abaixo do piso de 18px, e ocupa o
  mesmo `font-size` do `html` que o `clamp`. Caminho: aplicar só no iOS (via
  `@supports (font: -apple-system-body)`), compensar com um fator no `body`
  (18/17 ≈ 1,06) e reaplicar a família da fonte. Testar com a letra do sistema
  no mínimo, no padrão e no máximo.

### 8.2 Painel do líder no computador

**Hoje:**
- a base é 18px e a largura máxima é `max-w-3xl`;
- há textos `text-sm`/`text-xs` em quase todos os componentes do painel (11 em
  `CreateWardForm.tsx`, 5 em `UsersCard.tsx`, 5 em `EditBookingModal.tsx`…);
- o quadradinho da data usa 10px fixos;
- no `lg:` a lista vira 2 colunas estreitas (`BookingsCard.tsx:52`) e os nomes
  são cortados com "…".

| O que | Proposta |
|---|---|
| Base | Letra que cresce com a tela (8.1): 22px no computador |
| Textos pequenos | Nenhum `text-sm`/`text-xs` no painel; mínimo `text-base` (= 22px no computador) |
| Títulos | Título do painel `text-3xl`; títulos de cartão `text-xl` (sem `sm:` extra, já crescem) |
| Lista de almoços | **Uma coluna** (tirar o `lg:grid-cols-2`), com espaço para a linha inteira: data · nome · telefone · Ligar · WhatsApp · Editar |
| Nomes | Sem `truncate`: quebra a linha |
| Quadradinho da data | Medidas em `rem` (ex.: `size-14`), dia + "qui" ≥ 14px |
| Modal de edição | `max-w-lg`, campos `text-lg`, dentro de `<form>` |
| Botão da imagem | No computador ele **baixa** a imagem e no celular **compartilha**; o texto acompanha: "Baixar imagem do calendário" / "Enviar no WhatsApp" |
| Teclado | Ordem do Tab = ordem visual; foco azul de 3px; Enter salva no modal |
| Testar | Monitor comum (1366 e 1920px), notebook, zoom de 200% do navegador |

---

## 9. Checklist de acessibilidade (para cada tela)

**Nota sobre tamanho de alvo:** o WCAG pede **24×24px** no nível AA (2.5.8; link
dentro de frase é exceção) e **44×44px** no AAA (2.5.5). A meta de **48px** deste
plano segue a recomendação do Android/Material e é o certo para mãos com
tremor. Os 24px são o piso legal, não a meta.

**Ver**
- [ ] Contraste do texto ≥ 4,5:1 (meta 7:1); ícones, bordas de campos, interruptores e foco ≥ 3:1.
- [ ] Elemento clicável não usa cor "apagada": a exceção de contraste é só para o que está realmente inativo.
- [ ] Nenhum estado só por cor.
- [ ] Nada abaixo de 16px, nada em px fixo, sem MAIÚSCULAS, sem itálico longo.
- [ ] Funciona com a **letra do celular no máximo** e com zoom de 200%, sem cortar nem sobrepor.
- [ ] Funciona em tela de 320px de largura, **inclusive com letra a 200%** (hoje a home falha).
- [ ] Testado em 320, 390, 768, 1366 e 1920px: a letra cresce com a tela e o layout não quebra.
- [ ] Continua certo com o modo escuro do sistema ligado (Chrome e Samsung Internet).

**Tocar**
- [ ] Alvos ≥ 48px (piso WCAG: 24px), com ≥ 8px de espaço entre eles.
- [ ] Nada depende de arrastar, deslizar, segurar ou toque duplo.
- [ ] Segundo toque durante o envio não faz nada (já é assim).

**Entender**
- [ ] Toda mensagem aparece na área visível e fica até a próxima ação.
- [ ] Datas por extenso com dia da semana.
- [ ] Regras e formatos mostrados **antes** do erro.
- [ ] Erro diz o que aconteceu e o que fazer.
- [ ] Ajuda ("Precisa desmarcar?…") sempre no mesmo lugar.
- [ ] Nada em inglês.

**Leitor de tela**
- [ ] Toda página tem `<main>`; um `h1`; ordem de leitura = ordem visual.
- [ ] O texto visível do botão está no começo do nome acessível (comando de voz).
- [ ] `aria-pressed` só em botão que liga/desliga de verdade.
- [ ] Modal: foco entra, fica preso, **volta ao elemento de origem** ao fechar; fundo inerte.
- [ ] Mensagens anunciadas (região "ao vivo" **sempre montada**); no máximo um anúncio por vez.
- [ ] Campo com erro ligado à mensagem (`aria-describedby`).
- [ ] Elemento fixo (faixa de mensagens) nunca cobre o elemento com foco.
- [ ] Botões nativos (`<button>`), não `div` com `role`.

**Aparelho**
- [ ] `color-scheme: only light` declarado.
- [ ] Sem `backdrop-blur` nem efeitos pesados.
- [ ] Testado num Android simples (de preferência Samsung) e no iPhone.

**Automático (antes de cada entrega)**
- [ ] axe-core sem violações sérias nas páginas públicas (ex.: extensão axe DevTools ou o mesmo teste com Playwright da seção 7.4).

---

## 10. Ordem de implementação

| Fase | O que | Arquivos principais | Tamanho |
|---|---|---|---|
| **1. Cores + fundo claro** | Tokens novos, faixa de cabeçalho, fundo creme, `<main>` na home, flor, fitinha, imagem exportada, e-mails, `color-scheme`, `CLAUDE.md` | `globals.css`, `layout.tsx`, novo componente de cabeçalho, todas as páginas (texto branco → escuro), `Flower.tsx`, `month-image/MonthImage.tsx`, `supabase/email/*`, `email-templates.ts`, `CLAUDE.md` | Grande |
| **2. Letra e contraste** | **Letra que cresce com a tela** (8.1), **painel no computador** (8.2), eliminar textos < 16px e px fixo, MAIÚSCULAS, itálico; dias passados ≥ 4,5:1; `muted` mais escuro; placeholders; home sem estourar com letra a 200% | `globals.css`, `(leader)/dashboard/*`, `MonthCalendar.tsx`, `(member)/page.tsx`, lista da seção 8 | Médio |
| **3. Agendamento** | Botões de mês com nome, estados do dia, `<button>` nos dias sem `aria-pressed`, nome acessível com o texto visível, lista de dias livres, faixa de mensagens, título por extenso, dicas, `enterKeyHint`, lembrar nome/telefone, cartão de confirmação + agenda (iPhone e Android) | `MonthCalendar.tsx`, `WardBooking.tsx`, `BookingModal.tsx`, `src/lib/date.ts`, nova rota do `.ics` | Grande |
| **4. Modais e leitor de tela** | `<dialog>`/foco/`inert`/retorno do foco, `aria-describedby`, um alerta por vez, regiões "ao vivo", `alert()` → mensagem, tirar `backdrop-blur` | `BookingModal.tsx`, `EditBookingModal.tsx`, `UsersCard.tsx`, `LoadingOverlay.tsx`, `WardSwitcher.tsx` | Médio |
| **5. Painel** | "owner" em português, Ligar/WhatsApp (só no painel), nomes de botões, mês recolhível, interruptores com texto e contraste, regra da senha visível, links do login como botões de 48px | `(leader)/dashboard/*`, `NotificationsCard.tsx`, `LoginForm.tsx`, `ResetPasswordForm.tsx` | Médio |
| **6. Toques finais** | Lembrar última ala, lema, botão "Letra maior", prévia do link com imagem, título do 404 | `(member)/page.tsx`, `(member)/[slug]/page.tsx`, `not-found.tsx` | Pequeno |

Depois de cada fase: `npx tsc --noEmit`, `npm run lint`, `npm run build` (com o
`dev` parado), o teste automático da seção 7.4 e conferir no celular.

---

## 11. Como validar

**Com o público real (o teste que mais vale):**
- Pedir a **3–5 irmãs** (idades diferentes, de preferência acima de 65) para,
  sem ajuda: (1) abrir o link, (2) agendar um dia livre, (3) descobrir quem
  agendou um dia ocupado, (4) adicionar o almoço à agenda.
- Observar sem explicar. Cada hesitação, toque errado ou pergunta é um ajuste.

**Testes técnicos:**
- Letra do sistema no máximo (Android e iPhone) + zoom de 200%.
- TalkBack (Android) e VoiceOver (iPhone): agendar um dia só ouvindo.
- Comando de voz (Acesso por Voz no Android / Controle por Voz no iPhone):
  "tocar em Novembro", "tocar em Confirmar".
- Chrome DevTools → Rendering → "Emulate vision deficiencies" (daltonismo e visão embaçada).
- axe / Lighthouse em cada página (seção 7.4).
- Samsung Internet com modo escuro ligado.
- Rede lenta (DevTools → "Slow 3G").

**Atenção:** o `.env` local aponta para o banco de **produção**. Testar
agendamentos só combinando com a líder e apagando depois.

---

## 12. Decisões em aberto

1. Marinho `#003057` (Igreja) ou manter `#143157`?
2. Onde vai o lema "A caridade nunca falha": faixa da home, rodapé ou os dois?
3. Lembrar nome e telefone no aparelho: ok para celulares compartilhados na família?
4. Botão "Letra maior": com a letra crescendo sozinha (8.1), ainda precisa? Decidir no teste com as irmãs.
5. Lista de dias livres: sempre visível abaixo do calendário, ou atrás de um botão "Ver como lista"?
6. Prévia do link do WhatsApp com imagem: vale o esforço agora?
