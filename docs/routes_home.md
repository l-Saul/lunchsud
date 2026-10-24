# `/`: home (lista de alas)

Porta de entrada para quem não tem o link da ala. Mostra o logo, o título
"Almoço dos Missionários", uma escritura do Livro de Mórmon sorteada e **um botão
por ala**. Tocar leva a `/[slug]` (ver [routes_slug.md](routes_slug.md)).

## Arquivo

`src/app/(member)/page.tsx`: a página inteira é um componente client
(`'use client'`). Dependências: `swr`, `src/lib/scriptures.ts`,
`src/components/{Flower,Spinner}`, `GET /api/alas` (ver [routes_api.md](routes_api.md)).

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
- O botão tocado fica verde. **O nome continua visível** (a pessoa vê qual ala
  tocou) e "Abrindo…" + `<Spinner />` aparecem no lugar da seta até a página da
  ala abrir. O loading não é desligado de propósito: a navegação desmonta a tela.
- `aria-busy` no botão tocado; `active:scale-[0.98]` ao tocar.
- Visual: cartão branco, borda verde à esquerda, texto azul, `text-xl`; hover
  verde com texto branco.

## Escritura sorteada

- `escrituraAleatoria()` (`src/lib/scriptures.ts`) roda **no navegador, ao
  montar** (`useEffect`), e varia a cada carregamento.
- Como a home é pré-renderizada no build, sortear no render daria uma escritura
  diferente no servidor e no navegador (erro de hidratação). Por isso o sorteio
  fica no efeito, com a exceção pontual `eslint-disable-next-line
  react-hooks/set-state-in-effect`: é uma inicialização única e intencional.
- O texto é dividido em verso e referência pelo separador ` — `. A referência
  aparece embaixo, em verde. O bloco entra com `animate-aparecer`.

## Layout

- Logo `public/lds.jpg` (180×180, `priority`), título `h1`, divisória com
  florzinha, "Toque na sua ala para agendar.", escritura.
- `section` com fundo transparente (o "céu" do `body` aparece), largura máxima
  `max-w-xl`.

## Planejado (não implementado)

Filtro na home: escolher primeiro o estado, depois a cidade, e ver as alas
disponíveis. O banco já tem `pais`, `estado` e `cidade` na tabela `ala` (ver
[database.md](database.md)).
