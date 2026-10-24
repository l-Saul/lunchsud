# CLAUDE.md — contexto do projeto

Guia para agentes de IA trabalharem neste repositório. Leia antes de alterar
calendário, datas ou a API de agendamento.

## O que é

Agendamento de almoços para missionários (Igreja de Jesus Cristo dos Santos dos
Últimos Dias). Membros agendam por ala; líderes gerenciam num painel.

**Público-alvo:** senhoras com pouca familiaridade digital, no **celular**.
Toda decisão de UI prioriza: simples, textos grandes, alto contraste, poucos
passos, sem aglomerar informação.

## Stack & comandos

- Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Supabase · Vercel
- **Região:** banco no Supabase em `sa-east-1` (São Paulo) e funções da Vercel em
  `gru1` (São Paulo), fixado no `vercel.json`. Mantenha os dois juntos: com a
  função nos EUA cada consulta cruzava o continente (~1 s por página).
- **Supabase no plano Free:** 200 conexões Realtime simultâneas (cada página de
  ala aberta = 1), sem backup automático, projeto pausa após 7 dias sem uso.
  Projete pensando nesses limites.
- `npm run dev` · `npm run build` · `npm run lint` (= `eslint src`; **não** use
  `next lint`, foi removido no Next 16).
- Antes de concluir uma mudança, rode `npx tsc --noEmit` **e** `npm run build`.
  Hoje `eslint src` passa **limpo (0 erros, 0 warnings)** — mantenha assim.
- **Nunca rode `npm run build` com o `npm run dev` aberto:** os dois disputam o
  diretório `.next` e corrompem o cache (erro `ENOENT … build-manifest.json`).
  Pare um antes do outro; para só checar tipos, use `npx tsc --noEmit`.

## Git & branches (regras de funcionamento)

- **`master` = produção.** É o build que os usuários acessam (branch de produção
  na Vercel). Só recebe código pronto, vindo da `dev`.
- **`dev` = desenvolvimento.** Todo ajuste é feito aqui; trabalhe sempre nela.
- Não existe mais `main` — não recrie.
- **Proibido `git commit` e `git merge` sem pedido explícito do usuário**, em
  qualquer branch. O mesmo vale para `git push`. Por padrão, deixe as mudanças no
  working tree e diga o que foi alterado.

## Regras de negócio (CRÍTICO — não quebrar)

1. **Um almoço por dia, por ala.** Garantido por constraint única no Postgres;
   a API trata o erro `23505` em `src/app/api/agendar/route.ts`. Os dias ocupados
   vêm do banco e são bloqueados no calendário.
2. **Segunda = P-day** (não agendável pelo membro). Travado em 3 lugares, todos via
   `isPday()` de `src/lib/date.ts`:
   - `src/components/Calendar.tsx` (calendário público)
   - `src/components/CalendarMonthView.tsx` (imagem gerada)
   - `src/app/api/agendar/route.ts` (backend, fonte da verdade)
   O **banco não barra** segunda de propósito: o líder pode mover um almoço para
   segunda pelo painel (`/api/agendamentos/update`).
3. **Janela = mês atual + seguinte, no fuso DA ALA.** Público, painel e
   `/api/agendar` usam `getDashboardRange(ala.fuso_horario)` — "hoje" e a virada do
   mês são os da ala (Manaus vira o dia 1h depois de SP; o servidor é UTC). Nunca
   chame sem o fuso quando houver uma ala em contexto. A página
   pública e `/api/agendamentos/[slug]` **só carregam essa janela**
   (`src/lib/ala-publica.ts`), e o mês base chega à `ClientPage` pela prop
   `mesAtual` — não calcule o mês com o relógio do celular.
4. **Agendar não exige conta.** O membro (público idoso) abre o link da ala e
   marca o dia; só os líderes fazem login.
5. **Dia que já passou não é agendável pelo membro** (hoje em diante, fuso de
   SP). Igual ao P-day: o `Calendar` esmaece o dia e, ao tocar, só mostra a
   mensagem embaixo (não abre o agendamento); `/api/agendar` recusa. O `hoje`
   chega à `ClientPage` pela prop vinda do servidor. O líder edita qualquer data.
6. Painel mostra "X de Y dias agendados", `Y = dias do mês − segundas`
   (`diasDisponiveisNoMes`).
7. **Histórico = só os 3 meses anteriores** ao atual (`getHistoricoRange(3)`);
   não carregue mais que isso no painel.

`src/lib/date.ts` é o módulo central de datas — reutilize-o, não duplique lógica
de data/fuso/P-day em componentes.

## Convenções

- **Nomes de arquivo:** componentes em PascalCase (`Calendar.tsx`); utilitários
  de `lib/` e hooks em kebab-case (`date.ts`, `use-ocupados-realtime.ts`).
  Mantenha o padrão.
