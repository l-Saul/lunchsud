# Plano de design e acessibilidade — Almoço dos Missionários

Plano para deixar o site mais fácil, mais acessível e mais bonito para quem
realmente o usa: **irmãs da Sociedade de Socorro, de 45 a 85 anos, membros da
Igreja, com pouca familiaridade com tecnologia, quase sempre no celular.**

Nada aqui foi implementado ainda. Cada item diz **o que mudar, por quê e em
quais arquivos**.

---

## 0. Resumo das decisões

1. **Sai o verde-água (teal `#1fb9a0`).** Além de não agradar, ele reprova no
   contraste: o texto branco dos botões tem **2,47:1** (mínimo 4,5:1), e o
   contorno de foco fica abaixo de 3:1.
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
5. **Alvos de toque ≥ 48px**, com espaço entre eles.
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
| **Ação** | **Azul Igreja** | **`#006184`** (hover `#005175`) | branco sobre ele: **6,90:1** | Botões principais, dia escolhido, links, contorno de foco |
| **Identidade feminina** | **Rosa-framboesa** | **`#bd0057`** | sobre branco: **6,36:1** | Flor, fitinha, barrinhas dos títulos, dia ocupado (texto), erros, remover |
| Rosa-claro (apoio) | — | `#fdecf1` | framboesa sobre ele: 5,59:1 | Fundo do dia ocupado, caixa de erro, destaques suaves |
| Dourado | Dourado Igreja | `#ffb81c` | sobre marinho: 7,77:1 | **Só decoração**: miolo da flor, luz da faixa, fitinha. Nunca texto sobre claro |
| Texto | Quase preto | `#212225` (hoje `#0f172a`) | sobre branco: 15,91:1 | Texto principal |
| Texto secundário | Cinza Igreja | `#53575b` (hoje `#64748b`) | sobre branco: **7,29:1** / creme 6,83:1 | Descrições, legendas, rótulos, placeholders |
| Rosa sobre marinho | — | `#fda1b2` | sobre marinho: 6,79:1 | Só se houver aviso dentro da faixa azul |

**Sem verde no site.** Sucesso = azul + ícone ✓ + texto ("Almoço agendado").

**Por que o rosa não virou a cor dos botões:** ele já significa "ocupado",
"erro" e "remover". Se também fosse "confirmar", a mesma cor diria "pare" e
"siga". O azul fica com a ação; o rosa fica com a identidade.

**Daltonismo:** é raro em mulheres (cerca de 0,5%), mas o azul e o framboesa
podem ficar parecidos para quem não distingue o vermelho. Por isso os estados
nunca dependem só da tonalidade. Por exemplo: o dia escolhido é um **fundo azul
cheio + ✓**, e o dia ocupado é um **fundo rosa-claro + flor**.

### Como trocar (tokens em `src/app/globals.css`)

| Token atual | Valor atual | Novo valor |
|---|---|---|
| `--color-primary` | `#143157` | `#003057` |
| `--color-secondary` | `#1fb9a0` | `#006184` → troca o teal no site inteiro de uma vez |
| `--color-accent` | `#e0588f` | `#bd0057` |
| `--color-background` | `#ffffff` | `#ffffff` (cartões) |
| `--color-text` | `#0f172a` | `#212225` |
| `--color-muted` | `#64748b` | `#53575b` |
| (novo) `--color-creme` | — | `#faf7f5` (fundo da página) |
| (novo) `--color-rosa-claro` | — | `#fdecf1` |
| (novo) `--color-dourado` | — | `#ffb81c` |

Pode manter os nomes `secondary`/`accent` para não mexer em 19 arquivos.

**Cores escritas direto no código (não usam o token), trocar à mão:**

