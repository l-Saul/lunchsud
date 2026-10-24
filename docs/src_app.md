# Estrutura global do app

O que vale para todas as páginas: organização das rotas, layout raiz, tema e CSS
global, 404, manifest, robots, `proxy.ts` e os arquivos de configuração.

## Organização das rotas

```
src/app/
  (member)/          sem login: home e página da ala
  (leader)/          área do líder: admin, acesso, redefinir-senha, dashboard
  api/               rotas de API (URLs em português = contrato)
  auth/confirmar/    link dos e-mails do Supabase Auth
  layout.tsx · globals.css · not-found.tsx · manifest.ts · robots.ts
src/proxy.ts         renova a sessão nas rotas do líder
```

- `(member)` e `(leader)` são **grupos de rota**: os parênteses fazem o Next
  ignorar o nome na URL. Só separam as duas áreas na árvore (`/admin`, não
  `/(leader)/admin`).
- `_components/` dentro de uma rota é **pasta privada**: o `_` faz o Next não
  criar rota. Componente de uma página só fica ali; o que 2+ páginas usam vai
  para `src/components/`.
- Pastas de rota e de API ficam **em português** (são URLs); o resto, em inglês.

## `layout.tsx`: layout raiz

- **Fontes** (`next/font/google`): Source Sans 3 (corpo) e Source Serif 4
  (títulos), a família tipográfica oficial da Igreja. Viram as variáveis
  `--font-source-sans` e `--font-source-serif` no `<html>`, usadas pelo tema.
  `display: swap`.
- **Metadata padrão** do site:
  - `metadataBase: https://lunchsud.vercel.app`; nome "Almoço dos Missionários";
  - título com template `"%s · Almoço dos Missionários"` (páginas que querem a
    aba curta usam `title: { absolute }`);
  - descrição, palavras-chave, Open Graph (`pt_BR`, imagem `lunchsud512x512.png`);
  - ícones `lunchsud32x32.png`, `lunchsud512x512.png` e Apple `lunchsud180x180.png`;
  - `appleWebApp` (título "Almoço"), `manifest: /manifest.webmanifest`;
  - `formatDetection.telephone: false`: o iPhone não transforma números em link
    sozinho (o painel mostra telefones e controla isso).
- **Viewport**: `themeColor #003057` (barra do navegador marinho, emendando na
  faixa azul), `colorScheme: 'only light'` (vira `<meta name="color-scheme">`;
  ver abaixo), largura do aparelho.
- `<html lang="pt-BR">`. `<body>` em coluna com `min-h-screen`: o conteúdo fica
  num `flex-1` e o **`Footer`** vai para o fim, em todas as páginas.
- `body` com **fundo creme** (`bg-cream`) e texto escuro (`text-text`). O azul é
  só a faixa do cabeçalho de cada página (`HeaderBand`, ver
  [src_components.md](src_components.md)).

## `globals.css`: tema e CSS global

### Tokens do tema (`@theme`, Tailwind 4)

Paleta da Igreja (valores do site oficial, `churchofjesuschrist.org`); só
`cream` e `accent-soft` são tons de apoio, clareados para fundo.

| Token | Cor | Uso | Contraste |
|---|---|---|---|
| `primary` | `#003057` marinho | textos do calendário, medalhões, fundo de modal e de aviso | branco sobre ele 13,46:1 |
| `secondary` | `#006184` azul de ação | botões, dia escolhido, links, foco, interruptor ligado, "Salvo." | branco sobre ele 6,90:1 |
| `accent` | `#bd0057` framboesa | dia ocupado, remover, erros, fitinha, toque feminino | sobre branco 6,36:1 |
| `accent-soft` | `#fdecf1` rosa-claro | fundo de destaque suave (dia ocupado, caixa de erro) | framboesa sobre ele 5,59:1 |
| `accent-on-dark` | `#fda1b2` rosa | texto rosa **sobre o azul** (o framboesa some ali). Hoje sem uso: avisos ficam no claro | sobre a faixa ≥ 5,5:1 |
| `gold` | `#ffb81c` dourado | **só enfeite**: fitinha, divisórias, miolo da flor; e o foco dentro da faixa azul | sobre a faixa ≥ 6:1; sobre branco 1,7:1 (nunca texto no claro) |
| `cream` | `#faf7f5` creme | fundo de todas as páginas (`body`) | texto secundário sobre ele 6,83:1 |
| `background` | `#ffffff` | cartões | — |
| `text` | `#212225` | texto principal | sobre branco 15,91:1 |
| `muted` | `#53575b` | texto secundário | sobre branco 7,29:1 |
| `faded` | `#676b6e` | cinza "apagado" que ainda se lê: dia que já passou, placeholder | sobre branco 5,38:1 |

**Não existe verde no site** (o verde-água antigo, `#1fb9a0`, dava 2,46:1 com
texto branco). Sucesso = azul + texto. O rosa não é cor de botão de confirmar:
ele já diz "ocupado", "erro" e "remover".

