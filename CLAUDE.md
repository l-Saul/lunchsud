# CLAUDE.md: regras de trabalho

Regras para agentes de IA (e pessoas) trabalharem neste repositório. Leia antes
de qualquer mudança. O **como funciona** de cada parte está em [`docs/`](docs/);
a visão técnica geral, no [`README.md`](README.md).

## O que é

Agendamento de almoços para missionários (Igreja de Jesus Cristo dos Santos dos
Últimos Dias). Membros agendam por ala, **sem conta**; líderes gerenciam num painel.

**Público-alvo:** senhoras de 45 a 85 anos, com pouca familiaridade digital, no
**celular**. Toda decisão de UI prioriza: simples, textos grandes, alto
contraste, poucos passos, sem aglomerar informação.

## Documentação (obrigatório)

| Arquivo | Conteúdo |
|---|---|
| `README.md` | documentação técnica: stack, arquitetura, rotas, API, banco, env, setup, deploy |
| `CLAUDE.md` | estas regras de trabalho (lido automaticamente pelo Claude Code) |
| `docs/routes_<rota>.md` | uma rota do site por doc: o que faz, componentes, regras de negócio |
| `docs/src_<pasta>.md` | `src_app` (estrutura global e configs), `src_components`, `src_hooks`, `src_lib` |
| `docs/database.md` | `supabase/`: schema, permissões, Realtime, migrations, templates de e-mail |

### Mapa: código → doc

| Código | Doc |
|---|---|
| `src/app/(member)/page.tsx`, `src/app/(member)/_components/**` | `docs/routes_home.md` |
| `src/app/(member)/[slug]/**` | `docs/routes_slug.md` |
| `src/app/(leader)/<rota>/**` (`admin`, `acesso`, `redefinir-senha`, `dashboard`) | `docs/routes_<rota>.md` |
| `src/app/auth/confirmar/**` | `docs/routes_auth-confirmar.md` |
| `src/app/api/**` | `docs/routes_api.md` |
| `src/app/` raiz (`layout`, `globals.css`, `not-found`, `manifest`, `robots`, `sitemap`, `opengraph-image`), `src/proxy.ts`, `next.config.ts`, `eslint.config.mjs`, `postcss.config.mjs` | `docs/src_app.md` |
| `src/components/**` | `docs/src_components.md` |
| `src/hooks/**` | `docs/src_hooks.md` |
| `src/lib/**` | `docs/src_lib.md` |
| `supabase/**` | `docs/database.md` |

Sem cabeçalho, de propósito: JSON (`vercel.json`, `tsconfig.json`,
`package.json`), `next-env.d.ts` (gerado pelo Next), os templates de e-mail em
`supabase/email/` e `src/lib/server/email/aviso.html` (o HTML vai dentro de cada
e-mail), as fontes das imagens de prévia do link em `src/lib/server/og/` (TTF e
a licença, sem alteração) e as migrations temporárias. Plano ainda não
implementado, se houver, vai em `messages/` (hoje não há): não é `docs/` e pode
ser apagado à vontade, nada do site depende dele. Implementou, documente em
`docs/` e remova o plano.

Regras:

1. **Código sem comentários.** Toda explicação (por quê, regra, armadilha,
   decisão de UX) vai para o doc do arquivo. No código só ficam o cabeçalho
   abaixo e diretivas de ferramenta (`// eslint-disable-next-line …`).
2. **Todo arquivo de código começa com o cabeçalho** que aponta para as regras e
   para o doc dele:
   ```ts
   /**
    * Contexto e regras: leia CLAUDE.md e docs/routes_dashboard.md antes de alterar.
    * Mudou o comportamento? Atualize o doc na mesma mudança.
    */
   ```
   (`'use client'` vem logo depois do cabeçalho. Em CSS, `/* … */`; em SQL, `-- …`.)
3. **Docs nunca ficam soltos.** Toda mudança atualiza, **na mesma mudança**:
   - o doc da rota/módulo: comportamento, props, estados, textos da tela, regras,
     armadilhas;
   - `docs/routes_api.md` se mudou contrato, validação ou resposta de API;
   - `docs/database.md` + `supabase/schema.sql` se mudou o banco;
   - `README.md` se mudou stack, arquitetura, env, setup ou deploy;
   - `CLAUDE.md` se mudou uma regra.
