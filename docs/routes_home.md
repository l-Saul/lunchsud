# `/`: home (encontrar a ala)

**Quem chega aqui não é a irmã que agenda**: ela recebe o link da ala
(`/[slug]`) no grupo do WhatsApp. A home é para quem quer **achar uma ala** ou
**pedir uma ala nova** (em geral, líderes). Por isso o pedido de ala nova fica
em cima, logo depois do "Continuar". Mostra o título
"Almoço dos Missionários", o atalho para a última ala aberta, o pedido de ala
nova e a **busca de ala** (estado → cidade → ala). Tocar numa ala leva a
`/[slug]` (ver [routes_slug.md](routes_slug.md)).

## Arquivos

```
src/app/(member)/
  page.tsx                  a home (client)
  _components/
    RequestWard.tsx         grupo "Sua ala ou ramo ainda não está aqui?" + modal do pedido
```

`page.tsx` é um componente client (`'use client'`). Dependências: `swr`,
`src/components/{Spinner,HeaderBand,WardFilter}`, `src/lib/last-ward.ts`
(última ala aberta), `GET /api/alas` (ver [routes_api.md](routes_api.md)).

## Renderização e dados

- A página é **estática** (`○` no build, pré-renderizada). As alas não vêm no
  HTML: são buscadas no navegador com SWR em `GET /api/alas` (só as **ativas**,
  `[{ nome, slug, estado, cidade }]`, ordem alfabética).
- O `fetcher` lança erro se a resposta não for `ok` ou não for um array
  ("Payload inválido"), e o SWR mostra o estado de erro.

### Estados

| Estado | O que aparece |
|---|---|
| Carregando | "Carregando alas…" (`role="status"`); o container tem `aria-busy` |
| Erro | "Não foi possível carregar as alas." (rosa, `text-accent`) |
| Pronto | tudo abaixo, **de uma vez**, com `animate-aparecer` (chega depois da página; o fade avisa que algo apareceu) |

## Layout (de cima para baixo)

1. `HeaderBand title="Almoço dos Missionários"` (título e flor). **Sem a imagem
   grande** e **sem escritura** (decisões do dono, 24 e 25/10/2026).
2. **"Continuar na sua ala"**, se houver ala lembrada (abaixo).
3. **`RequestWard`**: o grupo para pedir ala nova. **Logo depois do "Continuar"
   e antes da busca**, por pedido do dono.
4. **A busca**, num **cartão branco só** (`bg-background`, `ring-1`, sombra):
   título `h2` **"Encontre a sua ala"** ("Encontre outra ala" quando há ala
   lembrada) e o **`WardFilter`** (o mesmo do painel e do `/acesso`; ver
   [src_components.md](src_components.md)) com a instrução "Toque na sua ala
   para agendar.".

Tudo no `<main>` sobre o creme, `max-w-xl`. Com letra grande em tela estreita,
título e nomes **hifenizam** (`hyphens-auto` + `wrap-break-word`) em vez de
empurrar a página. Testado em 320px com letra a 100%, 150% e 200%.

## A busca (`WardFilter`)

- **Estado** e **Cidade** em lista de escolha (o "dropdown" do aparelho), só com
  os estados e cidades que têm ala. **Os dois começam vazios** e a pessoa
  escolhe (o dono tirou o Paraná que vinha escolhido).
- As alas da cidade: botão branco com a **fitinha** framboesa → dourado →
  framboesa na borda esquerda (o detalhe padrão do site), nome em marinho
  `text-xl` e a seta `›`; hover azul com texto branco.
- **Ao tocar:** `router.push('/<slug>')`; o botão tocado fica azul com "Abrindo…"
  e `<Spinner />` no lugar da seta, e **todos ficam desativados** (um toque só).
  O loading não é desligado de propósito: a navegação desmonta a tela.

## "Continuar na sua ala" (última ala aberta)

A irmã costuma usar sempre a mesma ala. Quando ela já abriu uma ala **neste
aparelho**, a home mostra primeiro um atalho para ela (plano de design, 6.2):

- A página da ala grava o slug (`lembrarAla`, ver [src_lib.md](src_lib.md)); a
  home lê com `useSyncExternalStore(…, alaLembrada, () => null)`: no servidor e
  na hidratação vale `null`, então não há diferença de HTML. Guarda **só o
  slug**; o nome vem da lista de `/api/alas`, então ala renomeada aparece com o
  nome novo e ala apagada (ou slug que não está na lista) **não mostra atalho**.
- Botão azul cheio (`bg-secondary`), com a fitinha, em duas linhas: "Continuar
  na sua ala" (`text-base`, branco 85%) e o **nome da ala** (`text-xl`,
  negrito). "Continuar na Ala X" foi evitado: o nome pode começar por "Ramo", e
  a frase ficaria errada. Tocar funciona igual aos botões da busca.
- Sem `localStorage` (aba anônima, navegador que bloqueia): tudo funciona, só
  não há atalho (`try/catch` no `last-ward.ts`).

## `RequestWard.tsx` (client): pedir ala nova

Para a presidência de uma ala ou ramo que ainda não usa o calendário.

- Cartão branco com contorno (`id="nova-ala"`): **"Sua ala ou ramo ainda não
  está aqui?"** (`h2`, `text-lg`), "A presidência pode pedir para usar o
  calendário. O pedido é conferido antes de a ala aparecer no site." e o botão
  `secundario` **"Pedir para usar o calendário"**.
- Abre um `Modal` ("Pedir para usar o calendário") com o **`WardForm
  modo="pedido"`**: a ala (ala ou ramo, nome, estado, cidade) e o **líder
  responsável** com os mesmos campos do "Criar conta" (`AccountFields`): o líder
  é sempre uma conta nova. Regras e proteções contra robô em
  [routes_api.md](routes_api.md) (`/api/alas/pedir`).
- Enviado: o título vira **"Pedido enviado!"** e aparece (`role="status"`) "O
  pedido foi enviado. Quando a ala e o acesso ao painel forem aprovados, chega
  um e-mail para **\<e-mail\>**." + "Depois, é só entrar no painel com esse
  e-mail e a senha que você escolheu." e o botão "Fechar".
- **`/#nova-ala`** abre o modal direto (efeito ao montar, com a exceção
  `react-hooks/set-state-in-effect`).
- Nada aparece no site até o owner aprovar a ala; depois ele aprova o líder no
  cartão Usuários dela (ver [routes_dashboard.md](routes_dashboard.md)).
