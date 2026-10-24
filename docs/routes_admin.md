# `/admin`: login e cadastro do líder

Tela de entrada dos **líderes** (o membro que agenda não tem conta). Entrar,
criar conta e pedir o e-mail de "esqueci minha senha". Autenticação pelo
**Supabase Auth** (e-mail + senha); a sessão fica em cookies.

## Arquivos

```
src/app/(leader)/admin/
  page.tsx                    Server Component: redireciona quem já está logado; erro do link
  _components/
    LoginCard.tsx             cartão com título e divisória
    LoginForm.tsx             formulário (entrar / criar conta / esqueci a senha)
```

Dependências: `src/lib/server/session.ts` (`getUsuario`),
`src/lib/supabase/browser-session.ts`, `src/lib/site-url.ts`,
`src/components/{Flower,Spinner}`. A rota está no `matcher` do `src/proxy.ts`.

## Fluxo de acesso (todas as telas do líder)

```
/admin ──entrar──▶ /dashboard ──(sem ala aprovada)──▶ /acesso
   │                                                      ▲
   └──criar conta──(com sessão)───────────────────────────┘
   └──criar conta──(confirmação de e-mail ligada)──▶ aviso "confirme o e-mail" → entrar
   └──esqueci a senha──▶ e-mail ──▶ /auth/confirmar ──▶ /redefinir-senha ──▶ /dashboard
```

## `page.tsx`