4. **Arquivo novo:** cabeçalho + seção no doc (com o nome do arquivo).
   **Movido/renomeado:** atualize cabeçalho e doc. **Apagado:** tire a seção.
   **Rota ou pasta nova:** crie o doc (`docs/routes_<rota>.md`) e a linha no mapa acima.
5. Escreva o doc para quem vai mexer no código: o que faz, por quê, o que não
   pode quebrar e os textos exatos que aparecem na tela.
6. Antes de concluir, confira:
   ```bash
   # arquivos de código sem o cabeçalho
   grep -rL --exclude="*.html" --exclude-dir=og "leia CLAUDE.md" src next.config.ts eslint.config.mjs postcss.config.mjs supabase/schema.sql
   # cabeçalhos que apontam para doc inexistente
   grep -rhoE "docs/[a-z_-]+\.md" src *.ts *.mjs supabase/schema.sql | sort -u | while read d; do [ -f "$d" ] || echo "falta $d"; done
   # arquivos sem seção no doc do seu cabeçalho
   git ls-files --cached --others --exclude-standard src | while read f; do d=$(grep -oE "docs/[a-z_-]+\.md" "$f" | head -1); [ -n "$d" ] && ! grep -qF "$(basename "$f")" "$d" && echo "sem seção: $f → $d"; done
   ```

## Stack & comandos

- Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Supabase · Vercel.
- **Região:** banco no Supabase em `sa-east-1` (São Paulo) e funções da Vercel em
  `gru1` (São Paulo), fixado no `vercel.json`. Mantenha os dois juntos.
- **Supabase no plano Free:** 200 conexões Realtime simultâneas (cada página de
  ala aberta = 1), sem backup automático, projeto pausa após 7 dias sem uso.
  Projete pensando nesses limites.
- `npm run dev` · `npm run build` · `npm run lint` (= `eslint src`; **não** use
  `next lint`, foi removido no Next 16).
- Antes de concluir uma mudança, rode `npx tsc --noEmit`, `npm run lint` **e**
  `npm run build`. Hoje o lint passa **limpo (0 erros, 0 warnings)**: mantenha assim.
- **Nunca rode `npm run build` com o `npm run dev` aberto:** os dois disputam o
  diretório `.next` e corrompem o cache (erro `ENOENT … build-manifest.json`).
  Pare um antes do outro; para só checar tipos, use `npx tsc --noEmit`. Se o
  `dev` for do usuário, não o derrube: faça o build numa cópia do projeto fora
  do repositório.

## Git & branches

- **`master` = produção.** É o build que os usuários acessam (branch de produção
  na Vercel). Só recebe código pronto, vindo da `dev`.
- **`dev` = desenvolvimento.** Todo ajuste é feito aqui; trabalhe sempre nela.
- Não existe mais `main`: não recrie.
- **Proibido `git commit` e `git merge` sem pedido explícito do usuário**, em
  qualquer branch. O mesmo vale para `git push`. Por padrão, deixe as mudanças no
  working tree e diga o que foi alterado.

## Regras de negócio (CRÍTICO, não quebrar)

1. **Um almoço por dia, por ala.** Constraint única `(ala_id, data)` no Postgres;
   `/api/agendar` trata o `23505` (409). Os dias ocupados vêm do banco e são
   bloqueados no calendário.
2. **Segunda = P-day** (não agendável pelo membro). Travado em 3 lugares, todos
   via `isPday()` de `src/lib/date.ts`: `MonthCalendar.tsx` (calendário público),
   `MonthImage.tsx` (imagem do mês) e `src/app/api/agendar/route.ts` (fonte da
   verdade). O **banco não barra** segunda de propósito: o líder pode mover um
   almoço para segunda pelo painel.
3. **Janela = mês atual + seguinte, no fuso DA ALA.** Público, painel e
   `/api/agendar` usam `getDashboardRange(ala.fuso_horario)`: "hoje" e a virada
   do mês são os da ala (Manaus vira o dia 1 h depois de SP; o servidor é UTC).
   Nunca chame sem o fuso quando houver uma ala em contexto. A página pública e
   `/api/agendamentos/[slug]` **só carregam essa janela**, e `hoje`/`mesAtual`
   chegam à `WardBooking` pelo servidor: não calcule com o relógio do celular.
