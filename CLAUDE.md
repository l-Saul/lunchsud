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
- `npm run dev` · `npm run build` · `npm run lint` (= `eslint src`; **não** use
  `next lint`, foi removido no Next 16).
- Antes de concluir uma mudança, rode `npx tsc --noEmit` **e** `npm run build`.
  Hoje `eslint src` passa **limpo (0 erros, 0 warnings)** — mantenha assim.
- **Nunca rode `npm run build` com o `npm run dev` aberto:** os dois disputam o
  diretório `.next` e corrompem o cache (erro `ENOENT … build-manifest.json`).
  Pare um antes do outro; para só checar tipos, use `npx tsc --noEmit`.

## Regras de negócio (CRÍTICO — não quebrar)

1. **Um almoço por dia, por ala.** Garantido por constraint única no Postgres;
   a API trata o erro `23505` em `src/app/api/agendar/route.ts`. Os dias ocupados
   vêm do banco e são bloqueados no calendário.
2. **Segunda = P-day** (não agendável). Travado em 3 lugares, todos via
   `isPday()` de `src/lib/date.ts`:
   - `src/components/Calendar.tsx` (calendário público)
   - `src/components/CalendarMonthView.tsx` (imagem gerada)
   - `src/app/api/agendar/route.ts` (backend, fonte da verdade)
3. **Janela = mês atual + seguinte.** Público (`ClientPage`) e painel
   (`dashboard/page.tsx` via `getDashboardRange`). "Hoje" é calculado em
   `America/Sao_Paulo` para o servidor UTC não virar o mês.
4. Painel mostra "X de Y dias agendados", `Y = dias do mês − segundas`
   (`diasDisponiveisNoMes`).
5. **Histórico = só os 3 meses anteriores** ao atual (`getHistoricoRange(3)`);
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

## Mapa de arquivos

- `src/app/[slug]/` — página pública de agendamento (`ClientPage.tsx` é o cliente).
  `page.tsx` tem `generateMetadata` por ala: **aba do navegador = nome da ala**;
  **compartilhamento** = título "Calendário de almoços da \<ala\>" + convite (só
  texto, sem imagem). É a página que o membro recebe. A escritura do Livro de Mórmon
  é sorteada na **home** (`src/app/page.tsx`) a cada carregamento.
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
  `client` anon p/ Realtime, `server` service-role, `browser`/`auth-server` ligados à
  sessão do Supabase Auth), `session.ts` (papel owner/member + ala em foco),
  `date.ts`, `phone.ts`, `alas.ts` (visibilidade/slug das alas), `escrituras.ts`,
  `site-url.ts` (URL pública p/ links de e-mail), `validation.ts` (saneamento de
  entrada), `rate-limit.ts` (limite por IP).
- `src/hooks/` — `use-ocupados-realtime.ts`: Realtime via **WebSocket**
  (Supabase Realtime, não polling). Usado no calendário público e no painel.

## Autenticação e papéis (Supabase Auth)

- Login/cadastro por **e-mail + senha** (`@supabase/ssr`); a sessão fica em cookies
  e o `src/proxy.ts` (convenção "middleware" do Next 16) renova o token a cada request.
  **Nunca** reintroduza JWT/bcrypt próprios — saíram na migração.
- O contexto do usuário sai de `src/lib/session.ts`: `getContexto()`/`requireAcesso()`
  resolvem papel + ala em foco; `podeEditarAla()` autoriza ações por ala.
- **Papéis** (tabelas `perfil` + `ala_membro`, lidas via service-role no servidor):
  - **owner** (`perfil.is_owner`) — todas as alas; aprova/remove usuários, cria alas e
    troca a "ala em foco" (cookie `ala_atual` via `/api/ala-atual`).
  - **member** — uma ala só (vínculo `ala_membro` aprovado).
  - Sem ala aprovada → `/acesso`. Vínculo removido → volta a poder pedir acesso.
- **Ala de teste** (slug `teste`) só aparece nas listas em desenvolvimento — filtre
  sempre por `semAlaTesteEmProd()` de `src/lib/alas.ts`. O **slug** é gerado do nome
  por `gerarSlug()` (minúsculo, sem "ala", espaços→`_`, sem acento) — não invente outro.