- [ ] `src/components/CalendarMonthView.tsx` — `const VERDE = '#1fb9a0'` (divisória e Dom/Sáb da imagem exportada).
- [ ] `src/components/Flor.tsx` — pétalas `#e0588f` → `#ed3a65` (`red12`) e miolo `#f6c453` → `#ffb81c`.
- [ ] `src/app/globals.css` — o céu (`body::before`/`::after`) sai do fundo da página (seção 5).
- [ ] `src/app/layout.tsx` — `themeColor` (cor da barra do navegador) = marinho da faixa.
- [ ] `supabase/email/*.html` — botão `#1fb9a0` → `#006184`; fitinha; divisória `#79d5c6`; caixa do código `#e9f8f5`; flor `#e0588f`.
- [ ] `CLAUDE.md` — seção "Cores" (cita o verde) e armadilha "Fundo celestial" (regra antiga do fundo transparente).

---

## 4. Elemento feminino (Sociedade de Socorro)

| Elemento | Como | Onde |
|---|---|---|
| Florzinha | Já existe (`Flor.tsx`). Pétalas framboesa + miolo dourado. Uma por bloco, nunca como fundo repetido | Faixa de cabeçalho, divisórias, imagem exportada, e-mails |
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

### 6.2 Home (lista de alas)

- ✅ Botões grandes, texto 20px, escritura.
- **Lembrar a última ala** (no aparelho): "Continuar na Ala Ecoville" no topo.
- Escritura: sem itálico (ou só uma linha curta), 18px, texto escuro.
- Lema "A caridade nunca falha" na faixa.

### 6.3 Página da ala (calendário) — a tela mais importante

**Troca de mês.** Hoje são dois botões "VOLTAR" / "AVANÇAR" (12px, em
maiúsculas). "Voltar" pode ser confundido com "voltar à página anterior", e o
botão desabilitado fica quase invisível (`opacity-30`). Como **só existem dois
meses**, trocar por **duas abas grandes com o nome do mês**:

```
┌──────────────┬──────────────┐
│ ✓ Outubro    │   Novembro   │   ← aba ativa: azul cheio, texto branco, ✓
└──────────────┴──────────────┘
```

**Estados do dia** (hoje o ocupado é o mais chamativo, mas a irmã procura o livre):

| Estado | Fundo | Número | Segundo sinal | Ao tocar |
|---|---|---|---|---|
| **Livre** | branco | marinho, **negrito** | borda azul de 2px | abre o agendamento |
| **Escolhido** | azul `#006184` | branco | ✓ pequeno | — |
| **Ocupado** | rosa-claro `#fdecf1` | framboesa | florzinha no canto | mostra quem agendou (só o nome) |
| **P-day** | cinza `#eff0f0` | cinza `#676b6e` | listrinhas diagonais | explica o P-day |
| **Já passou** | sem fundo | cinza claro | — | explica que passou |

- O rótulo "P-DAY" dentro do dia tem **9–10px fixos**: tirar e usar listrinhas,
  legenda e mensagem ao tocar. A mensagem explica uma vez: "Segunda-feira é
  **P-day** (dia de descanso dos missionários). Escolha outro dia."
- Dias da semana: de "DOM SEG…" (maiúsculo, 14px) para "Dom Seg…" em 16px.
- Legenda: quadradinhos de 20px, texto de 16px, com os mesmos sinais da grade.

**Lista de próximos dias livres (nova).** Logo abaixo do calendário, os
próximos 5–7 dias livres como **botões grandes de largura total**:

```
Próximos dias livres
┌─────────────────────────────────┐
│ Quinta-feira, 12 de novembro  › │
├─────────────────────────────────┤
│ Sábado, 14 de novembro        › │
└─────────────────────────────────┘
```

Quem tem tremor, enxerga pouco ou usa letra grande toca num botão enorme em vez
de mirar num quadradinho. Também resolve a grade apertada em telas de 320px
(ver A22).

**Mensagens que somem da vista.** A mensagem ao tocar num dia ocupado, P-day ou
passado aparece **embaixo** do calendário. Num celular pequeno, ela fica **fora
da tela**: a irmã toca, "nada acontece", e ela toca de novo. Corrigir com uma
**faixa fixa no rodapé da tela**, sempre visível, com ícone + texto, que fica até
a próxima ação (ver A8).

