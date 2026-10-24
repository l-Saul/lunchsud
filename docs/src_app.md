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
- **Viewport**: `themeColor #143157` (barra do navegador azul), largura do aparelho.
- `<html lang="pt-BR">`. `<body>` em coluna com `min-h-screen`: o conteúdo fica
  num `flex-1` e o **`Footer`** vai para o fim, em todas as páginas.
- O `bg-primary` do `body` vira a cor do canvas (aparece, por exemplo, quando o
  iPhone "estica" a rolagem); o céu é desenhado por cima, em `body::before/::after`.

## `globals.css`: tema e CSS global

### Tokens do tema (`@theme`, Tailwind 4)

| Token | Cor | Uso |
|---|---|---|
| `primary` | `#143157` azul | céu, textos do calendário, medalhões |
| `secondary` | `#1fb9a0` verde | ação: botões, dia selecionado, foco, sucesso |
| `accent` | `#e0588f` rosa | dia ocupado, remover, mensagens de erro, detalhes femininos |
| `background` | `#ffffff` | cartões |
| `text` | `#0f172a` | texto principal |
| `muted` | `#64748b` | texto secundário |

Use os tokens (`bg-primary`, `text-secondary`…), não hex solto. Exceções que
**precisam** de hex: a imagem do mês e a `Flower` (capturadas pelo `html-to-image`).
`--font-sans` e `--font-serif` apontam para as fontes do layout, com fallbacks.

### Animações (`--animate-aparecer`, `--animate-surgir`)

Movimento **só com função** (avisar que algo apareceu), curto e sem deslocar:

- `animate-aparecer`: fade de 200 ms. Mensagens, fundo de modal, lista que acabou de chegar.
- `animate-surgir`: 200 ms, opacidade + escala de 97% para 100%. A caixa do modal "vem para a frente".

**Nunca** em conteúdo que vem do servidor: esconderia a página até o CSS rodar.
Regras completas de animação no `CLAUDE.md`.

### Base

- `html { font-size: 112.5% }` (~18px): base maior para leitura confortável no
  celular. Em **%** para respeitar o zoom e o tamanho de letra do sistema.
  `scroll-behavior: smooth`.
- `h1, h2, h3` com serifa (estética serena, como o site da Igreja).
- `body`: suavização de fonte e `text-rendering: optimizeLegibility`.
- **Fundo celestial**, em duas camadas fixas atrás de tudo (não pesam na rolagem
  do celular):
  - `body::before` (`z-index: -2`): gradiente azul profundo, de `#1c3e6e` a `#0d1f3a`;
  - `body::after` (`z-index: -1`): "auroras" estáticas em `radial-gradient`: luz
    dourada no alto, verde à esquerda, rosa à direita.

  As páginas usam fundo **transparente** de propósito para o céu aparecer. **Não
  ponha `bg-primary` em `main`/`section`.**
- `:focus-visible`: contorno verde de 3px com afastamento de 2px. Foco bem
  visível para teclado e baixa visão.

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

- Título: **"Não encontramos essa página"**
- Texto: "Confira o link que você recebeu ou escolha a sua ala na lista."
- Botão **"Ver as alas"** → `/`.

Também é usado pelo `notFound()` da página da ala (slug inexistente).

## `manifest.ts`

Web App Manifest (`/manifest.webmanifest`): nome "Almoço dos Missionários",
nome curto "Almoço", `pt-BR`, `start_url: /`, `display: standalone`, fundo e
tema `#143157`, ícones 512 e 1024.

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
- `outputFileTracingIncludes`: `"/api/**"` leva junto `./messages/email/**/*`.
  O modelo dos avisos por e-mail (`messages/email/aviso.html`) é lido do disco
  em tempo de execução; sem isso ele poderia ficar fora do pacote das funções na
  Vercel. Ver [src_lib.md](src_lib.md).
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
