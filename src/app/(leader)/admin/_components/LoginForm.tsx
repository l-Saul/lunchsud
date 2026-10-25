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
import {
    AccountFields,
    CONTA_VAZIA,
    ORDEM_CONTA,
    conferirConta,
    idDoCampoConta,
    type CampoConta,
    type ErrosConta,
} from '@/components/AccountFields';

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
    const [dados, setDados] = useState(CONTA_VAZIA);
    const [erros, setErros] = useState<ErrosConta>({});
    const [erro, setErro] = useState(erroInicial ?? '');
    const [aviso, setAviso] = useState('');
    const [loading, setLoading] = useState(false);

    function mudar(c: CampoConta, valor: string) {
        setDados(d => ({ ...d, [c]: valor }));
        if (erros[c]) setErros(e => ({ ...e, [c]: undefined }));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (loading) return;

        setErro('');
        setAviso('');
        setLoading(true);

        const emailLimpo = dados.email.trim().toLowerCase();

        if (modo === 'entrar') {
            if (!emailLimpo || !dados.senha) {
                setLoading(false);
                setErro('Digite o seu e-mail e a sua senha.');
                return;
            }
            const { error } = await supabase.auth.signInWithPassword({ email: emailLimpo, password: dados.senha });

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

        const novos = conferirConta(dados);
        setErros(novos);
        const primeiro = ORDEM_CONTA.find(c => novos[c]);
        if (primeiro) {
            setLoading(false);
            document.getElementById(idDoCampoConta(primeiro))?.focus();
            return;
        }

        const { data, error } = await supabase.auth.signUp({
            email: emailLimpo,
            password: dados.senha,
            options: { data: { nome: dados.nome.trim() } },
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

        const emailLimpo = dados.email.trim().toLowerCase();
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
        <form onSubmit={handleSubmit} noValidate className="flex w-full flex-col gap-5">
            <AccountFields modo={modo} dados={dados} onChange={mudar} erros={erros} disabled={loading} />

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
                <p role="status" className="text-center text-base font-semibold text-secondary">
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
                        setDados(d => ({ ...d, confirmar: '' }));
                        setErros({});
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