### 6.4 Janela de agendar (modal)

- Título com **dia da semana por extenso**: "Quinta-feira, 12 de novembro".
- **Dica visível do telefone** abaixo do rótulo: "Exemplo: (41) 99999-9999".
  Hoje o formato só aparece no erro.
- **Lembrar nome e telefone** da própria irmã (no aparelho dela), com "Não é a
  senhora? Limpar". É o telefone **dela mesma**, digitado por ela; não expõe o
  de ninguém.
- **Teclado:** no nome, "Próximo" leva ao telefone; no telefone, "OK" confirma
  (`enterKeyHint` + `<form>`).
- Erros em 16px, com ícone, em caixa rosa-claro, **ligados ao campo** (A11).
- Botão principal "Confirmar almoço".
- ✅ Manter: alvos grandes, Cancelar visível, fecha com X/Esc/toque fora.

### 6.5 Depois de agendar (confirmação) — maior ganho

Hoje o modal fecha e aparece uma frase embaixo do calendário (que pode estar
fora da tela). Proposta: **cartão de confirmação**, com o foco indo para ele:

```
        ✓  (círculo azul)
   Almoço agendado!
   Quinta-feira, 12 de novembro
   Ala Ecoville

 [ (ícone) Adicionar à agenda do celular ]   ← arquivo .ics: o celular lembra a irmã
 [        Voltar ao calendário         ]

  Precisa desmarcar? Fale com a líder da ala.
```

- `.ics` gerado no próprio navegador. Testar no iPhone e no Android.
- "Precisa desmarcar?" explica o caminho, já que a irmã não desmarca sozinha.

### 6.6 Erros e falta de internet

- ✅ Mensagens em português, escritas para a irmã.
- Erro sempre em caixa com ícone (não só texto colorido) e com o que fazer:
  "Verifique a internet e toque em Confirmar de novo".

### 6.7 Login, cadastro e "esqueci a senha" (líder)

- "Esqueci minha senha" e "Não tem conta? Criar conta" (`text-sm`, cinza) viram
  **botões secundários** de 48px.
- **Regra da senha visível antes do erro:** "Mínimo de 6 caracteres" embaixo do
  campo (hoje só aparece depois do erro).
- O aviso de "esqueci a senha" cita `noreply@mail.app.supabase.io`, que está
  errado desde o SMTP do Google. Trocar pelo remetente real.

### 6.8 Pedido de acesso (`/acesso`)

- Dizer o que acontece depois: "Uma líder da ala vai aprovar. A senhora recebe
  um e-mail quando for aprovada." (e-mail K de `messages/emails-do-lider.txt`).

### 6.9 Painel do líder (só com login)

| Hoje | Proposta |
|---|---|
| "Acesso owner", "· owner" (inglês) | "Administração geral" / "Acesso a todas as alas" |
| Telefone em cinza `text-sm`, sem ação | **Botões "Ligar" (`tel:`) e "WhatsApp" (`wa.me`)**, 48px, com texto. **Só aqui, no painel**; nunca na página pública |
| Quadradinho da data com mês em 10px fixo e maiúsculo | "12 · qui" em ≥ 14px |
| Mês recolhível: seta pequena | Seta maior + texto "Abrir"/"Fechar" |
| Erro ao salvar/remover via `alert()` | Mensagem dentro do modal (A14) |
| Botão de exportar a imagem | "Enviar calendário no WhatsApp" |
| Rótulos do modal de edição em `text-sm` cinza | 16px, cor de texto |
| `TrocarAla.tsx` com 10 textos pequenos | ≥ 16px |
| Nomes cortados com "…" (`truncate`) | Quebrar a linha; nunca esconder o nome |
| No computador, tudo fica pequeno | Letra que cresce com a tela + ajustes da seção 8.2 |

### 6.10 Imagem exportada (WhatsApp)

- Cores novas (divisória e Dom/Sáb em framboesa ou azul).
- Tirar as maiúsculas dos rótulos (`textTransform: 'uppercase'`).
- Conferir se os nomes continuam legíveis depois que o WhatsApp comprime.