- `dynamic = 'force-dynamic'`, `revalidate = 0`: sempre lê a sessão atual.
- Estrutura: `<HeaderBand />` (faixa azul com o ícone e "Almoço dos
  Missionários") e, abaixo, o `<main>` com o cartão sobre o fundo creme.
- Metadata: `title: { absolute: 'Entrar' }` (a aba mostra só "Entrar", sem o
  sufixo do site) e `robots: noindex, nofollow`.
- Já logado (`getUsuario()`) → `redirect('/dashboard')`. O painel, por sua vez,
  manda para `/acesso` quem ainda não tem ala aprovada.
- `?erro=link` (vem de `/auth/confirmar` quando o link do e-mail expirou ou já foi
  usado) vira a mensagem inicial: **"Esse link expirou ou já foi usado. Para
  criar uma nova senha, toque em "Esqueci minha senha" e peça outro link."**

## `LoginCard.tsx`

Cartão branco com fitinha framboesa→dourado→framboesa no topo, título **"Acesso do líder"**,
divisória com florzinha e "Entre para gerenciar os almoços da sua ala.". Repassa
`erroInicial` ao formulário.

## `LoginForm.tsx` (client)

### Modos

`modo` alterna entre `'entrar'` e `'criar'` pelo botão de texto "Não tem conta?
Criar conta" / "Já tem conta? Entrar". Trocar de modo limpa a confirmação de
senha, o erro e o aviso.

### Entrar

1. `signInWithPassword({ email: emailLimpo, password })`.
2. Erro → **"E-mail ou senha incorretos."** (mensagem única, não revela se o
   e-mail existe). Exceção: conta ainda não confirmada (`email_not_confirmed`,
   só acontece se a confirmação de e-mail for religada no Supabase) → "Esta
   conta ainda não foi confirmada. Abra o e-mail que enviamos no cadastro e toque
   no botão para confirmar."
3. Sucesso → `router.push('/dashboard')` + `router.refresh()`. O loading **fica
   ligado** até a navegação trocar a tela (o componente desmonta). Senão o botão
   "descarrega" e parece travado.

### Criar conta

Validações locais, antes de ir ao Supabase:

| Falha | Mensagem |
|---|---|
| nome vazio | "Informe seu nome." |
| senha < 6 caracteres | "A senha precisa ter pelo menos 6 caracteres." |
| senhas diferentes | "As senhas não conferem." |

Depois `signUp({ email, password, options: { data: { nome } } })`. O trigger
`handle_new_user` do banco cria o `perfil` com esse nome (ver
[database.md](database.md)).

- **Não há confirmação de e-mail** ("Confirm email" desligado no Supabase): o
  líder ainda precisa ser aprovado por outro líder para usar o painel, então
  confirmar o e-mail seria um passo a mais sem ganho. A resposta já traz sessão
  → `/acesso`, onde a pessoa pede para usar o painel da ala (loading mantido até
  navegar).
- Se a resposta vier sem sessão (confirmação religada no Supabase), para o
  loading, mostra **"Conta criada! Agora entre com o seu e-mail e a sua senha."**
  e volta ao modo entrar.

O Supabase responde em inglês; `mensagemDeCadastro()` traduz para o líder saber
o que fazer:

| Erro do Supabase contém | Mensagem |
|---|---|
| `already registered` | "Já existe uma conta com esse e-mail. Toque em "Já tem conta? Entrar" ou em "Esqueci minha senha"." |
| `password` | "Escolha uma senha mais forte (pelo menos 6 caracteres)." |
| `email` | "Confira o e-mail digitado." |
| outro | "Não foi possível criar a conta. Tente de novo." |

### E-mail sempre limpo

`emailLimpo = email.trim().toLowerCase()` antes de entrar ou criar conta. A
sugestão do teclado do celular deixa um espaço no fim do e-mail, e o iPhone pode
pôr a 1ª letra maiúscula: sem limpar, a senha certa dava "E-mail ou senha
incorretos".

### Esqueci minha senha

Botão de texto, só no modo entrar.

1. E-mail vazio → "Digite o seu e-mail no campo acima e toque de novo em
   "Esqueci minha senha"." (não chama o Supabase).
2. ``resetPasswordForEmail(emailLimpo, { redirectTo: `${siteUrl()}/auth/confirmar?next=/redefinir-senha` })``,
   com o e-mail em minúsculas e sem espaços. `siteUrl()` usa
   `NEXT_PUBLIC_BASE_URL` (ver [src_lib.md](src_lib.md)).
3. Limite de envios do Supabase (429) → "Já enviamos um link há pouco. Espere
   alguns minutos e tente de novo."
4. Qualquer outro caso tem **sempre a mesma resposta**, com ou sem conta (não
   revela se o e-mail existe): **"Se houver uma conta com esse e-mail, enviamos
   um link para criar uma nova senha. Procure o e-mail "Redefina sua senha do
   Almoço dos Missionários" e confira também a caixa de spam."** A pessoa procura
   pelo assunto do e-mail, que não muda se o remetente (SMTP) mudar.

O link do e-mail usa o template de `supabase/email/reset-password.html`, que
aponta para `/auth/confirmar?token_hash=…&type=recovery&next=/redefinir-senha`
(ver [routes_auth-confirmar.md](routes_auth-confirmar.md)).

### Campos e preenchimento automático

Formulário `<form>` real, botão principal `type="submit"` (a tecla "Ir" envia).

| Campo | Atributos |
|---|---|
| Nome (só criar) | `name="name"`, `autoComplete="name"`, `autoCapitalize="words"` |
| E-mail | `name="email"`, `type="email"`, `inputMode="email"`, `autoComplete` = `username` (entrar) ou `email` (criar), `autoCapitalize="none"`, `autoCorrect="off"`, `spellCheck={false}` |
| Senha | `name="password"`, `autoComplete` = `current-password` (entrar) ou `new-password` (criar) |
| Confirmar senha (só criar) | `name="password-confirm"`, `autoComplete="new-password"` |

- Entrar com `username` puxa o login salvo no gerenciador de senhas; criar conta
  com `email` puxa o e-mail do próprio celular. E-mail não é frase: sem
  maiúscula automática nem corretor.
- Cada campo de senha tem botão de olho (`aria-label` "Mostrar senha"/"Ocultar
  senha", `aria-pressed`).

### Feedback

- Erro: `role="alert"`, rosa. Aviso: `role="status"`, azul.
- Botão principal enquanto trabalha: `disabled`, `aria-busy`, `<Spinner />` e
  "Entrando…" / "Criando conta…".
- `loading` também bloqueia "Esqueci minha senha" e desativa os campos.
