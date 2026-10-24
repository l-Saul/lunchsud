# `/`: home (lista de alas)

Porta de entrada para quem não tem o link da ala. Mostra o logo, o título
"Almoço dos Missionários" e **um botão por ala**. Tocar leva a `/[slug]` (ver [routes_slug.md](routes_slug.md)).

## Arquivo

`src/app/(member)/page.tsx`: a página inteira é um componente client
(`'use client'`). Dependências: `swr`,
`src/components/{Flower,Spinner,HeaderBand}`, `GET /api/alas` (ver [routes_api.md](routes_api.md)).

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
- Visual: cartão branco com contorno fino (`ring-primary/10`), borda azul
  (`secondary`) à esquerda, texto marinho, `text-xl` (20px: é a ação principal da página); hover azul com texto branco. Divisória do título: linhas douradas
  (`gold`) com a florzinha.

## Layout

- `HeaderBand` (faixa azul): logo `public/lds.jpg` (160×160, `priority`, branca,
  por isso fica na faixa), título `h1` e divisória com florzinha.
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
