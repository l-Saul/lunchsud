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

- `dynamic = 'force-dynamic'`, `revalidate = 0`. Metadata: título "Redefinir
  senha", `robots: noindex, nofollow`.
- Lê o usuário da sessão e passa `email` (ou `''`) ao formulário, para o
  gerenciador de senhas saber qual senha salva atualizar.
- **Não redireciona** quem chega sem sessão: o formulário aparece, e o
  `updateUser` falha com a mensagem de link expirado (abaixo).

## `ResetPasswordForm.tsx` (client)

### Campos

| Campo | Atributos |
|---|---|
| Conta (escondido) | `type="email"`, `name="username"`, `autoComplete="username"`, `value={email}`, `readOnly`, `hidden`: diz ao gerenciador de senhas do celular de qual login é a senha nova |
| Nova senha (`#nova-senha`) | `name="new-password"`, `autoComplete="new-password"` |
| Confirmar senha (`#confirmar-nova-senha`) | `name="new-password-confirm"`, `autoComplete="new-password"` |

Cada campo de senha tem botão de olho (`aria-label` "Mostrar senha"/"Ocultar
senha", `aria-pressed`).

### Envio

| Situação | Resultado |
|---|---|
| senha < 6 caracteres | "A senha precisa ter pelo menos 6 caracteres." |
| senhas diferentes | "As senhas não conferem." |
| `updateUser` falhou (sem sessão, link expirado) | "O link expirou. Peça um novo link de redefinição na tela de login." |
| sucesso | troca para "Senha atualizada!" / "Redirecionando para o painel…" e, após 1,2 s, `router.push('/dashboard')` + `refresh()` |

Botão enquanto salva: `disabled`, `aria-busy`, Spinner e "Salvando…". Erro em
`role="alert"`, rosa.
