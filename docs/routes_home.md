# `/`: home (lista de alas)

Porta de entrada para quem não tem o link da ala. Mostra o logo, o título
"Almoço dos Missionários" e **um botão por ala**. Tocar leva a `/[slug]` (ver [routes_slug.md](routes_slug.md)).

## Arquivo

`src/app/(member)/page.tsx`: a página inteira é um componente client
(`'use client'`). Dependências: `swr`,
`src/components/{Spinner,HeaderBand}`, `src/lib/last-ward.ts` (última ala
aberta), `GET /api/alas` (ver [routes_api.md](routes_api.md)).

## Renderização e dados

- A página é **estática** (`○` no build, pré-renderizada). A lista de alas não
  vem no HTML: é buscada no navegador com SWR em `GET /api/alas` (`[{ nome, slug }]`,
  ordem alfabética).
- O `fetcher` lança erro se a resposta não for `ok` ou não for um array
  ("Payload inválido"), e o SWR mostra o estado de erro.

### Estados da lista

| Estado | O que aparece |
|---|---|
| Carregando | "Carregando alas…" (`role="status"`); o container tem `aria-busy` |
| Erro | "Não foi possível carregar as alas." (vermelho claro) |
| Pronto | os botões, que aparecem **de uma vez** com `animate-aparecer` (a lista chega depois da página; o fade avisa que algo apareceu) |

## Botão de ala

- Mostra o nome da ala e uma seta (`›`).
- Ao tocar: `loadingSlug = slug`, **todos os botões ficam desativados** (um toque
  só) e `router.push('/<slug>')`.
- O botão tocado fica azul (`bg-secondary`). **O nome continua visível** (a pessoa vê qual ala
  tocou) e "Abrindo…" + `<Spinner />` aparecem no lugar da seta até a página da
  ala abrir. O loading não é desligado de propósito: a navegação desmonta a tela.
- `aria-busy` no botão tocado; `active:scale-[0.98]` ao tocar.
- Visual: cartão branco com contorno fino (`ring-primary/10`), **fitinha
  vertical** framboesa → dourado → framboesa na borda esquerda (o detalhe padrão
  do site, o mesmo do topo do calendário; `span` absoluto `w-1.5` com
  `overflow-hidden` no botão), texto marinho, `text-xl` (20px: é a ação
  principal da página); hover azul com texto branco.

## "Continuar na sua ala" (última ala aberta)

A irmã costuma usar sempre a mesma ala. Quando ela já abriu uma ala **neste
aparelho**, a home mostra primeiro um atalho para ela (plano de design, 6.2):

- A página da ala grava o slug (`lembrarAla`, ver [src_lib.md](src_lib.md)); a
  home lê com `useSyncExternalStore(…, alaLembrada, () => null)`: no servidor e
  na hidratação vale `null`, então não há diferença de HTML. Guarda **só o
  slug**; o nome vem da lista de `/api/alas`, então ala renomeada aparece com o
  nome novo e ala apagada (ou slug que não está na lista) **não mostra atalho**.
- Botão azul cheio (`bg-secondary`), mesmo formato e fitinha dos outros, em duas
  linhas: "Continuar na sua ala" (`text-base`, branco 85%) e o **nome da ala**
  (`text-xl`, negrito). "Continuar na Ala X" foi evitado: o nome pode não
  começar por "Ala" (ex.: "Ramo"), e a frase ficaria errada. Tocar funciona
  igual aos outros botões ("Abrindo…" + spinner, todos desativados).
- Embaixo: "Ou toque em outra ala:" (`text-lg`) e a lista **sem** a ala
  lembrada (não aparece duas vezes). Só uma ala no sistema: só o atalho, sem
  essa frase.
- Sem `localStorage` (aba anônima, navegador que bloqueia): tudo funciona, só
  não há atalho (`try/catch` no `last-ward.ts`).
- Aparece junto com a lista (o `animate-aparecer` dela), sem pular depois.

## Layout

- `HeaderBand title="Almoço dos Missionários"`: a mesma faixa das outras
  páginas (título e flor). **Sem a imagem grande**
  (decisão do dono, 25/10/2026): a lista de alas aparece logo.
- `<main>` no fundo creme, largura máxima `max-w-xl`: "Toque na sua ala para
  agendar." (`text-lg`, texto escuro) e a lista de alas. **Sem escritura**: o
  dono tirou em 24/10/2026 (não use de novo).
- Com letra grande em tela estreita, o título e o nome das alas **hifenizam**
  (`hyphens-auto` + `wrap-break-word`, o `lang="pt-BR"` hifeniza certo) em vez
  de empurrar a página para o lado. Testado em 320px com letra a 200%.
  Erro da lista em rosa (`text-accent`).

## Planejado (não implementado)

Filtro na home: escolher primeiro o estado, depois a cidade, e ver as alas
disponíveis. O banco já tem `pais`, `estado` e `cidade` na tabela `ala` (ver
[database.md](database.md)).
