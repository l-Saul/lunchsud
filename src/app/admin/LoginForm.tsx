'use client';

// Login e cadastro do líder via Supabase Auth (e-mail + senha).
//  - Entrar  → signInWithPassword → vai pro /dashboard (que redireciona pro /acesso
//              se ainda não houver ala aprovada).
//  - Criar   → signUp (o trigger cria o perfil) → vai pro /acesso pedir acesso a uma ala.

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { criarSupabaseBrowser } from '@/lib/supabase/browser';

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
    // Semeia o erro com o que veio do servidor (ex.: ?erro=link de link expirado).
    const [erro, setErro] = useState(erroInicial ?? '');
    const [aviso, setAviso] = useState('');
    const [loading, setLoading] = useState(false);

    const campo =
        'w-full min-w-0 box-border rounded-xl border border-slate-300 bg-white px-4 py-3.5 text-lg text-text ' +
        'placeholder:text-muted/60 focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary';

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (loading) return;

        setErro('');
        setAviso('');
        setLoading(true);

        if (modo === 'entrar') {
            const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
            setLoading(false);

            if (error) {
                setErro('E-mail ou senha incorretos.');
                return;
            }
            router.push('/dashboard');
            router.refresh();
            return;
        }

        // modo === 'criar' — validações locais antes de mandar pro banco.
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
            email,
            password: senha,
            options: { data: { nome: nome.trim() } },
        });
        setLoading(false);

        if (error) {
            setErro(error.message);
            return;
        }

        // Com confirmação de e-mail desligada, já vem sessão → segue pro /acesso.
        // Com confirmação ligada, não há sessão → orienta a confirmar o e-mail.
        if (data.session) {
            router.push('/acesso');
            router.refresh();
        } else {
            setAviso('Conta criada! Confirme o e-mail que enviamos e depois faça login.');
            setModo('entrar');
        }
    }

    // Esqueci a senha: envia o e-mail de redefinição. O link cai em /auth/confirmar
    // (troca o código pela sessão) e leva o usuário para /redefinir-senha.
    async function recuperarSenha() {
        if (loading) return;
        setErro('');
        setAviso('');

        if (!email.trim()) {
            setErro('Digite seu e-mail acima para receber o link de redefinição.');
            return;
        }

        setLoading(true);
        // Ignora o retorno de propósito: respondemos igual com ou sem conta.
        await supabase.auth.resetPasswordForEmail(email.trim(), {
            redirectTo: `${window.location.origin}/auth/confirmar?next=/redefinir-senha`,
        });
        setLoading(false);

        // Resposta genérica de propósito (não revela se o e-mail existe). Avisa o
        // remetente para a pessoa achar o e-mail (e olhar o spam, se preciso).
        setAviso('Se houver uma conta com esse e-mail, enviamos um link para redefinir a senha. Procure por uma mensagem de noreply@mail.app.supabase.io (confira o spam).');
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
                        type="text"
                        autoComplete="name"
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
                    type="email"
                    autoComplete="email"
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

            {/* Confirmar senha — só no cadastro, validado antes de enviar ao banco. */}
            {modo === 'criar' && (
                <div className="flex flex-col gap-1.5">
                    <label htmlFor="confirmar-senha" className="text-base font-medium text-text">
                        Confirmar senha
                    </label>
                    <div className="relative">
                        <input
                            id="confirmar-senha"
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

            {/* Esqueci a senha — só no modo entrar. */}
            {modo === 'entrar' && (
                <button
                    type="button"
                    onClick={recuperarSenha}
                    disabled={loading}
                    className="-mt-2 self-end text-sm text-muted underline underline-offset-4 transition hover:text-secondary disabled:opacity-60 cursor-pointer"
                >
                    Esqueci minha senha
                </button>
            )}

            {erro && (
                <p role="alert" className="text-center text-sm font-medium text-accent">
                    {erro}
                </p>
            )}
            {aviso && (
                <p role="status" className="text-center text-sm font-medium text-secondary">
                    {aviso}
                </p>
            )}

            <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="mt-1 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-secondary py-4 text-lg font-semibold text-white shadow-md transition hover:opacity-95 hover:shadow-lg disabled:opacity-60"
            >
                {loading && (
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                )}
                {loading ? 'Aguarde…' : modo === 'entrar' ? 'Entrar' : 'Criar conta'}
            </motion.button>

            {/* Alterna entre entrar e criar conta. */}
            <button
                type="button"
                onClick={() => {
                    setModo(m => (m === 'entrar' ? 'criar' : 'entrar'));
                    setConfirmarSenha('');
                    setErro('');
                    setAviso('');
                }}
                className="text-center text-sm text-muted transition hover:text-secondary cursor-pointer"
            >
                {modo === 'entrar'
                    ? 'Não tem conta? Criar conta'
                    : 'Já tem conta? Entrar'}
            </button>
        </form>
    );
}
