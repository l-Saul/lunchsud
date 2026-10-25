# `/redefinir-senha`: nova senha

Onde o líder chega pelo **link do e-mail de redefinição** (ou de convite),
depois que `/auth/confirmar` trocou o link por uma sessão. Basta definir a nova
senha do usuário já logado.

## Arquivos

```
src/app/(leader)/redefinir-senha/
  page.tsx                        Server Component: pega o e-mail da sessão
  _components/
    ResetPasswordForm.tsx         formulário de nova senha
```

Dependências: `src/lib/server/session.ts` (`getUsuario`),
`src/lib/supabase/browser-session.ts`, `src/components/{Flower,Spinner}`. A rota
está no `matcher` do `src/proxy.ts`.

## Fluxo

```
"Esqueci minha senha" (/admin) → e-mail (supabase/email/reset-password.html)
  → /auth/confirmar?token_hash=…&type=recovery&next=/redefinir-senha
  → sessão criada → /redefinir-senha → updateUser → /dashboard
```

O convite (`invite-user.html`) usa o mesmo destino: `type=invite&next=/redefinir-senha`.

## `page.tsx`

- `dynamic = 'force-dynamic'`, `revalidate = 0`. Metadata: título "Nova senha",
  `robots: noindex, nofollow`.
- Estrutura: `<HeaderBand title="Nova senha" />` e, abaixo, o `<main>` com o
  cartão sobre o fundo creme. Os títulos de estado do cartão ("Link expirado",
  "Senha atualizada!") são `h2` (`text-xl`); na tela de criar a senha o cartão
  não repete "Nova senha".
- Lê o usuário da sessão e passa o `email` dele ao formulário, ou `null` **sem
  sessão** (link expirado, já usado, ou alguém abriu `/redefinir-senha` direto).

## `ResetPasswordForm.tsx` (client)

Prop `email: string | null`. Três telas, no mesmo cartão (fitinha + florzinha):

### Sem sessão: link expirado

- Título **"Link expirado"** e "O link para criar uma nova senha expirou ou já
  foi usado. Peça um novo na tela de entrar, em "Esqueci minha senha"."
- Botão **"Ir para a tela de entrar"** → `/admin`.
- O formulário nem aparece (antes ele aparecia e só dava erro ao salvar).

### Com sessão: nova senha

- (Título "Nova senha" na faixa.) "Escolha uma nova senha para a conta
  **\<e-mail\>**." (a pessoa vê de qual conta é; `wrap-anywhere`).

| Campo | Atributos |
|---|---|
| Conta (escondido) | `type="email"`, `name="username"`, `autoComplete="username"`, `value={email}`, `readOnly`, `hidden`: diz ao gerenciador de senhas do celular de qual login é a senha nova |
| Nova senha (`#nova-senha`) | `name="new-password"`, `autoComplete="new-password"` |
| Confirmar senha (`#confirmar-nova-senha`) | `name="new-password-confirm"`, `autoComplete="new-password"` |

Cada campo de senha tem botão de olho (`aria-label` "Mostrar senha"/"Ocultar
senha", `aria-pressed`).

| Situação | Resultado |
|---|---|
| senha < 6 caracteres | "A senha precisa ter pelo menos 6 caracteres." |
| senhas diferentes | "As senhas não conferem." |
| `updateUser` com `same_password` | "A nova senha precisa ser diferente da senha antiga." |
| `updateUser` com `weak_password` | "Escolha uma senha mais forte, com pelo menos 6 caracteres." |
| `updateUser` falhou por outro motivo (sessão caiu) | "O link expirou. Peça um novo na tela de entrar, em "Esqueci minha senha"." |
| sucesso | a terceira tela |

Botão enquanto salva: `disabled`, `aria-busy`, Spinner e "Salvando…". Erro no
`ErrorMessage` (caixa rosa com ícone, `role="alert"`).

### Senha salva

"Senha atualizada!" / "Abrindo o painel…" e, após 1,2 s,
`router.push('/dashboard')` + `refresh()`. Quem ainda não tem ala aprovada cai
em `/acesso`.

## Configuração necessária no Supabase

- Template **"Reset Password"** = `supabase/email/reset-password.html`, com o
  assunto de `reset-password.subject.txt` ("Redefina sua senha do Almoço dos
  Missionários"). O botão do e-mail leva a `/auth/confirmar?…&type=recovery&next=/redefinir-senha`.
- SMTP próprio configurado (o e-mail sai pelo remetente do site).
- **Site URL** = o site no ar; a mesma URL em **Redirect URLs**.