4. **Agendar não exige conta.** O membro abre o link da ala e marca o dia; só os
   líderes fazem login.
5. **Dia que já passou não é agendável pelo membro** (hoje em diante, no fuso da
   ala). Igual ao P-day: o calendário esmaece e, ao tocar, só mostra a mensagem;
   `/api/agendar` recusa. O líder edita qualquer data **até 2 anos antes ou
   depois de hoje** (no fuso da ala; `limitesDaEdicao`, conferido em
   `/api/agendamentos/update` e no campo de data do painel).
6. Painel mostra "X de Y dias" em cada mês, `Y = dias do mês − segundas sem
   almoço` (`diasDisponiveisNoMes(ym, datasComAlmoco)`): uma segunda para onde o
   líder moveu um almoço vira dia de almoço, e o X nunca passa do Y.
7. **Histórico = só os 3 meses anteriores** ao atual (`getHistoricoRange(3)`);
   não carregue mais que isso no painel.
8. **Só Brasil** (regra do dono, 25/10/2026). Não há país: a ala tem UF e
   cidade, e o **fuso sai da UF** (`UFS` em `src/lib/location.ts`). Sem endereço.
9. **O link (slug) de uma ala existente nunca muda.** Ele já está nos grupos
   do WhatsApp. Ala nova usa `<uf>_<cidade>_<nome>`, com `-` nos espaços
   (`pr_curitiba_sao-lourenco`, `gerarSlug`); se a regra
   mudar, vale só para as próximas. As 3 primeiras alas mantêm o formato
   antigo (`/ecoville`, `/pilarzinho`, `/sao_lourenco`).
10. **Ala pendente não é pública.** A presidência pede ala nova pela home (com a
    conta nova do líder responsável); ela nasce `pendente` e só aparece depois
    que o owner aprova, **em dois passos**: a ala (modal do owner) e depois o
    líder (cartão Usuários da ala). Tudo que lista ou abre ala filtra
    `status = 'ativa'` (ver [`docs/database.md`](docs/database.md)).

`src/lib/date.ts` é o módulo central de datas: reutilize-o, não duplique lógica
de data/fuso/P-day em componentes. Detalhes: [`docs/src_lib.md`](docs/src_lib.md).

## Convenções

- **Nomes em inglês:** pastas, arquivos, componentes e hooks (`WardBooking.tsx`,
  `use-bookings-realtime.ts`). Componentes em PascalCase; `lib/` e hooks em
  kebab-case. **Ficam em português, porque são contrato:** pastas de rota (= URL:
  `admin`, `acesso`, `dashboard`, `redefinir-senha`), rotas de API (`/api/agendar`)
  e nomes do banco (`ala`, `agendamento`). Textos da tela, sempre em português.
  (Funções internas antigas em português, como `normalizarTelefone`, ainda não
  foram traduzidas.) Docs em português.
- **Onde colocar cada coisa:** componente usado por UMA página fica na pasta dela,
  em `_components/` (o `_` faz o Next não criar rota). `src/components/` é só para
  o que 2+ páginas usam. Código só de servidor vai em `src/lib/server/` (tem
  `import 'server-only'`: se o navegador importar, o build falha). `(member)` e
  `(leader)` são grupos de rota: não aparecem na URL.
