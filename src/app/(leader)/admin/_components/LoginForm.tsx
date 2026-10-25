/**
 * Contexto e regras: leia CLAUDE.md e docs/routes_admin.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { criarSupabaseBrowser } from '@/lib/supabase/browser-session';
import { Spinner } from '@/components/Spinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import { siteUrl } from '@/lib/site-url';
import { botao } from '@/components/button-classes';

function mensagemDeCadastro(original: string) {
    const msg = original.toLowerCase();
    if (msg.includes('already registered')) {
        return 'Já existe uma conta com esse e-mail. Toque em "Entrar com minha conta", aqui embaixo, para entrar com ela.';
    }
    if (msg.includes('password')) return 'Escolha uma senha mais forte (pelo menos 6 caracteres).';
    if (msg.includes('email')) return 'Confira o e-mail digitado.';
    return 'Não foi possível criar a conta. Tente de novo.';
}

export default function LoginForm({ erroInicial }: { erroInicial?: string }) {
    const router = useRouter();
    const [supabase] = useState(() => criarSupabaseBrowser());

    const [modo, setModo] = useState<'entrar' | 'criar'>('entrar');
    const [nome, setNome] = useState('');
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [confirmarSenha, setConfirmarSenha] = useState('');
    const [mostrarSenha, setMostrarSenha] = useState(false);
    const [mostrarConfirmar, setMostrarConfirmar] = useState(false);
    const [erro, setErro] = useState(erroInicial ?? '');
    const [aviso, setAviso] = useState('');
    const [loading, setLoading] = useState(false);

    const campo =
        'w-full min-w-0 box-border rounded-xl border border-slate-300 bg-white px-4 py-3.5 text-lg text-text ' +
        'focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary';

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (loading) return;

        setErro('');
        setAviso('');
        setLoading(true);

        const emailLimpo = email.trim().toLowerCase();

        if (modo === 'entrar') {
            const { error } = await supabase.auth.signInWithPassword({ email: emailLimpo, password: senha });

            if (error) {
                setLoading(false);
                setErro(error.code === 'email_not_confirmed'
                    ? 'Esta conta ainda não foi confirmada. Abra o e-mail que enviamos no cadastro e toque no botão para confirmar.'
                    : 'E-mail ou senha incorretos.');
                return;
            }
            router.push('/dashboard');
            router.refresh();
            return;
        }

        if (!nome.trim()) {
            setLoading(false);
            setErro('Informe seu nome.');
            return;
        }
        if (senha.length < 6) {
            setLoading(false);
            setErro('A senha precisa ter pelo menos 6 caracteres.');
            return;
        }
        if (senha !== confirmarSenha) {
            setLoading(false);
            setErro('As senhas não conferem.');
            return;
        }

        const { data, error } = await supabase.auth.signUp({
            email: emailLimpo,
            password: senha,
            options: { data: { nome: nome.trim() } },
        });

        if (error) {
            setLoading(false);
            setErro(mensagemDeCadastro(error.message));
            return;
        }

        if (data.session) {
            router.push('/acesso');
            router.refresh();
        } else {
            setLoading(false);
            setAviso('Conta criada! Agora entre com o seu e-mail e a sua senha.');
            setModo('entrar');
        }
    }

    async function recuperarSenha() {
        if (loading) return;
        setErro('');
        setAviso('');

        const emailLimpo = email.trim().toLowerCase();
        if (!emailLimpo) {
            setErro('Digite o seu e-mail no campo acima e toque de novo em "Esqueci minha senha".');
            return;
        }

        setLoading(true);
        const { error } = await supabase.auth.resetPasswordForEmail(emailLimpo, {
            redirectTo: `${siteUrl()}/auth/confirmar?next=/redefinir-senha`,
        });
        setLoading(false);

        if (error?.status === 429) {
            setErro('Já enviamos um link há pouco. Espere alguns minutos e tente de novo.');
            return;
        }
        setAviso('Se houver uma conta com esse e-mail, enviamos um link para criar uma nova senha. Procure o e-mail "Redefina sua senha do Almoço dos Missionários" e confira também a caixa de spam.');
    }

    return (
        <form onSubmit={handleSubmit} className="flex w-full flex-col gap-5">
            {modo === 'criar' && (
                <div className="flex flex-col gap-1.5">
                    <label htmlFor="nome" className="text-base font-medium text-text">
                        Seu nome
                    </label>
                    <input
                        id="nome"
                        name="name"
                        type="text"
                        autoComplete="name"
                        autoCapitalize="words"
                        placeholder="Digite seu nome aqui"
                        value={nome}
                        onChange={e => setNome(e.target.value)}
                        disabled={loading}
                        className={campo}
                    />
                </div>
            )}

            <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className="text-base font-medium text-text">
                    E-mail
                </label>
                <input
                    id="email"
                    name="email"
                    type="email"
                    inputMode="email"
                    autoComplete={modo === 'entrar' ? 'username' : 'email'}
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    placeholder="Digite seu e-mail aqui"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    disabled={loading}
                    required
                    className={campo}
                />
            </div>

            <div className="flex flex-col gap-1.5">
                <label htmlFor="senha" className="text-base font-medium text-text">
                    Senha
                </label>
                <div className="relative">
                    <input
                        id="senha"
                        name="password"
                        type={mostrarSenha ? 'text' : 'password'}
                        autoComplete={modo === 'entrar' ? 'current-password' : 'new-password'}
                        placeholder="Digite sua senha aqui"
                        value={senha}
                        onChange={e => setSenha(e.target.value)}
                        disabled={loading}
                        required
                        className={`${campo} pr-12`}
                    />
                    <button
                        type="button"
                        onClick={() => setMostrarSenha(v => !v)}
                        aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                        aria-pressed={mostrarSenha}
                        className="absolute inset-y-0 right-0 flex items-center px-4 text-muted transition hover:text-secondary cursor-pointer"
                    >
                        {mostrarSenha ? (
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                                <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                                <line x1="1" y1="1" x2="23" y2="23" />
                            </svg>
                        ) : (
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
                                <circle cx="12" cy="12" r="3" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>

            {modo === 'criar' && (
                <div className="flex flex-col gap-1.5">
                    <label htmlFor="confirmar-senha" className="text-base font-medium text-text">
                        Confirmar senha
                    </label>
                    <div className="relative">
                        <input
                            id="confirmar-senha"
                            name="password-confirm"
                            type={mostrarConfirmar ? 'text' : 'password'}
                            autoComplete="new-password"
                            placeholder="Digite a senha novamente"
                            value={confirmarSenha}
                            onChange={e => setConfirmarSenha(e.target.value)}
                            disabled={loading}
                            required
                            className={`${campo} pr-12`}
                        />
                        <button
                            type="button"
                            onClick={() => setMostrarConfirmar(v => !v)}
                            aria-label={mostrarConfirmar ? 'Ocultar senha' : 'Mostrar senha'}
                            aria-pressed={mostrarConfirmar}
                            className="absolute inset-y-0 right-0 flex items-center px-4 text-muted transition hover:text-secondary cursor-pointer"
                        >
                            {mostrarConfirmar ? (
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                                    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                                    <line x1="1" y1="1" x2="23" y2="23" />
                                </svg>
                            ) : (
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
                                    <circle cx="12" cy="12" r="3" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {modo === 'entrar' && (
                <button
                    type="button"
                    onClick={recuperarSenha}
                    disabled={loading}
                    className="-my-2 inline-flex min-h-12 items-center self-end px-1 text-base text-muted underline underline-offset-4 transition hover:text-secondary disabled:opacity-60 cursor-pointer"
                >
                    Esqueci minha senha
                </button>
            )}

            {erro && (
                <ErrorMessage key={erro}>{erro}</ErrorMessage>
            )}
            {aviso && (
                <p role="status" className="text-center text-base font-medium text-secondary">
                    {aviso}
                </p>
            )}

            <button
                type="submit"
                disabled={loading}
                aria-busy={loading}
                className={`${botao('primario', 'grande')} mt-1 w-full`}
            >
                {loading && <Spinner />}
                {loading
                    ? modo === 'entrar' ? 'Entrando…' : 'Criando conta…'
                    : modo === 'entrar' ? 'Entrar' : 'Criar conta'}
            </button>

            <div className="mt-2 flex flex-col items-center gap-3 border-t border-slate-200 pt-5">
                <p className="text-base text-muted">
                    {modo === 'entrar' ? 'Ainda não tem conta?' : 'Já tem conta?'}
                </p>
                <button
                    type="button"
                    onClick={() => {
                        setModo(m => (m === 'entrar' ? 'criar' : 'entrar'));
                        setConfirmarSenha('');
                        setErro('');
                        setAviso('');
                    }}
                    className={`${botao('secundario', 'grande')} w-full`}
                >
                    {modo === 'entrar' ? 'Criar conta' : 'Entrar com minha conta'}
                </button>
            </div>
        </form>
    );
}