Use os tokens (`bg-primary`, `text-secondary`…), não hex solto. Exceções que
**precisam** de hex: a imagem do mês e a `Flower` (capturadas pelo
`html-to-image`) e os e-mails (estilos inline).
`--font-sans` e `--font-serif` apontam para as fontes do layout, com fallbacks.

### Animações (`--animate-aparecer`, `--animate-surgir`)

Movimento **só com função** (avisar que algo apareceu), curto e sem deslocar:

- `animate-aparecer`: fade de 200 ms. Mensagens, fundo de modal, lista que acabou de chegar.
- `animate-surgir`: 200 ms, opacidade + escala de 97% para 100%. A caixa do modal "vem para a frente".

**Nunca** em conteúdo que vem do servidor: esconderia a página até o CSS rodar.
Regras completas de animação no `CLAUDE.md`.

### Base

- **Tamanho da letra:** `html { font-size: 100% }` (**16px**, em % para
  respeitar o zoom e o tamanho de letra do sistema), igual no celular e no
  computador. `scroll-behavior: smooth`.

  **Escala por papel** (o que vale é o papel do texto, não a tela):

  | Papel | Classe | Tamanho |
  |---|---|---|
  | Título da página pública (home, ala) | `text-3xl` | 30px |
  | Título de página com cartão (login, acesso, nova senha, 404, erro) e do painel | `text-2xl` | 24px |
  | Título de cartão do painel e de modal; nome do site na faixa; nome da ala na home | `text-xl` | 20px |
  | Subtítulo de seção; instrução principal ("Toque em…"); mensagem de resposta; botão principal; campo de formulário; abas do mês; número do dia | `text-lg` | 18px |
  | Texto, rótulo, botão do painel, legenda, dica, erro, rodapé | `text-base` | **16px, o mínimo** |

  Histórico (24/10/2026): 18px fixo e a letra que crescia com a tela (até
  22px) ficaram grandes demais para o dono; reduzir tudo junto (base 15,4px)
  deixou legenda, rodapé e erros com 13,5px. A medição no Chromium mostrou o
  problema: títulos grandes demais e textos pequenos demais ao mesmo tempo. A
  saída foi a base 16px com a escala acima: títulos e instruções diminuíram,
  textos pequenos subiram para 16px.

  **Como medir de novo:** Playwright/Chromium a 390×844, percorrendo cada
  tela (inclusive modais e mensagens) e listando `getComputedStyle().fontSize`
  de todo texto visível, agrupado pelo papel (título, botão, rótulo, campo,
  erro, rodapé). Nada pode sair abaixo de 16px.
- `scroll-padding-top: var(--altura-aviso, 0px)`: com um aviso do `NoticeBar`
  no topo, o elemento com foco do teclado rola para baixo dele, nunca fica
  escondido (a variável é gravada pelo próprio `NoticeBar`).
- `h1, h2, h3` com serifa (estética serena, como o site da Igreja).
- `body`: suavização de fonte e `text-rendering: optimizeLegibility`.
- `html { color-scheme: only light }` (e a meta do layout): o site é só claro.
  Sem isso, o modo escuro forçado do Chrome/Samsung Internet pode inverter as
  cores e estragar o contraste medido.
- `:focus-visible`: contorno de 3px com afastamento de 2px na cor
  `var(--focus-color, var(--color-secondary))`: **azul** no fundo claro
  (6,90:1); a `HeaderBand` troca `--focus-color` para **dourado**, porque o azul
  some sobre o azul (1,89:1). Componente que precise de outra cor de foco muda
  a variável, não o `outline`.

- `::placeholder`: cor `faded` (5,38:1) e `opacity: 1` em todo campo. O
  cinza padrão do navegador (e o `muted/60` de antes, ~2,8:1) não passava no
  contraste.

### `bg-pday`: o dia de P-day

Utilitário próprio: fundo cinza `#eff0f0` com listrinhas diagonais `#e0e2e2`.
É o segundo sinal do P-day no calendário (não depende só da cor) e entra
também no quadradinho da legenda.

### `bg-band`: o "céu" da faixa do cabeçalho

Utilitário próprio (`@utility bg-band`), usado só pela `HeaderBand`: gradiente
marinho (`#0b3a66` → `#003057` → `#00284a`) com duas "auroras" estáticas em
`radial-gradient`, luz dourada no alto e rosa à direita (as cores de `gold` e
da `Flower`). **Sem verde.** O `background-color` é o `primary`, para o caso de
o gradiente não carregar.

### `prefers-reduced-motion`

Quem pede menos movimento no sistema: animações e transições zeradas
(0,01 ms) e rolagem sem suavização. **Exceção: `.animate-spin`** continua
girando, devagar (1,5 s, infinito). O spinner é o aviso de "carregando", não
enfeite: parado, a pessoa acha que travou e toca de novo.

### `.scrollbar-mobile`

Barra de rolagem fina até 767px (Firefox `scrollbar-width: thin`; Chrome/Safari
6px, polegar cinza translúcido). **Hoje nenhum componente usa a classe.**

## `not-found.tsx`: 404 do site

Na prática, link de ala digitado errado ou de uma ala que não existe mais. Em
vez da tela padrão do Next (em inglês), um cartão calmo leva à lista de alas da
home, onde a pessoa acha a sua com um toque:

- `<HeaderBand />` no topo e o cartão num `<main>` sobre o creme.
- Título: **"Não encontramos essa página"**
- Texto: "Confira o link que você recebeu ou escolha a sua ala na lista."
- Botão **"Ver as alas"** → `/`.

Também é usado pelo `notFound()` da página da ala (slug inexistente).

## `manifest.ts`

Web App Manifest (`/manifest.webmanifest`): nome "Almoço dos Missionários",
nome curto "Almoço", `pt-BR`, `start_url: /`, `display: standalone`, fundo e
tema `#003057`, ícones 512 e 1024.

## `robots.ts`

`/robots.txt`: permite tudo, menos `/admin`, `/dashboard` e `/api/` (áreas
administrativas não devem ser indexadas). `host: https://lunchsud.vercel.app`.
As demais páginas do líder (`/acesso`, `/redefinir-senha`) e a ala inexistente
usam `robots: noindex` na própria metadata.

## `src/proxy.ts`

No Next 16 a convenção do "middleware" passou a se chamar **`proxy`** (mesma
função: roda antes da requisição). Aqui ela **renova a sessão do Supabase Auth**
(padrão do `@supabase/ssr`):

1. Cria um `createServerClient` que lê os cookies da requisição e, no `setAll`,
   grava os cookies novos na requisição e na resposta.
2. Chama `supabase.auth.getUser()`. **É essa chamada que dispara a renovação do token.**
3. Devolve a resposta com os cookies atualizados.

### `matcher`: só as rotas do líder

```
/dashboard/:path*  /admin/:path*  /acesso/:path*  /redefinir-senha/:path*  /auth/:path*
/api/acesso/:path*  /api/agendamentos/update  /api/agendamentos/delete
/api/ala-atual  /api/alas/criar  /api/avisos/:path*
```

O caminho do membro (home, calendário da ala, `/api/agendar`,
`/api/agendamentos/[slug]`, `/api/alas`) **não tem login**, então vai direto para
a rota, sem esse passo extra. O cron (`/api/cron/avisos`) também fica fora: não
tem sessão, é protegido pelo `CRON_SECRET`. **Rota nova que use sessão
(`getUsuario`/`getContexto`) precisa entrar no matcher.**

## Configuração

### `next.config.ts`

- `reactStrictMode: true`.
- **Modelo dos avisos por e-mail** (`MODELO_EMAIL` =
  `./src/lib/server/email/aviso.html`): se o arquivo não existir, a config lança
  "Falta o modelo dos avisos por e-mail" e o build (e o `dev`) para. E
  `outputFileTracingIncludes` leva o arquivo junto em todas as rotas `/api/**`:
  ele é lido do disco em tempo de execução e, sem isso, poderia ficar fora do
  pacote das funções na Vercel. Ver [src_lib.md](src_lib.md).
- **Headers de segurança** em todas as respostas (`/:path*`):

| Header | Valor | Por quê |
|---|---|---|
| `X-Content-Type-Options` | `nosniff` | impede o navegador de "adivinhar" o tipo do conteúdo |
| `X-Frame-Options` | `DENY` | bloqueia o site dentro de `<iframe>` de terceiros (clickjacking) |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | não vaza a URL completa para outros domínios |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | desliga APIs sensíveis que o app não usa |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | força HTTPS por 2 anos (a Vercel já serve HTTPS) |

**CSP ficou de fora de propósito**: o app usa estilos inline (imagem do
calendário) e fontes, que uma CSP malfeita quebraria. Adicionar depois, com
cuidado e testando.

### `eslint.config.mjs`

Configs `core-web-vitals` e `typescript` do `eslint-config-next`, e
`globalIgnores` repetindo os ignores padrão (`.next/**`, `out/**`, `build/**`,
`next-env.d.ts`), que a config própria substitui. `npm run lint` = `eslint src`
(o `next lint` saiu no Next 16). Hoje passa limpo: 0 erros, 0 avisos.

### `postcss.config.mjs`

Só o plugin `@tailwindcss/postcss` (Tailwind 4: o tema fica no `globals.css`,
sem `tailwind.config`).

### `vercel.json`

`"regions": ["gru1"]`: as funções rodam em **São Paulo**, junto do banco
(Supabase `sa-east-1`). Com a função nos EUA, cada consulta cruzava o continente
(~1 s por página). Mantenha os dois juntos.

`"crons"`: um **Vercel Cron** por dia, `"0 11 * * *"` em `/api/cron/avisos`
(lembretes e resumos por e-mail). O horário do cron é **UTC**: 11:00 UTC = 08:00
em São Paulo (o Brasil não tem horário de verão). No plano Hobby a Vercel roda
o cron uma vez por dia e pode atrasar até ~1 hora. A Vercel chama a rota com
`Authorization: Bearer <CRON_SECRET>`; a variável precisa existir no projeto.
Ver [routes_api.md](routes_api.md).

### `tsconfig.json`

`strict`, `moduleResolution: bundler`, `jsx: react-jsx` e o atalho
**`@/*` → `src/*`** (`import { isPday } from '@/lib/date'`).