### 6.11 E-mails (`supabase/email/`)

- Cores novas (lista na seção 3). Alinhar ao fundo claro: corpo creme, faixa
  azul só no cabeçalho, como no site.

### 6.12 Rodapé

- Texto `#53575b` sobre creme, mínimo 16px. Link externo avisa "(abre em outra aba)".

---

## 7. Acessibilidade — análise e melhorias

### 7.1 O que já está bom (manter)

- Base de 18px em `%` (acompanha a letra do navegador); `lang="pt-BR"`.
- Zoom liberado (o `viewport` não trava `maximumScale`).
- Campos com ≥ 16px (o iPhone não dá zoom sozinho ao tocar), `autoComplete`,
  `inputMode="tel"`.
- `aria-label` nos botões só de ícone; spinner com `aria-hidden` ao lado de um verbo.
- Foco visível (contorno de 3px); `prefers-reduced-motion` respeitado, com
  exceção correta do spinner.
- Alvos de toque ≥ 44px; segundo toque bloqueado enquanto envia.
- Remoção com confirmação inline (sem `window.confirm`); modais fecham por
  X/Esc/toque fora.

### 7.2 Problemas encontrados

Legenda de quem é afetado: **V** visão · **M** mãos/toque · **C** compreensão/memória · **L** leitor de tela (TalkBack/VoiceOver) · **A** aparelho simples.