- **Idioma:** termos de domínio em português (`alas`, `agendar`, `agendamento`,
  `usuarios`). **Nunca** renomeie pastas de rota da API — são contrato público/URLs.
- **Cores:** use os tokens do tema (`bg-primary`, `text-secondary`, etc.),
  definidos em `src/app/globals.css`. Azul `#143157` / verde `#1fb9a0` / branco.
- **Fontes:** Source Sans (corpo) + Source Serif (títulos) via `next/font` no layout;
  `h1/h2/h3` já recebem serifa por regra base no CSS.
- **Acessibilidade:** texto grande (base ~18px), foco visível, alvos ≥44px,
  `aria-label` em ícones, respeito a `prefers-reduced-motion`. Não reduza isso.
- **Animação = feedback, não enfeite.** Só CSS (sem biblioteca; a `framer-motion`
  saiu porque escondia a página até o JS carregar e pesava 35 KB). Use só para:
  1. **"recebi seu toque"** — `active:scale-[0.98]` (dia do calendário: `active:scale-95`);
  2. **"estou trabalhando"** — todo botão de ação, enquanto espera: `disabled` +
     `aria-busy` + `<Spinner />` (`src/components/Spinner.tsx`) + verbo
     ("Confirmando…", "Salvando…"). Assim tocar de novo não faz nada e a pessoa sabe
     que está indo;
  3. **"algo apareceu/mudou"** — `animate-aparecer` (fade 200 ms: mensagens, fundo
     de modal, lista que chegou) e `animate-surgir` (caixa do modal), no `@theme`
     do `globals.css`. Fechar é na hora.
  **Nunca** anime a entrada de conteúdo que vem do servidor (deixa a página em
  branco até o JS/CSS rodar), nem deslize, escalone listas, gire em 3D ou dê
  "pulinho" no hover. Movimento curto (≤250 ms) e calmo.

## Mapa de arquivos

- `src/app/[slug]/` — página pública de agendamento (`ClientPage.tsx` é o cliente).
  `page.tsx` tem `generateMetadata` por ala: **aba do navegador = nome da ala**;
  **compartilhamento** = título "Calendário de almoços da \<ala\>" + convite (só
  texto, sem imagem). É a página que o membro recebe. `error.tsx` (falha ao
  carregar → "Tentar de novo") e `src/app/not-found.tsx` (link errado → lista de
  alas) substituem as telas padrão do Next, que são em inglês. A escritura do
  Livro de Mórmon é sorteada na **home** (`src/app/page.tsx`) a cada carregamento.
- `src/app/dashboard/` — painel do líder (server component + guards client).
  `MesColapsavel.tsx` deixa cada mês recolher/expandir ao clicar no nome;
  `TrocarAla.tsx` (owner) troca a ala em foco e cria novas alas.
- `src/app/admin/` — login/cadastro do líder (Supabase Auth) + "esqueci a senha".
- `src/app/acesso/` — quem entra sem ala aprovada pede/aguarda acesso a uma ala.
- `src/app/redefinir-senha/` + `src/app/auth/confirmar/` — fluxo de nova senha
  (link do e-mail → troca por sessão → define a senha).
- `src/app/api/` — route handlers (ver tabela de APIs no README).
- `src/components/Footer.tsx` — rodapé global; crédito do dev (link externo p/ portfólio).
- `src/components/Calendar.tsx` — calendário interativo público.
- `src/components/CalendarMonthView.tsx` — calendário da **imagem exportada**.
- `src/components/CalendarExportImage.tsx` — gera a imagem (download no desktop;
  `navigator.share` no mobile → grupo do WhatsApp). **Preserve esse comportamento.**
- `src/lib/` — `supabase/{client,server,browser,auth-server}.ts` (clients agrupados:
  `client` = só o `RealtimeClient` com a chave anon — não troque pelo supabase-js
  completo, que põe ~57 KB de login/storage na página do membro; `server`
  service-role; `browser`/`auth-server` ligados à
  sessão do Supabase Auth), `session.ts` (papel owner/member + ala em foco),
  `date.ts`, `phone.ts`, `alas.ts` (nome/slug ao criar ala; também usado no client),
  `ala-publica.ts` (servidor: ala por slug + dias ocupados da janela, p/ a página
  pública), `localizacao.ts` (países do foco, UFs → fuso, `fusoValido`; usado no
  formulário de nova ala e na validação), `escrituras.ts`, `site-url.ts` (URL pública p/ links de e-mail),
  `validation.ts` (saneamento de entrada).
