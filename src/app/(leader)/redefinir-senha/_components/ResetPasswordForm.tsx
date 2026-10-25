/**
 * Contexto e regras: leia CLAUDE.md e docs/routes_redefinir-senha.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { criarSupabaseBrowser } from '@/lib/supabase/browser-session';
import { Spinner } from '@/components/Spinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import { botao } from '@/components/button-classes';
import { PasswordField } from '@/components/PasswordField';
import { rotulo } from '@/components/field-classes';

export default function ResetPasswordForm({ email }: { email: string | null }) {
    const router = useRouter();
    const [supabase] = useState(() => criarSupabaseBrowser());

    const [senha, setSenha] = useState('');
    const [confirmar, setConfirmar] = useState('');
    const [erro, setErro] = useState('');
    const [pronto, setPronto] = useState(false);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (loading) return;
        setErro('');

        if (senha.length < 6) {
            setErro('A senha precisa ter pelo menos 6 caracteres.');
            return;
        }
        if (senha !== confirmar) {
            setErro('As senhas não conferem.');
            return;
        }

        setLoading(true);
        const { error } = await supabase.auth.updateUser({ password: senha });
        setLoading(false);

        if (error) {
            if (error.code === 'same_password') {
                setErro('A nova senha precisa ser diferente da senha antiga.');
            } else if (error.code === 'weak_password') {
                setErro('Escolha uma senha mais forte, com pelo menos 6 caracteres.');
            } else {
                setErro('O link expirou. Peça um novo na tela de entrar, em "Esqueci minha senha".');
            }
            return;
        }

        setPronto(true);
        setTimeout(() => {
            router.push('/dashboard');
            router.refresh();
        }, 1200);
    }

    return (
        <div className="relative flex flex-col items-center gap-6 overflow-hidden rounded-3xl bg-background px-6 py-10 text-center shadow-lg ring-1 ring-primary/10 sm:px-10">
            <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1.5 bg-linear-to-r from-accent via-gold to-accent" />

            {!email ? (
                <>
                    <h2 className="text-xl font-semibold text-text">Link expirado</h2>
                    <p className="text-base text-muted">
                        O link para criar uma nova senha expirou ou já foi usado. Peça um novo na tela de entrar, em &quot;Esqueci minha senha&quot;.
                    </p>
                    <Link
                        href="/admin"
                        className={`${botao('primario', 'grande')} w-full`}
                    >
                        Ir para a tela de entrar
                    </Link>
                </>
            ) : pronto ? (
                <>
                    <h2 className="text-xl font-semibold text-text">Senha atualizada!</h2>
                    <p className="text-base text-muted">Abrindo o painel…</p>
                </>
            ) : (
                <>
                    <p className="wrap-anywhere text-base text-muted">
                        Escolha uma nova senha para a conta <strong className="text-text">{email}</strong>.
                    </p>

                    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-5 text-left">
                        <input
                            type="email"
                            name="username"
                            autoComplete="username"
                            value={email}
                            readOnly
                            hidden
                        />
                        <div className="flex flex-col gap-1.5">
                            <label htmlFor="nova-senha" className={rotulo}>
                                Nova senha
                            </label>
                            <PasswordField
                                id="nova-senha"
                                name="new-password"
                                autoComplete="new-password"
                                placeholder="Digite a nova senha"
                                value={senha}
                                onChange={e => setSenha(e.target.value)}
                                disabled={loading}
                                required
                            />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label htmlFor="confirmar-nova-senha" className={rotulo}>
                                Confirmar senha
                            </label>
                            <PasswordField
                                id="confirmar-nova-senha"
                                name="new-password-confirm"
                                autoComplete="new-password"
                                placeholder="Digite a senha novamente"
                                value={confirmar}
                                onChange={e => setConfirmar(e.target.value)}
                                disabled={loading}
                                required
                            />
                        </div>

                        {erro && (
                            <ErrorMessage key={erro}>{erro}</ErrorMessage>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            aria-busy={loading}
                            className={`${botao('primario', 'grande')} mt-1 w-full`}
                        >
                            {loading && <Spinner />}
                            {loading ? 'Salvando…' : 'Salvar nova senha'}
                        </button>
                    </form>
                </>
            )}
        </div>
    );
}