| # | Problema | Onde | Quem | Melhoria | WCAG |
|---|---|---|---|---|---|
| A1 | Teal nos botões (2,47:1) e no contorno de foco (< 3:1) | `globals.css` | V | Azul `#006184` | 1.4.3, 1.4.11 |
| A2 | Rosa dos erros em texto (3,52:1) | vários | V | Framboesa `#bd0057` | 1.4.3 |
| A3 | Texto secundário `#64748b` (4,76:1, no limite); placeholders `muted/60` bem abaixo | vários | V | `#53575b`; placeholder ≥ 4,5:1 | 1.4.3 |
| A4 | Texto de 9–10px **fixo em px** (não cresce com a letra do celular) | `Calendar.tsx:186`, `dashboard/page.tsx:168` | V | Remover; tudo em `rem` | 1.4.4 |
| A5 | MAIÚSCULAS em rótulos (mais difíceis de ler) | `Calendar.tsx:85,104,108,186`, `dashboard/page.tsx:168`, `CalendarMonthView.tsx` | V C | Caixa normal | boa prática |
| A6 | Escritura inteira em itálico | `page.tsx:80` | V | Sem itálico | boa prática |
| A7 | Estados do dia só por cor | `Calendar.tsx` | V L | Segundo sinal (seção 6.3) | 1.4.1 |
| A8 | Mensagem ao tocar no dia fica fora da tela e **não é anunciada** (sem região "ao vivo") | `ClientPage.tsx` (`ocupadoPor`/`aviso`) | todos, L | Faixa fixa com `role="status"` **sempre montada** | 4.1.3 |
| A9 | Região "ao vivo" do sucesso é criada junto com o texto; leitores costumam não anunciar | `ClientPage.tsx:445` | L | Região sempre montada + cartão de confirmação recebe foco | 4.1.3 |
| A10 | Modais sem gestão de foco: o foco não entra no modal, não fica preso nele, não volta ao dia tocado ao fechar; o fundo continua navegável | `ClientPage.tsx:332`, `EditModal.tsx:143`, `UsuariosCard.tsx:150` | L | `<dialog>` nativo com `showModal()` (foco e fundo inerte de graça) ou foco inicial + `inert` no fundo + retorno do foco | 2.4.3, 2.1.2 |
| A11 | Mensagem de erro não ligada ao campo (`aria-invalid` sem `aria-describedby`) | `ClientPage.tsx:363,389`, `EditModal.tsx:187,211` | L | `aria-describedby` → id do erro | 1.3.1, 3.3.1 |
| A12 | Dia do calendário é `<div role="button">` e o leitor diz só "Dia 12, disponível" (sem mês nem dia da semana) | `Calendar.tsx` | L | `<button>` nativo + "Quinta-feira, 12 de novembro, livre" | 1.3.1, 2.4.6 |
| A13 | Troca de mês não é anunciada | `Calendar.tsx` (título do mês) | L | Abas com `role="tab"`/`aria-selected` (seção 6.3) | 4.1.2 |
| A14 | Erros do painel em `alert()` (texto do sistema, some com um toque, confunde) | `EditModal.tsx` | C V | Mensagem dentro do modal, com o que fazer | 3.3.1 |
| A15 | Regra da senha só aparece depois do erro | `LoginForm.tsx`, `RedefinirSenhaForm.tsx` | C | Dica visível antes | 3.3.2 |
| A16 | Formato do telefone não é mostrado antes | `ClientPage.tsx`, `EditModal.tsx` | C | "Exemplo: (41) 99999-9999" | 3.3.2 |
| A17 | Enter do teclado não confirma (os campos não estão num `<form>`) | `ClientPage.tsx`, `EditModal.tsx` | M C | `<form>` + `enterKeyHint` | boa prática |
| A18 | Link externo abre outra aba sem avisar | `Footer.tsx:19` | C L | "(abre em outra aba)" | 3.2.5 |
| A19 | Sem `color-scheme`: o modo escuro forçado do Chrome/Samsung Internet pode inverter as cores e estragar o contraste | `layout.tsx` (`viewport`) | V A | `color-scheme: only light` | — |
| A20 | No iPhone, o Safari não segue o tamanho de letra do sistema | `globals.css` (`html`) | V | Testar `font: -apple-system-body` no `html` (reaplicando a fonte da página) | 1.4.4 |
| A21 | `backdrop-blur` em 5 telas: pesado em Android simples (tela trava, toque "não responde") | `ClientPage.tsx`, `EditModal.tsx`, `UsuariosCard.tsx`, `LoadingOverlay.tsx`, `TrocarAla.tsx` | A M | Fundo sólido semitransparente, sem desfoque | — |
| A22 | Grade de 7 colunas em tela de 320px ou com letra grande: dias com ~36px, números apertados | `Calendar.tsx` | V M | Lista de dias livres (seção 6.3); conferir a grade com a letra no máximo | 1.4.10, 2.5.8 |
| A23 | Botões desabilitados com `opacity-30`: a pessoa não entende se é botão | `Calendar.tsx` | V C | Some com as abas de mês; regra geral: desabilitado em cinza legível | — |
| A24 | Botão fechar do modal só com "X" | modais | C | Manter "Cancelar" sempre visível ao lado da ação (já é assim no agendar) | — |
| A25 | Base fixa em 18px em qualquer tela: no computador (monitor a 60–70cm dos olhos) o painel fica pequeno, e o `text-sm` vira ~16px | `globals.css`, `dashboard/*` | V | Letra que cresce com a tela (8.1) + painel (8.2) | boa prática |
| A26 | Nomes cortados com "…" (`truncate`): a informação some | `dashboard/page.tsx` (nome da ala e de quem agendou) | V C | Quebrar a linha | 1.4.10 |

### 7.3 Soluções novas de acessibilidade (além de corrigir a lista)

1. **Lista de próximos dias livres** (seção 6.3): alternativa à grade, para
   visão baixa, tremor e letra grande.
2. **Faixa de mensagens fixa** no rodapé da tela: um único lugar onde toda
   resposta aparece, visível e anunciada.
3. **Cartão de confirmação + agenda do celular** (seção 6.5): reduz o
   esquecimento, que é o problema real depois de agendar.
4. **Botão "Letra maior"** (opcional) na faixa: aumenta a base de 18px para
   ~22px e fica salvo no aparelho. Quem não sabe usar o zoom do navegador ganha
   um caminho visível. Não substitui o zoom nem a letra do sistema; só soma.
