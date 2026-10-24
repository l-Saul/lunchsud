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
- Metadata: `title: { absolute: 'Entrar' }` (a aba mostra só "Entrar", sem o
  sufixo do site) e `robots: noindex, nofollow`.
- Já logado (`getUsuario()`) → `redirect('/dashboard')`. O painel, por sua vez,
  manda para `/acesso` quem ainda não tem ala aprovada.
- `?erro=link` (vem de `/auth/confirmar` quando o link do e-mail expirou ou já foi
  usado) vira a mensagem inicial: **"O link de redefinição expirou ou já foi
  usado. Peça um novo em "Esqueci minha senha"."**

## `LoginCard.tsx`

Cartão branco com fitinha verde→rosa→verde no topo, título **"Acesso do líder"**,
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
   e-mail existe).
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

- Com **confirmação de e-mail desligada** no Supabase, a resposta já traz sessão
  → `/acesso` (loading mantido até navegar).
- Com **confirmação ligada**, não há sessão → para o loading, mostra **"Conta
  criada! Confirme o e-mail que enviamos e depois faça login."** e volta ao modo
  entrar.

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

1. E-mail vazio → "Digite seu e-mail acima para receber o link de redefinição."
2. ``resetPasswordForEmail(email.trim(), { redirectTo: `${siteUrl()}/auth/confirmar?next=/redefinir-senha` })``.
   `siteUrl()` usa `NEXT_PUBLIC_BASE_URL` para o link cair no domínio em
   produção, não no localhost (ver [src_lib.md](src_lib.md)).
3. O retorno é ignorado de propósito. A resposta é **sempre a mesma**, com ou sem
   conta (não revela se o e-mail existe): **"Se houver uma conta com esse e-mail,
   enviamos um link para redefinir a senha. Procure por uma mensagem de
   noreply@mail.app.supabase.io (confira o spam)."** O remetente é citado para a
   pessoa achar o e-mail.

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

- Erro: `role="alert"`, rosa. Aviso: `role="status"`, verde.
- Botão principal enquanto trabalha: `disabled`, `aria-busy`, `<Spinner />` e
  "Entrando…" / "Criando conta…".
- `loading` também bloqueia "Esqueci minha senha" e desativa os campos.