- **Ala e ramo no texto:** todo texto que junta preposição e nome de ala usa
  `comArtigo`/`artigo` de `src/lib/wards.ts` ("da Ala X", "do Ramo X", "à Ala
  X", "ao Ramo X"). Escrever "da ${nome}" à mão deixa "da Ramo X".
- **Texto para o público (tela e e-mails):** linguagem simples e curta, uma ideia
  por frase, sem termos técnicos ("acesso", "card", "notificação push",
  "usuário", "owner"). Diga **quem** fez **o quê**, **quando** e o que fazer.
  Ex.: "Rita criou uma conta de líder e pediu para usar o painel da Ala X", não
  "Novo pedido de acesso". **Curto não é vago:** não ser prolixo é não enrolar,
  não é cortar o que faz entender. "Quando alguém agenda um almoço" é curto
  demais (parece que toda mudança manda e-mail); "Quando alguém agenda um almoço
  para um dia deste mês, chega um e-mail com o nome, o dia e o telefone" é claro.
- **Cores:** use os tokens do tema (`bg-primary`, `text-secondary`, etc.),
  definidos em `src/app/globals.css`, com a paleta da Igreja: marinho `#003057`
  (`primary`), azul de ação `#006184` (`secondary`: botões, dia escolhido,
  foco), framboesa `#bd0057` (`accent`: ocupado, erro, remover, toque
  feminino), dourado `#ffb81c` (`gold`, **só enfeite**, nunca texto sobre
  claro), branco. **Não existe verde no site:** sucesso = azul + texto. Tabela
  completa em [`docs/src_app.md`](docs/src_app.md).
- **Detalhe padrão = a fitinha** framboesa → dourado → framboesa
  (`from-accent via-gold to-accent`): no topo dos cartões e, na vertical, só na
  borda esquerda dos botões das alas (pedido do dono). **Não ponha faixinha
  vertical, barrinha ou outro enfeite em nenhum outro lugar sem o dono pedir.**
- **Fontes:** Source Sans (corpo) + Source Serif (títulos) via `next/font` no layout;
  `h1/h2/h3` já recebem serifa por regra base no CSS.
- **Tamanho da letra: escala por papel** (base 16px, `html { font-size: 100% }`;
  conferida no Chromium em 24/10/2026). O dono achou 18px e a letra que crescia
  com a tela grandes demais, e 13,5px pequeno: **não mude a base**; ajuste o
  papel do texto.

  | Papel | Classe | Tamanho |
  |---|---|---|
  | Título da página (o `h1` da faixa, em toda página) | `text-3xl` (`sm:text-4xl`) | 30px (36px a partir de 640px) |
  | Título de estado dentro de um cartão ("Olá, Rita!", "Link expirado") | `text-xl` | 20px |
  | Título de cartão do painel e de modal; nome do site na faixa; nome da ala na home; a instrução da página da ala ("Toque em um dia livre…", `h2`) | `text-xl` | 20px |
  | Subtítulo de seção; instrução ("Toque na sua ala:"); mensagem de resposta; botão principal; campo de formulário; abas do mês; número do dia | `text-lg` | 18px |
  | Texto, rótulo, botão do painel, legenda, dica, erro, rodapé | `text-base` | **16px, o mínimo** |

  **Só três pesos** (padronizado em 25/10/2026, o dono via "muita mudança"):
  **400** no texto corrido; **600** (`font-semibold`) em todo destaque
  (títulos, rótulos, nomes em lista, botões, contadores, erros); **700** só nos
  números (dia do calendário e medalhão de data). Sem `font-medium` (500), a não
  ser nos estados do dia do calendário público. **Título é sempre serifa**
  (`h1`/`h2`/`h3`): bloco com título usa um `h2`/`h3` de verdade, não um `<p>`
  em negrito.
  **Nada abaixo de 16px** que precise ser lido: sem `text-sm`, `text-xs`,
  `text-[Npx]`. **Campo de formulário sempre `text-lg`**: abaixo de 16px o
  iPhone dá zoom sozinho ao tocar. Sem MAIÚSCULAS (`uppercase`) e sem itálico.
  Nome e e-mail quebram a linha (`wrap-anywhere`), nunca "…" (`truncate`).
  Mudou tela? Meça de novo (ver `docs/src_app.md`).
- **Acessibilidade:** foco visível, alvos ≥44px,
  `aria-label` em ícones, respeito a `prefers-reduced-motion`. Não reduza isso.
- **Animação = feedback, não enfeite.** Só CSS (sem biblioteca; a `framer-motion`
  saiu porque escondia a página até o JS carregar e pesava 35 KB). Use só para:
  1. **"recebi seu toque"**: `active:scale-[0.98]` (dia do calendário: `active:scale-95`);
  2. **"estou trabalhando"**: todo botão de ação, enquanto espera: `disabled` +
     `aria-busy` + `<Spinner />` + verbo ("Confirmando…", "Salvando…"). Assim
     tocar de novo não faz nada e a pessoa sabe que está indo;
  3. **"algo apareceu/mudou"**: `animate-aparecer` (fade 200 ms: mensagens, fundo
     de modal, lista que chegou) e `animate-surgir` (caixa do modal). Fechar é na hora.
  **Nunca** anime a entrada de conteúdo que vem do servidor (deixa a página em
  branco até o JS/CSS rodar), nem deslize, escalone listas, gire em 3D ou dê
  "pulinho" no hover. Movimento curto (≤250 ms) e calmo.

## Robôs, Google e prévia do link

Cada parte do site tem um público, e os robôs seguem isso (detalhes em
[`docs/src_app.md`](docs/src_app.md)):

- **Home (`/`)**: para quem quer achar ou pedir uma ala. **Indexada**, com endereço
  canônico; é a única página do `sitemap.xml`.
- **Página da ala (`/<slug>`)**: para as irmãs que agendam, pelo link do
  WhatsApp. **Nunca no Google** (`noindex, nofollow`): mostra quem recebe os
  missionários e em que dia. Os robôs **podem ler**, senão a prévia do link no
  WhatsApp não aparece; não a ponha no `Disallow`.
- **Área da liderança** (`/admin`, `/acesso`, `/dashboard`, `/redefinir-senha`,
  `/auth/`) e `/api/`: **proibidas** no `robots.txt` e com `noindex`.
- Prévia do link: imagem pelo `imagemDePrevia` (`src/lib/server/og-image.tsx`),
  textos da ala por `src/lib/share-texts.ts` (os mesmos no botão "Compartilhar"
  do painel). Endereço do site sempre por `urlPublica()`.

## Segurança (não enfraquecer)

**Princípio:** a segurança é responsabilidade nossa e **nunca pode barrar um uso
real**. A senhora tem que conseguir agendar sempre, rápido, sem bloqueio. Antes de
qualquer limite ou validação, pense no padrão de uso: muitas pessoas no mesmo IP
(Wi-Fi da igreja, 4G com IP compartilhado), celular antigo e lento, link aberto
dentro do WhatsApp, autopreenchimento do celular, conexão que cai. Proteja no
servidor e no banco (validação, constraints, permissões), não travando a pessoa.

- **Telefone: normalize, não rejeite.** `normalizarTelefone()` (`src/lib/phone.ts`)
  é a mesma no formulário e no servidor (Brasil celular/fixo, LatAm e EUA sem
  `+`, qualquer país com `+`). Campo com `inputMode="tel"`. **Sem máscara
  enquanto digita** (nem filtro de caractere): reescrever o valor a cada tecla
  joga o cursor para o fim. O campo guarda o que a pessoa escreveu e só é
  arrumado no `onBlur` (e no servidor). Detalhes: [`docs/src_lib.md`](docs/src_lib.md).
- **Preenchimento automático do celular:** todo formulário é um `<form>` de verdade
  (com `type="submit"`, para a tecla "Ir" enviar) e cada campo tem `name` +
  `autoComplete` certos: `name`, `tel`, `email`, `username` (e-mail no login),
  `current-password`/`new-password`. E-mail com `autoCapitalize="none"`, sem
  corretor, e `trim()` antes de enviar. Campo com dado de OUTRA pessoa ou da ala
  (editar agendamento, criar ala) leva `autoComplete="off"`.
- **Toda rota valida a entrada** via `src/lib/server/validation.ts` (`lerJson` +
  `parse*`): teto de tamanho de corpo, formato e charset. Não volte a ler
  `req.json()` cru nem a inserir campos sem sanear.
- **Sem limite por IP** (removido em 2026-10-24): no Wi-Fi da igreja muitas
  pessoas saem pelo mesmo IP e eram bloqueadas. Não reintroduza limite em memória.
  Se houver abuso, use regra de rate limit do Firewall da Vercel na rota.
- **Pedido de ala nova (`/api/alas/pedir`, público) é difícil para robô, não
  para a pessoa:** campo-armadilha escondido, tempo mínimo de 5 s no
  formulário, no máximo 10 alas pendentes ao mesmo tempo e nada público antes
  da aprovação do owner. Não acrescente captcha nem pergunta à pessoa sem o
  dono pedir. Detalhes em [`docs/routes_api.md`](docs/routes_api.md).
- Rotas **nunca** ecoam `error.message` do banco. Em `/api/agendar` as mensagens
  aparecem na tela do membro: escreva para ele.
- SQL injection: mitigado pelo query builder do Supabase (parametrizado). Não
  introduza SQL cru/`.rpc` com concatenação de string.
- **Permissões do banco:** `anon` e `authenticated` só leem `id, ala_id, data,
  nome` de `agendamento`; `telefone`, as outras tabelas e toda escrita são só do
  service-role. O cadastro de líder é aberto: nunca dê a `authenticated` mais que
  a `anon`. **Tabela nova** nasce sem acesso para o navegador; **função nova** em
  `public` precisa de `revoke execute … from public, anon, authenticated`.
- **POST de outro site é recusado** nas rotas que leem sessão (as do `matcher`
  do `src/proxy.ts`): `Sec-Fetch-Site` diferente de `same-origin` ou `Origin`
  que não é o próprio endereço → 403. É a segunda trava, além do cookie
  `SameSite=Lax`. Sem `Origin` passa (não é navegador, não leva cookie de
  ninguém). As rotas públicas sem sessão (`/api/agendar`) ficam fora: lá não
  há o que proteger e o risco seria barrar a senhora.
- `target="_blank"` sempre com `rel="noopener noreferrer"`.

## Autenticação e papéis

- Login por **e-mail + senha** no Supabase Auth (`@supabase/ssr`), sessão em
  cookies. O `src/proxy.ts` renova o token **só nas rotas do líder** (`matcher`):
  **rota nova que leia sessão precisa entrar no matcher**. **Nunca** reintroduza
  JWT/bcrypt próprios.
- **Cadastro sem confirmação de e-mail** ("Confirm email" desligado no Supabase):
  quem libera o painel é a aprovação de outro líder. O Supabase Auth manda os
  e-mails (nova senha, convite) pelo **SMTP próprio**, com os templates de
  `supabase/email/`. A tela de nova senha é `/redefinir-senha`, aberta pelo link
  do e-mail via `/auth/confirmar`; sem sessão ela mostra "Link expirado".
- Contexto em `src/lib/server/session.ts`: `getContexto()`/`requireAcesso()`
  resolvem papel + ala em foco; `podeEditarAla()` autoriza ações por ala.
- **owner** (`perfil.is_owner`): todas as alas; aprova/remove usuários, cria alas
  e troca a ala em foco (cookie `ala_atual`). **member**: uma ala só (vínculo
  aprovado). Sem ala aprovada → `/acesso`.
- O **slug** é gerado por `gerarSlug(uf, cidade, nome)` (`pr_curitiba_sao-lourenco`):
  não invente outro formato, e **nunca mude o slug de uma ala que já existe**
  (regra de negócio 9).
- **O `.env` local aponta para o banco de produção:** agendar no `npm run dev`
  grava de verdade e aparece ao vivo para os líderes. **A ala de teste** (criada
  pelo dono em 25/10/2026) é a **"Ala Teste Aprovação"**
  (`/pr_curitiba_teste_aprovacao`, em SP / São Paulo; o link ficou com o
  estado antigo porque link não muda), com o líder
  `lider.teste.lunchsud@example.com` (senha com o dono). Ela é ativa e aparece
  na busca da home. Teste que grava vai **só nela** (ou em contas
  `…lunchsud@example.com` criadas e apagadas no teste), e o que for criado é
  apagado no fim. Em qualquer outra ala, só com o usuário ciente e com o SQL de
  limpeza.

## Avisos por e-mail (Gmail + Vercel Cron)

Regras completas em [`docs/src_lib.md`](docs/src_lib.md) ("Avisos por e-mail").

- **A notificação é sempre usuário + ala.** O card Notificações vale só para a
  ala em foco, as preferências são por `(user_id, ala_id)` e quem recebe é quem
  ligou o aviso naquela ala e ainda tem acesso a ela. **Nada no painel do líder é
  pensado para o owner**: o owner é só o dono do sistema; para ele, cada ala
  funciona igual à de qualquer líder.
- **Tudo vem desligado**: o líder escolhe o que quer receber.
- **Só avisa o que o líder não fez.** Novo almoço (alguém agendou para um dia
  do mês atual) avisa; editar ou remover almoço não, porque é o próprio líder
  quem faz.
- **O que nasce de uma ação sai na hora; o que depende de olhar o calendário sai
  no cron das 8h** (`/api/cron/avisos`, `0 11 * * *` UTC no `vercel.json`).
- **Os avisos só informam**, como notificação: **sem botão, sem link, sem
  anexo**; telefone em texto comum. Exceção: os e-mails de pedido (o pedido
  para usar o painel, o "Pedido aprovado" e o "Pedido de nova ala") têm um
  botão para o painel.
- **"Pedido de nova ala" vai sempre a todos os owners**, sem preferência: é do
  dono do sistema (a ala ainda não existe para ninguém ligar aviso).
- **Um aviso por assunto.** "Almoços do mês seguinte" (um dia antes do fim do
  mês) já avisa que o mês seguinte pode ser agendado; não há outro no dia 1.
- **O modelo (layout) do e-mail fica em `src/lib/server/email/aviso.html`**; o
  código só preenche os marcadores `{{…}}` e mantém ou tira os blocos
  `<!--botao-->`/`<!--parar-->`. Mudar o visual = editar esse arquivo. Se ele
  faltar, o `next.config.ts` para o build com "Falta o modelo dos avisos por
  e-mail".
- **E-mail nunca segura nem desfaz uma ação:** dentro de rota, envie em
  `after()` (`next/server`); falha no envio só vai para o log. A senhora que
  agenda nunca espera e-mail.
- **Nunca mande e-mail a líder real fora de produção.** O `mailer.ts` só envia ao
  destinatário real com `VERCEL_ENV === 'production'`; fora dela tudo vai para
  `EMAIL_TESTE_PARA` (sem ela, nada sai) e o cron não grava em `email_envio`.
  Não enfraqueça essa trava: o banco local é o de produção.
- O cron roda em **UTC**: "hoje" sempre por `getDashboardRange(ala.fuso_horario)`,
  nunca `new Date()` puro. Rodar de novo no mesmo dia não pode repetir e-mail
  (`email_envio`).
- `CRON_SECRET` fecha a rota do cron: sem a variável, recusa tudo.
- Texto dos e-mails: formal, sem "você", letra grande (corpo 20px, botão 22px,
  nada abaixo de 16px), uma ação por e-mail, nome da ala no assunto, datas por
  extenso, tudo do usuário escapado, mesmo visual de `supabase/email/`. Sem a
  imagem do calendário (ainda não é gerada no servidor), o mês vai em lista.

## Banco

`supabase/schema.sql` é a fonte da verdade. Mudou o banco? Atualize o schema e
escreva o SQL da mudança em `supabase/migrations/AAAAMMDDHHMMSS_nome.sql`.
**Quem roda no SQL Editor é o usuário**; depois de aplicada, ele pede para apagar
o arquivo. Nunca coloque SMTP em migration. Tudo em [`docs/database.md`](docs/database.md).

## Armadilhas

- **Imagem do mês** (`MonthImage`): **estilos inline + SVG** de propósito, para o
  `html-to-image` renderizar igual em qualquer aparelho. Não troque por classes
  Tailwind nem por emojis. Grade com `repeat(7, minmax(0, 1fr))`.
- **Nome/telefone vêm do usuário:** qualquer texto exibido precisa aguentar 80
  caracteres sem espaço (`wrap-anywhere` ou `truncate`). Telefone internacional
  é mais longo que o brasileiro.
- **Tela estreita + letra grande** (senhoras aumentam a fonte do sistema): o
  calendário usa container query em `rem` (`@max-[15rem]`), e fileiras de botões
  usam `flex-wrap` com `basis` em rem para empilhar. Teste em 320px com fonte
  130% antes de mudar layout.
- **Fundo claro + faixa azul:** o `body` é creme (`bg-cream`) e o "céu" azul
  é só a faixa do cabeçalho, o componente `HeaderBand` (utilitário `bg-band` do
  `globals.css`). **Toda página começa com ele, igual:** o **título da
  página** (o único `h1`) com a flor embaixo, e nada mais (nem botão, nem
  subtítulo). O ícone de Cristo fica no **rodapé** (azul), levando ao site
  oficial da Igreja. O
  conteúdo vai num `<main>` abaixo, em texto escuro; cartão não repete título
  nem flor. Mensagens, avisos e confirmações ficam sempre no
  claro. Dentro da faixa o foco é dourado (`--focus-color`): o azul de ação
  some sobre o azul. Cartão sobre o creme: `bg-background` +
  `ring-1 ring-primary/10` + sombra leve.
- **Todo modal usa o componente `Modal`** (`src/components/Modal.tsx`); tela
  por cima sem diálogo (como o `LoadingOverlay`) usa o hook `useModalLayer`.
  Eles dão, sempre: **fundo desfocado** (`bg-primary/50` + `backdrop-blur-sm`),
  **página atrás travada** (`useScrollLock`; o iOS ignora `overflow: hidden`),
  **fundo inerte** (teclado e leitor de tela não saem do modal), **foco que
  entra** no modal e **volta** ao botão que abriu, fechar por toque fora / Esc /
  botão. Nunca refaça isso à mão. Na confirmação, o foco começa na opção segura
  (`data-foco-inicial`). Confirmação de remover ou desligar em modal próprio ou
  inline (não `window.confirm`), alvos ≥48px e cor **rosa** (`accent`), não
  vermelho.
- **Botão de ação: sempre `botao(tipo, tamanho)`** de
  `src/components/button-classes.ts` (primário azul, secundário com contorno,
  perigo framboesa (também no "Fechar" da confirmação do agendamento),
  dourado só no "Sair" e no botão flutuante do owner;
  `normal` 48px no painel, `grande` 52px nas páginas públicas). Quem chama só acrescenta layout. Botão novo
  "do jeito dele" sai do padrão: não faça.
- **Campo: sempre o padrão** de `src/components/field-classes.ts` (`campo(erro)`
  e `rotulo`), `SelectField` para lista de escolha e `PasswordField` para senha.
  Campo novo "do jeito dele" sai do padrão: não faça.
- **Um componente só para cada coisa de ala e de conta** (regra do dono: "uma
  mudança ajusta tudo"): **`WardFilter`** para escolher ala (home, troca do
  owner, `/acesso`; muda só o que o toque final faz), **`WardForm`** para
  criar ou pedir ala, **`AccountFields`** para os campos de conta (login e
  líder do pedido). Não duplique esses formulários numa página.
- **Erro na tela:** o geral de um formulário ou ação vai no `ErrorMessage`
  (caixa rosa-claro com ícone, `role="alert"`) e diz o que fazer ("…e toque em
  Confirmar almoço de novo"). Erro de campo fica embaixo do campo, ligado por
  `aria-describedby`, sem `role="alert"` (um alerta por vez), e o foco vai para
  o primeiro campo errado. **Nunca `alert()`.**
- **Aviso na tela (toast):** sempre o `NoticeBar` (`src/components/`), **no
  topo**, com o mesmo visual. O que **confirma** uma ação ("Link copiado!")
  some sozinho em 3 s; o que **explica** algo (dia ocupado, P-day, erro) fica
  até a pessoa tocar no X. Ele fica por cima da página: não abra espaço para ele.
- `prefers-reduced-motion`: zera animações, **menos o spinner**, que gira
  devagar (parado, a pessoa acha que travou).
- **iCloud:** o repositório local fica numa pasta sincronizada pelo iCloud. Ele
  já devolveu arquivos apagados (os nomes antigos de antes da reorganização).
  Antes de concluir, confira o `git status`: arquivos `??` com nomes antigos ou
  cópias "`* 2`" vêm do iCloud; compare com o git antes de tirar.
- **macOS é case-insensitive:** ao renomear arquivos só mudando maiúsculas, use
  `git mv -f` e atualize os imports (o build na Vercel/Linux é case-sensitive).
- Variáveis de ambiente: ver README. **Não há `AUTH_SECRET`**: a sessão é do
  Supabase Auth. O login depende, no Supabase, do provider **Email** ligado e das
  **Site URL / Redirect URLs** corretas.