5. **Datas sempre por extenso e com dia da semana** ("quinta-feira, 12 de
   novembro"), na tela, no leitor de tela e nos e-mails. Criar um formatador
   único em `src/lib/date.ts`.
6. **Glossário embutido:** "P-day" explicado na primeira menção da mensagem.

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
| Proibido para texto que precisa ser lido | `text-xs` (≈13px), `text-[9px]`, `text-[10px]`, MAIÚSCULAS, itálico longo |

Entrelinha 1,5–1,6. Parágrafos curtos (no máximo 2–3 linhas no celular).

**Onde há texto pequeno hoje** (`text-xs` / `text-sm` / `text-[Npx]`), por
arquivo: `TrocarAla.tsx` 10 · `Calendar.tsx` 7 · `dashboard/page.tsx` 7 ·
`EditModal.tsx` 5 · `UsuariosCard.tsx` 5 · `LoginForm.tsx` 4 ·
`ClientPage.tsx` 3 · `MonthSelect.tsx` 2 · `Footer.tsx` 2 ·
`SolicitarAcesso.tsx` 2 · outros 1 cada.

### 8.1 Letra que acompanha o tamanho da tela

Hoje a base é 18px em qualquer tela. No celular está certo; num monitor, visto
de mais longe, fica pequeno (é o que acontece no painel). Fazer a base crescer
com a largura da tela, **com piso e teto**:

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
  o tamanho padrão do navegador, não o `font-size` do `html`.
- **Breakpoint só para layout, não para letra.** Com a base fluida, o mesmo
  `text-lg` já cresce sozinho. Tirar os `sm:text-*` usados para compensar, que
  deixam a escala desigual entre as telas.
- **Linhas com no máximo ~65 caracteres** (`max-w-prose`): com letra maior em
  tela larga, parágrafo comprido cansa a leitura.
- **A20 e 8.1 mexem no mesmo `font-size` do `html`.** Implementar juntos e
  testar no iPhone com a letra do sistema grande, para o aumento não dobrar.

### 8.2 Painel do líder no computador

**Hoje:**
- a base é 18px e a largura máxima é `max-w-3xl`;
- há 6 `text-sm` na página do painel, mais 8 `text-sm` + 2 `text-xs` em
  `TrocarAla.tsx`, 5 em `UsuariosCard.tsx` e 5 em `EditModal.tsx`;
- o quadradinho da data usa 10px fixos;
- no `lg:` a lista vira 2 colunas estreitas e os nomes são cortados com "…".

| O que | Proposta |
|---|---|
| Base | Letra que cresce com a tela (8.1): 22px no computador |
| Textos pequenos | Nenhum `text-sm`/`text-xs` no painel; mínimo `text-base` (= 22px no computador) |
| Títulos | Título do painel `text-3xl`; títulos de cartão `text-xl` (sem `sm:` extra, já crescem) |
| Lista de almoços | **Uma coluna** (tirar o `lg:grid-cols-2`), com espaço para a linha inteira: data · nome · telefone · Ligar · WhatsApp · Editar |
| Nomes | Sem `truncate`: quebra a linha |
| Quadradinho da data | Medidas em `rem` (ex.: `size-14`), dia + "qui" ≥ 14px |
| Modal de edição | `max-w-lg`, campos `text-lg` |
| Botão da imagem | No computador ele **baixa** a imagem e no celular **compartilha**; o texto acompanha: "Baixar imagem do calendário" / "Enviar no WhatsApp" |
| Teclado | Ordem do Tab = ordem visual; foco azul de 3px; Enter salva no modal (`<form>`) |
| Testar | Monitor comum (1366 e 1920px), notebook, zoom de 200% do navegador |

---

## 9. Checklist de acessibilidade (para cada tela)

**Ver**
- [ ] Contraste do texto ≥ 4,5:1 (meta 7:1); ícones, bordas de campos e foco ≥ 3:1.
- [ ] Nenhum estado só por cor.
- [ ] Nada abaixo de 16px, nada em px fixo, sem MAIÚSCULAS, sem itálico longo.
- [ ] Funciona com a **letra do celular no máximo** e com zoom de 200%, sem cortar nem sobrepor.
- [ ] Funciona em tela de 320px de largura.
- [ ] Testado em 320, 390, 768, 1366 e 1920px: a letra cresce com a tela e o layout não quebra.
- [ ] Continua certo com o modo escuro do sistema ligado (Chrome e Samsung Internet).

**Tocar**
- [ ] Alvos ≥ 48px, com ≥ 8px de espaço entre eles.
- [ ] Nada depende de arrastar, deslizar, segurar ou toque duplo.
- [ ] Segundo toque durante o envio não faz nada (já é assim).

**Entender**
- [ ] Toda mensagem aparece na área visível e fica até a próxima ação.
- [ ] Datas por extenso com dia da semana.
- [ ] Regras e formatos mostrados **antes** do erro.
- [ ] Erro diz o que aconteceu e o que fazer.
- [ ] Nada em inglês.

**Leitor de tela**
- [ ] Ordem de leitura = ordem visual; um `h1` por página.
- [ ] Modal: foco entra, fica preso, volta ao fechar; fundo inerte.
- [ ] Mensagens anunciadas (região "ao vivo" sempre montada).
- [ ] Campo com erro ligado à mensagem (`aria-describedby`).
- [ ] Botões nativos (`<button>`), não `div` com `role`.

**Aparelho**
- [ ] Sem `backdrop-blur` nem efeitos pesados.
- [ ] Testado num Android simples (de preferência Samsung) e no iPhone.

---

## 10. Ordem de implementação

| Fase | O que | Arquivos principais | Tamanho |
|---|---|---|---|
| **1. Cores + fundo claro** | Tokens novos, faixa de cabeçalho, fundo creme, flor, fitinha, imagem exportada, e-mails, `color-scheme`, `CLAUDE.md` | `globals.css`, `layout.tsx`, novo componente de cabeçalho, todas as páginas (texto branco → escuro), `Flor.tsx`, `CalendarMonthView.tsx`, `supabase/email/*`, `CLAUDE.md` | Grande |
| **2. Letra e contraste** | **Letra que cresce com a tela** (8.1), **painel no computador** (8.2), eliminar textos < 16px e px fixo, MAIÚSCULAS, itálico; `muted` mais escuro; placeholders | `globals.css`, `dashboard/*`, lista da seção 8 | Médio |
| **3. Agendamento** | Abas de mês, estados do dia, `<button>` nos dias, lista de dias livres, faixa de mensagens, título por extenso, dicas, `<form>`, lembrar nome/telefone, cartão de confirmação + `.ics` | `Calendar.tsx`, `ClientPage.tsx`, `src/lib/date.ts` | Grande |
| **4. Modais e leitor de tela** | `<dialog>`/foco/`inert`, `aria-describedby`, regiões "ao vivo", `alert()` → mensagem, tirar `backdrop-blur` | `ClientPage.tsx`, `EditModal.tsx`, `UsuariosCard.tsx`, `LoadingOverlay.tsx`, `TrocarAla.tsx` | Médio |
| **5. Painel** | "owner" em português, Ligar/WhatsApp (só no painel), nomes de botões, mês recolhível, regra da senha visível, remetente do "esqueci a senha" | `dashboard/*`, `EditModal.tsx`, `TrocarAla.tsx`, `LoginForm.tsx`, `RedefinirSenhaForm.tsx` | Médio |
| **6. Toques finais** | Lembrar última ala, lema, botão "Letra maior", prévia do link com imagem | `page.tsx`, `[slug]/page.tsx` | Pequeno |

Depois de cada fase: `npx tsc --noEmit`, `npm run lint`, `npm run build` (com o
`dev` parado) e conferir no celular.

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
- Chrome DevTools → Rendering → "Emulate vision deficiencies" (daltonismo e visão embaçada).
- Lighthouse / axe (acessibilidade) em cada página.
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
