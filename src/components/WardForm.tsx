/**
 * Contexto e regras: leia CLAUDE.md e docs/src_components.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */
'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { gerarSlug, nomeSemTipo, normalizarCidade, normalizarNomeAla, type TipoUnidade } from '@/lib/wards';
import { UFS } from '@/lib/location';
import { ChoiceGroup } from '@/components/ChoiceGroup';
import { Spinner } from '@/components/Spinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import { botao } from '@/components/button-classes';

type Props =
    | { modo: 'owner'; onCriada: (novaId: number | undefined) => Promise<void>; onCancelar: () => void }
    | { modo: 'pedido'; onEnviado: (email: string) => void };

type Campo = 'nome' | 'estado' | 'cidade' | 'liderNome' | 'email' | 'senha';

const ORDEM: Campo[] = ['nome', 'estado', 'cidade', 'liderNome', 'email', 'senha'];
const EMAIL_RE = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;

const campoClasse = (erro?: string) =>
    `min-h-12 w-full rounded-xl border bg-white px-4 text-lg text-text shadow-sm focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary disabled:opacity-60 ${erro ? 'border-accent' : 'border-slate-300'}`;

export function WardForm(props: Props) {
    const pedido = props.modo === 'pedido';
    const id = useId();
    const [tipo, setTipo] = useState<TipoUnidade>('ala');
    const [nome, setNome] = useState('');
    const [estado, setEstado] = useState('');
    const [cidade, setCidade] = useState('');
    const [liderNome, setLiderNome] = useState('');
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [mostrarSenha, setMostrarSenha] = useState(false);
    const [website, setWebsite] = useState('');
    const [erros, setErros] = useState<Partial<Record<Campo, string>>>({});
    const [erro, setErro] = useState('');
    const [salvando, setSalvando] = useState(false);
    const abertoEm = useRef(0);

    useEffect(() => {
        abertoEm.current = Date.now();
    }, []);

    const unidade = tipo === 'ramo' ? 'do ramo' : 'da ala';
    const nomeFinal = nomeSemTipo(nome).length >= 2 ? normalizarNomeAla(nome, tipo) : '';
    const link = nomeFinal && estado && cidade.trim().length >= 2
        ? gerarSlug(estado, normalizarCidade(cidade), nomeFinal)
        : '';

    const campoId = (c: Campo) => `${id}-${c}`;

    function limpar(c: Campo) {
        setErro('');
        if (erros[c]) setErros(e => ({ ...e, [c]: undefined }));
    }

    function conferir() {
        const novos: Partial<Record<Campo, string>> = {};
        if (!nomeFinal) novos.nome = `Digite o nome ${unidade}.`;
        if (!estado) novos.estado = 'Escolha o estado.';
        if (cidade.trim().length < 2) novos.cidade = 'Digite a cidade.';
        if (pedido) {
            if (liderNome.trim().length < 2) novos.liderNome = 'Digite o nome do líder responsável.';
            if (!EMAIL_RE.test(email.trim())) novos.email = 'Digite um e-mail válido.';
            if (senha.length < 6) novos.senha = 'A senha precisa ter pelo menos 6 caracteres.';
        }
        setErros(novos);
        const primeiro = ORDEM.find(c => novos[c]);
        if (primeiro) document.getElementById(campoId(primeiro))?.focus();
        return !primeiro;
    }

    async function enviar(e: React.FormEvent) {
        e.preventDefault();
        if (salvando || !conferir()) return;

        setErro('');
        setSalvando(true);
        const ala = { tipo, nome: nome.trim(), estado, cidade: cidade.trim() };
        let res: Response;
        try {
            res = await fetch(pedido ? '/api/alas/pedir' : '/api/alas/criar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(pedido
                    ? {
                        ...ala,
                        lider: { nome: liderNome.trim(), email: email.trim(), senha },
                        website,
                        tempo: Date.now() - abertoEm.current,
                    }
                    : ala),
            });
        } catch {
            setSalvando(false);
            setErro('Sem conexão com a internet. Verifique e tente de novo.');
            return;
        }
        const json = await res.json().catch(() => ({}));

        if (!res.ok) {
            setSalvando(false);
            setErro(json?.error ?? (pedido ? 'Não foi possível enviar o pedido. Tente de novo.' : 'Não foi possível criar a ala.'));
            return;
        }

        if (props.modo === 'pedido') {
            props.onEnviado(email.trim());
        } else {
            await props.onCriada(json?.ala?.id);
            setSalvando(false);
        }
    }

    const erroDe = (c: Campo) => erros[c] && (
        <p id={`${campoId(c)}-erro`} className="text-base font-medium text-accent">{erros[c]}</p>
    );
    const ligacao = (c: Campo, dica?: string) => ({
        'aria-invalid': erros[c] ? true : undefined,
        'aria-describedby': [erros[c] && `${campoId(c)}-erro`, dica].filter(Boolean).join(' ') || undefined,
    });

    return (
        <form onSubmit={enviar} noValidate className="relative flex flex-col gap-5">
            <div className="flex flex-col gap-2">
                <p id={`${id}-tipo`} className="text-base font-medium text-text">É ala ou ramo?</p>
                <ChoiceGroup
                    opcoes={[{ valor: 'ala', rotulo: 'Ala' }, { valor: 'ramo', rotulo: 'Ramo' }]}
                    ativo={tipo}
                    onChange={v => setTipo(v as TipoUnidade)}
                    labelledBy={`${id}-tipo`}
                />
            </div>

            <div className="flex flex-col gap-1.5">
                <label htmlFor={campoId('nome')} className="text-base font-medium text-text">
                    Nome {unidade}
                </label>
                <input
                    id={campoId('nome')}
                    name="nome-ala"
                    type="text"
                    autoComplete="off"
                    autoCapitalize="words"
                    placeholder="Ex.: São Lourenço"
                    value={nome}
                    onChange={e => { setNome(e.target.value); limpar('nome'); }}
                    disabled={salvando}
                    className={campoClasse(erros.nome)}
                    {...ligacao('nome', nomeFinal ? `${id}-previa` : undefined)}
                />
                {erroDe('nome')}
                {nomeFinal && (
                    <p id={`${id}-previa`} className="text-base text-muted wrap-anywhere">
                        Vai aparecer como <span className="font-semibold text-text">{nomeFinal}</span>
                        {!pedido && link && (
                            <> · link <span className="font-mono text-secondary">/{link}</span></>
                        )}
                    </p>
                )}
            </div>

            <div className="flex flex-col gap-1.5">
                <label htmlFor={campoId('estado')} className="text-base font-medium text-text">
                    Estado
                </label>
                <select
                    id={campoId('estado')}
                    name="estado-ala"
                    autoComplete="off"
                    value={estado}
                    onChange={e => { setEstado(e.target.value); limpar('estado'); }}
                    disabled={salvando}
                    className={`${campoClasse(erros.estado)} cursor-pointer`}
                    {...ligacao('estado')}
                >
                    <option value="">Escolha o estado…</option>
                    {UFS.map(uf => (
                        <option key={uf.sigla} value={uf.sigla}>{uf.nome}</option>
                    ))}
                </select>
                {erroDe('estado')}
            </div>

            <div className="flex flex-col gap-1.5">
                <label htmlFor={campoId('cidade')} className="text-base font-medium text-text">
                    Cidade
                </label>
                <input
                    id={campoId('cidade')}
                    name="cidade-ala"
                    type="text"
                    autoComplete="off"
                    autoCapitalize="words"
                    placeholder="Ex.: Curitiba"
                    value={cidade}
                    onChange={e => { setCidade(e.target.value); limpar('cidade'); }}
                    disabled={salvando}
                    className={campoClasse(erros.cidade)}
                    {...ligacao('cidade')}
                />
                {erroDe('cidade')}
            </div>

            {pedido && (
                <>
                    <div className="mt-2 flex flex-col gap-1 border-t border-slate-200 pt-5">
                        <h3 className="text-lg font-semibold text-text">Líder responsável</h3>
                        <p className="text-base text-muted">
                            Quem vai cuidar do calendário. Com este e-mail e esta senha, a pessoa entra
                            no painel depois que o pedido for aprovado.
                        </p>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label htmlFor={campoId('liderNome')} className="text-base font-medium text-text">
                            Nome
                        </label>
                        <input
                            id={campoId('liderNome')}
                            name="name"
                            type="text"
                            autoComplete="name"
                            autoCapitalize="words"
                            value={liderNome}
                            onChange={e => { setLiderNome(e.target.value); limpar('liderNome'); }}
                            disabled={salvando}
                            className={campoClasse(erros.liderNome)}
                            {...ligacao('liderNome')}
                        />
                        {erroDe('liderNome')}
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label htmlFor={campoId('email')} className="text-base font-medium text-text">
                            E-mail
                        </label>
                        <input
                            id={campoId('email')}
                            name="email"
                            type="email"
                            inputMode="email"
                            autoComplete="username"
                            autoCapitalize="none"
                            autoCorrect="off"
                            spellCheck={false}
                            value={email}
                            onChange={e => { setEmail(e.target.value); limpar('email'); }}
                            disabled={salvando}
                            className={campoClasse(erros.email)}
                            {...ligacao('email')}
                        />
                        {erroDe('email')}
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label htmlFor={campoId('senha')} className="text-base font-medium text-text">
                            Senha
                        </label>
                        <div className="relative">
                            <input
                                id={campoId('senha')}
                                name="password"
                                type={mostrarSenha ? 'text' : 'password'}
                                autoComplete="new-password"
                                value={senha}
                                onChange={e => { setSenha(e.target.value); limpar('senha'); }}
                                disabled={salvando}
                                className={`${campoClasse(erros.senha)} pr-12`}
                                {...ligacao('senha', `${id}-senha-dica`)}
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
                        <p id={`${id}-senha-dica`} className="text-base text-muted">
                            Se já tem conta no painel, use a mesma senha.
                        </p>
                        {erroDe('senha')}
                    </div>

                    <div aria-hidden="true" className="absolute -left-[9999px] top-0 h-px w-px overflow-hidden">
                        <label htmlFor={`${id}-website`}>Não preencha</label>
                        <input
                            id={`${id}-website`}
                            name="website"
                            type="text"
                            tabIndex={-1}
                            autoComplete="off"
                            value={website}
                            onChange={e => setWebsite(e.target.value)}
                        />
                    </div>
                </>
            )}

            {erro && <ErrorMessage key={erro}>{erro}</ErrorMessage>}

            {pedido ? (
                <button
                    type="submit"
                    disabled={salvando}
                    aria-busy={salvando}
                    className={`${botao('primario', 'grande')} w-full`}
                >
                    {salvando && <Spinner />}
                    {salvando ? 'Enviando…' : 'Enviar pedido'}
                </button>
            ) : (
                <div className="flex flex-wrap gap-3">
                    <button
                        type="button"
                        onClick={props.modo === 'owner' ? props.onCancelar : undefined}
                        disabled={salvando}
                        className={`${botao('secundario')} grow basis-32`}
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={salvando}
                        aria-busy={salvando}
                        className={`${botao('primario')} grow basis-40`}
                    >
                        {salvando && <Spinner className="h-4 w-4" />}
                        {salvando ? 'Criando…' : 'Criar e entrar'}
                    </button>
                </div>
            )}
        </form>
    );
}
