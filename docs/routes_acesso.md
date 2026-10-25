# `/acesso`: pedir ou aguardar acesso a uma ala

Tela de quem **já tem conta e está logado, mas ainda não tem ala aprovada**. A
pessoa escolhe a ala e pede acesso; depois vê "aguardando aprovação" até um
responsável aprovar no painel.

## Arquivos

```
src/app/(leader)/acesso/
  page.tsx                    Server Component: decide o estado e busca as alas
  _components/
    RequestAccess.tsx         cartão: pedir acesso / aguardando / sair
```

Dependências: `src/lib/server/session.ts` (`getContexto`),
`src/lib/supabase/service-role.ts`, `src/lib/supabase/browser-session.ts`,
`src/components/{Flower,Spinner}`, `POST /api/acesso/solicitar` (ver
[routes_api.md](routes_api.md)). A rota está no `matcher` do `src/proxy.ts`.

## Regras

- **Member = uma ala só.** O banco garante com índice único em
  `ala_membro.user_id` (ver [database.md](database.md)); a API recusa um
  segundo pedido com 409.
- O vínculo nasce `pendente`. Quem aprova: o **owner** (qualquer ala) ou um
  **member já aprovado da mesma ala** (no card Usuários do painel).
- Vínculo **removido** no painel → a pessoa volta a cair aqui e pode pedir de novo.
- Owner nunca fica nesta tela: tem acesso a todas as alas.

## `page.tsx`

- `dynamic = 'force-dynamic'`, `revalidate = 0`. Metadata: título "Acesso ao painel",
  `robots: noindex, nofollow`.
- Estrutura: `<HeaderBand title="Acesso ao painel" />` e, abaixo, o `<main>`
  com o cartão sobre o fundo creme. No cartão, "Olá, \<nome\>!" / "Quase lá,
  \<nome\>!" são `h2` (`text-xl`), sem a florzinha (ela fica na faixa).
- Sem login → `/admin`. Já tem ala em foco (`ctx.alaId !== null`) →
  `/dashboard`.
- Busca o vínculo do usuário (`ala_membro`: `status`, `ala_id`), as alas
  **ativas** (`id, nome, estado, cidade`, por nome) e a ala do vínculo
  (`nome, status`, mesmo se pendente), pelo service-role.
- `pendenteEm` = nome da ala do vínculo pendente (ou "sua ala" se não achar),
  ou `null` se não há vínculo. `alaEsperando` = a ala do vínculo ainda está
  pendente (foi pedida pela home e o owner não aprovou).

## `RequestAccess.tsx` (client)

Cartão branco com fitinha e florzinha. Props: `nome` (do perfil), `alas`,
`pendenteEm`, `alaEsperando`.

### Sem vínculo: pedir acesso

- "Olá, \<nome\>!" e "Escolha a sua ala para pedir acesso ao painel."
- A escolha da ala é o **`WardFilter`** (o mesmo da home e do painel; ver
  [src_components.md](src_components.md)): Estado e Cidade em lista, as alas da
  cidade e a instrução "Toque na sua ala:". Tocar **marca** a ala (azul com ✓,
  `aria-pressed`); não envia nada ainda. O `<select>` de alas de antes saiu.
- **"Pedir acesso"**: desativado sem ala escolhida.
- **Embaixo, depois de uma linha** (`border-t border-primary/10`, espaço
  generoso, para não confundir com o pedido de acesso): **"Sua ala ainda não usa
  o calendário?"** (`h3`) e "A presidência pode pedir agora. Quando o pedido for
  aprovado, a ala aparece no site." com o botão `secundario` **"Pedir para usar
  o calendário"**. Para quem criou conta de líder na tela errada.
- O botão abre o **`WardRequestModal`**, **o mesmo modal da home** (pedido do
  dono: melhor que o formulário dentro do cartão, que existia antes com um botão
  rosa "Voltar e procurar a minha ala"). Ele recebe `conta = { nome, email, ala:
  null }` (a pessoa está logada e não tem ala aprovada nem pendente, então não
  pergunta `/api/conta` e não mostra aviso de perder acesso) e já vem com
  "Minha conta" escolhida. Detalhes em [src_components.md](src_components.md).
- **Não dá para pedir acesso e criar ala ao mesmo tempo**: o servidor garante.
  A conta tem um vínculo só (índice único), `/api/acesso/solicitar` recusa quem
  já tem vínculo, e o pedido de ala com a própria conta troca o vínculo.
- Enviado com a **própria conta**: o modal mostra "Pedido enviado!" e a página
  atrás já recarrega (`router.refresh()`); ao fechar, aparece o "Quase lá" da
  ala pendente. Com **conta nova**: só o "Pedido enviado!" (a conta logada não
  muda).
- `POST /api/acesso/solicitar { alaId }`:
  - sucesso → `router.refresh()` (a página passa a mostrar "aguardando");
  - resposta não ok → "Não foi possível solicitar. Tente novamente.";
  - sem internet → "Sem conexão com a internet. Verifique e tente de novo.".
  - Os erros aparecem no `ErrorMessage` (caixa rosa com ícone).

### Com vínculo pendente: aguardando

- "Quase lá, \<nome\>!" e "Seu acesso à **\<ala\>** está aguardando a aprovação
  de um responsável da ala. Você recebe um e-mail quando for aprovado." (o
  e-mail "Pedido aprovado" sai quando alguém aprova)"
- Se a **ala** ainda está esperando (pedida pela home, `alaEsperando`): "O
  pedido da **\<ala\>** ainda está esperando aprovação. Depois que a ala for
  aprovada, o seu acesso ao painel também é aprovado. Você recebe um e-mail
  quando tudo estiver pronto."
- **"Já fui aprovado? Atualizar"** → `router.refresh()` dentro de
  `useTransition`. Enquanto atualiza: Spinner e "Atualizando…". Aprovado, a
  página redireciona para o painel.

### Sair (sempre visível)

Para o caso de conta errada. `supabase.auth.signOut()` → `/admin`. Mostra
Spinner e "Saindo…" enquanto sai. É um botão de texto sublinhado, com área de
toque de pelo menos 44×44px (`min-h-11 min-w-11 px-3`: só a palavra "Sair"
dava 26px de largura).

"Atualizar" e "Sair" mostram que estão trabalhando: sem isso a pessoa toca de
novo achando que não funcionou.
