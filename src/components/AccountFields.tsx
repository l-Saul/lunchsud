/**
 * Contexto e regras: leia CLAUDE.md e docs/src_components.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */
'use client';

import { campo, rotulo } from '@/components/field-classes';
import { PasswordField } from '@/components/PasswordField';

export type DadosConta = { nome: string; email: string; senha: string; confirmar: string };
export type CampoConta = keyof DadosConta;
export type ErrosConta = Partial<Record<CampoConta, string>>;

export const CONTA_VAZIA: DadosConta = { nome: '', email: '', senha: '', confirmar: '' };
export const ORDEM_CONTA: CampoConta[] = ['nome', 'email', 'senha', 'confirmar'];

const EMAIL_RE = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;

export function conferirConta(d: DadosConta): ErrosConta {
    const erros: ErrosConta = {};
    if (d.nome.trim().length < 2) erros.nome = 'Informe seu nome.';
    if (!EMAIL_RE.test(d.email.trim())) erros.email = 'Digite um e-mail válido.';
    if (d.senha.length < 6) erros.senha = 'A senha precisa ter pelo menos 6 caracteres.';
    else if (d.senha !== d.confirmar) erros.confirmar = 'As senhas não conferem.';
    return erros;
}

export function idDoCampoConta(c: CampoConta, prefixo = '') {
    return `${prefixo}${c === 'confirmar' ? 'confirmar-senha' : c}`;
}

type Props = {
    modo: 'entrar' | 'criar';
    dados: DadosConta;
    onChange: (campo: CampoConta, valor: string) => void;
    erros?: ErrosConta;
    disabled?: boolean;
    prefixo?: string;
};

export function AccountFields({ modo, dados, onChange, erros = {}, disabled = false, prefixo = '' }: Props) {
    const criar = modo === 'criar';
    const id = (c: CampoConta) => idDoCampoConta(c, prefixo);
    const ligacao = (c: CampoConta) => ({
        'aria-invalid': erros[c] ? true : undefined,
        'aria-describedby': erros[c] ? `${id(c)}-erro` : undefined,
    });
    const erro = (c: CampoConta) => erros[c] && (
        <p id={`${id(c)}-erro`} className="text-base font-medium text-accent">{erros[c]}</p>
    );

    return (
        <>
            {criar && (
                <div className="flex flex-col gap-1.5">
                    <label htmlFor={id('nome')} className={rotulo}>Seu nome</label>
                    <input
                        id={id('nome')}
                        name="name"
                        type="text"
                        autoComplete="name"
                        autoCapitalize="words"
                        placeholder="Digite seu nome aqui"
                        value={dados.nome}
                        onChange={e => onChange('nome', e.target.value)}
                        disabled={disabled}
                        className={campo(!!erros.nome)}
                        {...ligacao('nome')}
                    />
                    {erro('nome')}
                </div>
            )}

            <div className="flex flex-col gap-1.5">
                <label htmlFor={id('email')} className={rotulo}>E-mail</label>
                <input
                    id={id('email')}
                    name="email"
                    type="email"
                    inputMode="email"
                    autoComplete={criar ? 'email' : 'username'}
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    placeholder="Digite seu e-mail aqui"
                    value={dados.email}
                    onChange={e => onChange('email', e.target.value)}
                    disabled={disabled}
                    required
                    className={campo(!!erros.email)}
                    {...ligacao('email')}
                />
                {erro('email')}
            </div>

            <div className="flex flex-col gap-1.5">
                <label htmlFor={id('senha')} className={rotulo}>Senha</label>
                <PasswordField
                    id={id('senha')}
                    name="password"
                    autoComplete={criar ? 'new-password' : 'current-password'}
                    placeholder="Digite sua senha aqui"
                    value={dados.senha}
                    onChange={e => onChange('senha', e.target.value)}
                    disabled={disabled}
                    required
                    erro={!!erros.senha}
                    {...ligacao('senha')}
                />
                {erro('senha')}
            </div>

            {criar && (
                <div className="flex flex-col gap-1.5">
                    <label htmlFor={id('confirmar')} className={rotulo}>Confirmar senha</label>
                    <PasswordField
                        id={id('confirmar')}
                        name="password-confirm"
                        autoComplete="new-password"
                        placeholder="Digite a senha novamente"
                        value={dados.confirmar}
                        onChange={e => onChange('confirmar', e.target.value)}
                        disabled={disabled}
                        required
                        erro={!!erros.confirmar}
                        {...ligacao('confirmar')}
                    />
                    {erro('confirmar')}
                </div>
            )}
        </>
    );
}
