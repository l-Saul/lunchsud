# `/auth/confirmar`: link do e-mail → sessão

Route handler (`GET`, sem tela) que recebe **os links enviados por e-mail pelo
Supabase Auth** (redefinir senha, confirmar cadastro, convite, link mágico,
troca de e-mail), cria a sessão do líder e redireciona.

## Arquivo

`src/app/auth/confirmar/route.ts`. Dependência:
`src/lib/supabase/server-session.ts` (o cliente ligado aos cookies, que grava a
sessão). Está no `matcher` do `src/proxy.ts` (`/auth/:path*`).

## Parâmetros

| Parâmetro | Uso |
|---|---|
| `token_hash` + `type` | formato dos templates de e-mail (`supabase/email/*.html`) → `verifyOtp({ type, token_hash })` |
| `code` | fallback do fluxo PKCE → `exchangeCodeForSession(code)` |
| `next` | caminho para onde ir depois; padrão `/dashboard` |

### Por que `token_hash` é o formato principal

O `token_hash` **funciona mesmo se o link for aberto em outro aparelho ou
navegador** (o líder pede no computador e abre o e-mail no celular, ou o link
abre no navegador interno de um app). O `code` do PKCE depende de um cookie
gravado no navegador que pediu, então só funciona no mesmo navegador.

### Links dos templates

| Template | `type` | `next` |
|---|---|---|
| `reset-password.html` | `recovery` | `/redefinir-senha` |
| `invite-user.html` | `invite` | `/redefinir-senha` |
| `confirm-signup.html` | `email` | `/dashboard` |
| `magic-link.html` | `email` | `/dashboard` |
| `change-email.html` | `email_change` | `/dashboard` |

Todos no formato `{{ .SiteURL }}/auth/confirmar?token_hash={{ .TokenHash }}&type=…&next=…`.

## Comportamento

1. `destino = next` **só se começar com `/`**; senão, `/dashboard`. O redirect é
   sempre `${origin}${destino}`, então nunca sai do domínio (evita *open
   redirect*).
2. Com `token_hash` e `type` → `verifyOtp`. Com `code` → `exchangeCodeForSession`.
3. Deu certo → redireciona para o destino (já com a sessão nos cookies).
4. Link inválido, expirado ou já usado → `/admin?erro=link`, que mostra "O link
   de redefinição expirou ou já foi usado…" (ver [routes_admin.md](routes_admin.md)).

## Configuração no Supabase

Para o link funcionar em produção: **Authentication → URL Configuration** com a
**Site URL** do site no ar e a mesma URL em **Redirect URLs**. Os templates são
colados em **Authentication → Email Templates** (ver
[database.md](database.md#templates-de-e-mail-supabaseemail)).