## Segurança (não enfraquecer)

- **Toda rota valida a entrada** via `src/lib/validation.ts` (`lerJson` +
  `parseAgendar`/`parseSlug`/`parseEdicao`/`parseId`/`parseNovaAla`/`parseMembroId`/
  `parseAlaId`): teto de tamanho de corpo, formato e charset. Não volte a ler
  `req.json()` cru nem a inserir campos sem sanear.
- **Rate limit por IP** em `src/lib/rate-limit.ts` (em memória, janela fixa):
  `/api/agendar` 6/min, GETs públicos 30/min. É
  **por instância** (serverless) — ao escalar horizontalmente, troque só o `store`
  por Upstash/Vercel KV mantendo a mesma interface.
- Rotas **nunca** ecoam `error.message` do banco (vaza detalhes); respondem genérico.
- SQL injection: mitigado pelo query builder do Supabase (parametrizado). Não
  introduza SQL cru/`.rpc` com concatenação de string.
- **PII (ação recomendada):** a policy `leitura publica` (anon SELECT) expõe
  `telefone` via REST do Supabase a qualquer um com a anon key. O app nunca usa
  telefone no client e o GET `/api/agendamentos/[slug]` só devolve `data`+`nome`.
  Para fechar de vez, restrinja as colunas do anon (não quebra o Realtime, que
  ignora o payload e rebusca pelo servidor):
  ```sql
  revoke select on agendamento from anon;
  grant select (id, ala_id, data, nome) on agendamento to anon;
  ```

## Banco (Supabase)

- `ala`: `id`, `nome`, `slug` (link público, gerado do nome), `endereco` (texto
  livre, opcional), `descricao` (opcional).
- `agendamento`: `id`, `ala_id`, `data` (`YYYY-MM-DD`), `nome`, `telefone`.
  Constraint única em (ala_id, data) → impõe 1 por dia.
- `perfil`: 1:1 com `auth.users` (criado por trigger no signup) — `id`, `nome`,
  `email`, `is_owner`.
- `ala_membro`: vínculo usuário↔ala — `id`, `ala_id`, `user_id`, `status`
  (`pendente`/`aprovado`), `aprovado_por`. Único em (ala_id, user_id).
- **Realtime (uma vez, no SQL editor):** sem isso o WebSocket não atualiza ao vivo.
  ```sql
  alter publication supabase_realtime add table agendamento;
  alter table agendamento enable row level security;
  create policy "leitura publica" on agendamento for select to anon using (true);
  alter table agendamento replica identity full;  -- DELETE/UPDATE ao vivo
  ```
  O `replica identity full` é o que faz **remoções** atualizarem ao vivo: por
  padrão o Postgres só envia a PK em DELETE, e o filtro `ala_id` não casaria.

## Armadilhas

- **Imagem gerada** (`CalendarMonthView`): usa **estilos inline + SVG** de
  propósito, para o `html-to-image` renderizar igual em qualquer aparelho. Não
  troque por classes Tailwind nem por emojis.
- **macOS é case-insensitive:** ao renomear arquivos só mudando maiúsculas, use
  `git mv -f` e atualize os imports (os caminhos são case-sensitive no build Linux/Vercel).
- **Fundo celestial:** o "céu" (gradiente + auroras) vive em `body::before` no
  `globals.css`. As páginas usam fundo **transparente** de propósito para deixá-lo
  aparecer — **não** volte a pôr `bg-primary` nos `main`/`section` das páginas.
- **EditModal:** a remoção usa confirmação **inline** (não `window.confirm`, que
  falha em vários celulares) e fecha por clique fora / Esc / X. Mantenha os alvos
  de toque ≥48px e a cor de remoção em **rosa** (`accent`), não vermelho.
- Animações em framer-motion respeitam `prefers-reduced-motion` via
  `MotionConfig reducedMotion="user"` no `template.tsx`; decorações em CSS são
  neutralizadas pelo bloco `@media (prefers-reduced-motion)` no `globals.css`.
- Variáveis de ambiente: ver README (4 chaves do Supabase). **Não há mais
  `AUTH_SECRET`** — a sessão é do Supabase Auth. O login depende, no painel do
  Supabase, do provider **Email** ligado e das **Site URL / Redirect URLs** corretas.