- `src/hooks/` — `use-ocupados-realtime.ts`: Realtime via **WebSocket**
  (Supabase Realtime, não polling) que **entrega a mudança pronta** (id, data,
  nome; DELETE só o id). O calendário público aplica direto no estado, sem
  requisição por evento; só busca a lista (`/api/agendamentos/[slug]`) ao
  reconectar. Página escondida por 30 s solta o canal e o WebSocket fecha (~50 s
  depois), liberando a vaga do plano Free; ao voltar, reinscreve e ressincroniza
  (é o que trata celular bloqueado / outro app). O painel faz
  `router.refresh()` porque precisa do telefone, que nunca vem no WebSocket.

## Autenticação e papéis (Supabase Auth)

- Login/cadastro por **e-mail + senha** (`@supabase/ssr`); a sessão fica em cookies
  e o `src/proxy.ts` (convenção "middleware" do Next 16) renova o token **só nas
  rotas do líder** (lista no `matcher`). O caminho do membro não passa pelo proxy;
  rota nova que leia sessão (`getUsuario`/`getContexto`) precisa entrar no matcher.
  **Nunca** reintroduza JWT/bcrypt próprios — saíram na migração.
- O contexto do usuário sai de `src/lib/session.ts`: `getContexto()`/`requireAcesso()`
  resolvem papel + ala em foco; `podeEditarAla()` autoriza ações por ala.
- **Papéis** (tabelas `perfil` + `ala_membro`, lidas via service-role no servidor):
  - **owner** (`perfil.is_owner`) — todas as alas; aprova/remove usuários, cria alas e
    troca a "ala em foco" (cookie `ala_atual` via `/api/ala-atual`).
  - **member** — uma ala só (vínculo `ala_membro` aprovado).
  - Sem ala aprovada → `/acesso`. Vínculo removido → volta a poder pedir acesso.
- O **slug** é gerado do nome por `gerarSlug()` (minúsculo, sem "ala",
  espaços→`_`, sem acento) — não invente outro.
- **Não há ala de teste** (removida em 2026-10-24). O `.env` local aponta para o
  banco de **produção**: agendar no `npm run dev` grava numa ala real e aparece ao
  vivo para os líderes. Teste fluxos que gravam só com o usuário ciente.

## Segurança (não enfraquecer)

**Princípio:** a segurança é responsabilidade nossa e **nunca pode barrar um uso
real**. A senhora tem que conseguir agendar sempre, rápido, sem bloqueio. Antes de
qualquer limite ou validação, pense no padrão de uso: muitas pessoas no mesmo IP
(Wi-Fi da igreja, 4G com IP compartilhado), celular antigo e lento, link aberto
dentro do WhatsApp, autopreenchimento do celular, conexão que cai. Proteja no
servidor e no banco (validação, constraints, permissões), não travando a pessoa.

- **Telefone:** normalize, não rejeite. `normalizarTelefone()` (`src/lib/phone.ts`),
  a mesma função no formulário e no servidor, aceita Brasil (celular e fixo, põe
  o 9 de celular antigo, tira `+55` e zero de discagem) e qualquer país com `+`
  ou `00`. Sem `+`, Brasil vem primeiro; se não fechar, tenta América Latina e
  EUA/Canadá — outros países só com `+`, para erro de digitação não virar outro
  país. Brasil grava "41 99999 9999"/"41 3333 4444"; outros "+1 415 555 2671".
  Campo com `inputMode="tel"` (o teclado numérico não tem a tecla `+`).
- **Toda rota valida a entrada** via `src/lib/validation.ts` (`lerJson` +
  `parseAgendar`/`parseSlug`/`parseEdicao`/`parseId`/`parseNovaAla`/`parseMembroId`/
  `parseAlaId`): teto de tamanho de corpo, formato e charset. Não volte a ler
  `req.json()` cru nem a inserir campos sem sanear.
- **Sem limite por IP** (removido em 2026-10-24): no Wi-Fi da igreja muitas
  pessoas saem pelo mesmo IP e eram bloqueadas. Não reintroduza limite em memória.
  O agendamento já é contido por validação + 1 por dia + janela de 2 meses; se
  houver abuso, use regra de rate limit do Firewall da Vercel na rota.
- Rotas **nunca** ecoam `error.message` do banco (vaza detalhes). Em
  `/api/agendar` as mensagens aparecem na tela do membro — escreva para ele.
- SQL injection: mitigado pelo query builder do Supabase (parametrizado). Não
  introduza SQL cru/`.rpc` com concatenação de string.
- **Permissões do banco (estado em `supabase/schema.sql`):** `anon` e
  `authenticated` só leem `id, ala_id, data, nome` de `agendamento` (calendário +
  Realtime); `telefone`, as outras tabelas e toda escrita são só do service-role.
  O cadastro de líder é aberto, então nunca dê a `authenticated` mais que a `anon`.
- **Tabela/sequence nova** em `public` nasce sem acesso para o navegador; conceda
  explicitamente só se o client precisar. **Função nova** em `public` nasce
  executável por todos (`/rest/v1/rpc`): sempre
  `revoke execute on function ... from public, anon, authenticated`.

## Banco (Supabase)

**`supabase/schema.sql` é a fonte da verdade** da estrutura (e instala um projeto
novo). Mudou o banco? Atualize-o e escreva o SQL da mudança em
`supabase/migrations/AAAAMMDDHHMMSS_nome.sql` — quem roda no SQL Editor é o
usuário; depois de aplicada, ele pede para apagar o arquivo.

- `ala`: `id`, `nome`, `slug` (link público, gerado do nome; check de formato),
  `endereco` (texto livre, até 200), `descricao` (opcional), `pais` (ISO 2 letras),
  `estado` (UF no Brasil; texto livre fora), `cidade`, `fuso_horario` (IANA). No
  Brasil o fuso sai da UF (`UFS` em `localizacao.ts`); fora, o owner escolhe.
- `agendamento`: `id`, `ala_id`, `data` (`YYYY-MM-DD`), `nome`, `telefone`,
  `criado_em` (NULL nas linhas anteriores a 2026-10-24). Único em (ala_id, data)
  → 1 por dia; esse índice atende todas as consultas. Checks espelham a
  validação: telefone só dígitos/espaços/`+` com 7–15 dígitos (E.164), nome 2–80
  sem `< >`. O banco não barra segunda nem dia passado (o líder pode).
- `perfil`: 1:1 com `auth.users` (criado por trigger no signup) — `id`, `nome`,
  `email`, `is_owner`.
- `ala_membro`: vínculo usuário↔ala — `id`, `ala_id`, `user_id`, `status`
  (`pendente`/`aprovado`), `aprovado_por` (vira NULL se o aprovador for excluído).
  **Único em `user_id`** → um vínculo por usuário (member = uma ala).
- **Realtime:** `agendamento` está na publication `supabase_realtime` com
  `replica identity full` — é o que faz **remoções** atualizarem ao vivo (por
  padrão o Postgres só envia a PK em DELETE, e o filtro `ala_id` não casaria).
  O Realtime checa permissão por coluna: o `telefone` não vai no payload.

## Armadilhas

- **Imagem gerada** (`CalendarMonthView`): usa **estilos inline + SVG** de
  propósito, para o `html-to-image` renderizar igual em qualquer aparelho. Não
  troque por classes Tailwind nem por emojis. Grade com
  `repeat(7, minmax(0, 1fr))` — só `1fr` deixa um nome sem espaço esticar a coluna
  e empurrar o sábado para fora da imagem (achado com Playwright). Nome: quebra
  palavra (`overflowWrap: anywhere`) e no máximo 3 linhas.
- **Nome/telefone vêm do usuário:** qualquer texto exibido precisa aguentar 80
  caracteres sem espaço (`wrap-anywhere` ou `truncate`). Telefone internacional
  é mais longo que o brasileiro.
- **Tela estreita + letra grande** (senhoras aumentam a fonte do sistema): o
  calendário usa container query em `rem` (`@max-[15rem]`, modo compacto: mês em
  cima, dias da semana em iniciais), e fileiras de botões usam `flex-wrap` com
  `basis` em rem para empilhar. Teste em 320px com fonte 130% antes de mudar layout.
- **macOS é case-insensitive:** ao renomear arquivos só mudando maiúsculas, use
  `git mv -f` e atualize os imports (os caminhos são case-sensitive no build Linux/Vercel).
- **Fundo celestial:** o "céu" (gradiente + auroras) vive em `body::before` no
  `globals.css`. As páginas usam fundo **transparente** de propósito para deixá-lo
  aparecer — **não** volte a pôr `bg-primary` nos `main`/`section` das páginas.
- **EditModal:** a remoção usa confirmação **inline** (não `window.confirm`, que
  falha em vários celulares) e fecha por clique fora / Esc / X. Mantenha os alvos
  de toque ≥48px e a cor de remoção em **rosa** (`accent`), não vermelho.
- `prefers-reduced-motion`: o bloco no fim do `globals.css` zera animações e
  transições, **menos o spinner**, que gira devagar — parado, a pessoa acha que
  travou e toca de novo.
- Variáveis de ambiente: ver README (4 chaves do Supabase). **Não há mais
  `AUTH_SECRET`** — a sessão é do Supabase Auth. O login depende, no painel do
  Supabase, do provider **Email** ligado e das **Site URL / Redirect URLs** corretas.
