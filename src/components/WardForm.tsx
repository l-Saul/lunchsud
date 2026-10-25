/**
 * Contexto e regras: leia CLAUDE.md e docs/src_components.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */
'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { gerarSlug, nomeSemTipo, normalizarCidade, normalizarNomeAla, type TipoUnidade } from '@/lib/wards';
import { UFS } from '@/lib/location';
import { ChoiceGroup } from '@/components/ChoiceGroup';
import { SelectField } from '@/components/SelectField';
import { Spinner } from '@/components/Spinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import { botao } from '@/components/button-classes';
import { campo, rotulo } from '@/components/field-classes';
import {
    AccountFields,
    CONTA_VAZIA,
    ORDEM_CONTA,
    conferirConta,
    idDoCampoConta,
    type CampoConta,
    type ErrosConta,
} from '@/components/AccountFields';

export type ContaLogada = { nome: string; email: string; ala: string | null };

type Props =
    | { modo: 'owner'; onCriada: (novaId: number | undefined) => Promise<void>; onCancelar: () => void }
    | { modo: 'pedido'; onEnviado: (email: string, usouConta: boolean) => void; contaLogada?: ContaLogada | null };

type CampoAla = 'nome' | 'estado' | 'cidade';
const ORDEM_ALA: CampoAla[] = ['nome', 'estado', 'cidade'];

export function WardForm(props: Props) {
    const pedido = props.modo === 'pedido';
    const contaLogada = props.modo === 'pedido' ? props.contaLogada ?? null : null;
    const id = useId();
    const [tipo, setTipo] = useState<TipoUnidade>('ala');
    const [nome, setNome] = useState('');
    const [estado, setEstado] = useState('');
    const [cidade, setCidade] = useState('');
    const [conta, setConta] = useState(CONTA_VAZIA);
    const [website, setWebsite] = useState('');
    const [usarConta, setUsarConta] = useState(contaLogada !== null);
    const [erros, setErros] = useState<Partial<Record<CampoAla, string>>>({});
    const [errosConta, setErrosConta] = useState<ErrosConta>({});
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

    const campoId = (c: CampoAla) => `${id}-${c}`;
    const prefixoConta = `${id}-lider-`;

    function mudar(c: CampoAla, valor: string, setter: (v: string) => void) {
        setter(valor);
        setErro('');
        if (erros[c]) setErros(e => ({ ...e, [c]: undefined }));
    }

    function mudarConta(c: CampoConta, valor: string) {
        setConta(d => ({ ...d, [c]: valor }));
        setErro('');
        if (errosConta[c]) setErrosConta(e => ({ ...e, [c]: undefined }));
    }

    function conferir() {
        const novos: Partial<Record<CampoAla, string>> = {};
        if (!nomeFinal) novos.nome = `Digite o nome ${unidade}.`;
        if (!estado) novos.estado = 'Escolha o estado.';
        if (cidade.trim().length < 2) novos.cidade = 'Digite a cidade.';
        const novosConta = pedido && !usarConta ? conferirConta(conta) : {};
        setErros(novos);
        setErrosConta(novosConta);

        const primeiroAla = ORDEM_ALA.find(c => novos[c]);
        const primeiroConta = ORDEM_CONTA.find(c => novosConta[c]);
        const alvo = primeiroAla ? campoId(primeiroAla) : primeiroConta ? idDoCampoConta(primeiroConta, prefixoConta) : null;
        if (alvo) document.getElementById(alvo)?.focus();
        return !alvo;
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
                        ...(usarConta
                            ? { usarConta: true }
                            : { lider: { nome: conta.nome.trim(), email: conta.email.trim(), senha: conta.senha } }),
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
            props.onEnviado(usarConta && contaLogada ? contaLogada.email : conta.email.trim().toLowerCase(), usarConta);
        } else {
            await props.onCriada(json?.ala?.id);
            setSalvando(false);
        }
    }

    const erroDe = (c: CampoAla) => erros[c] && (
        <p id={`${campoId(c)}-erro`} className="text-base font-semibold text-accent">{erros[c]}</p>
    );
    const ligacao = (c: CampoAla, dica?: string) => ({
        'aria-invalid': erros[c] ? true : undefined,
        'aria-describedby': [erros[c] && `${campoId(c)}-erro`, dica].filter(Boolean).join(' ') || undefined,
    });

    return (
        <form onSubmit={enviar} noValidate className="relative flex flex-col gap-5">
            <div className="flex flex-col gap-2">
                <p id={`${id}-tipo`} className={rotulo}>É ala ou ramo?</p>
                <ChoiceGroup
                    opcoes={[{ valor: 'ala', rotulo: 'Ala' }, { valor: 'ramo', rotulo: 'Ramo' }]}
                    ativo={tipo}
                    onChange={v => setTipo(v as TipoUnidade)}
                    labelledBy={`${id}-tipo`}
                />
            </div>

            <div className="flex flex-col gap-1.5">
                <label htmlFor={campoId('nome')} className={rotulo}>Nome {unidade}</label>
                <input
                    id={campoId('nome')}
                    name="nome-ala"
                    type="text"
                    autoComplete="off"
                    autoCapitalize="words"
                    placeholder="Ex.: São Lourenço"
                    value={nome}
                    onChange={e => mudar('nome', e.target.value, setNome)}
                    disabled={salvando}
                    className={campo(!!erros.nome)}
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
                <label htmlFor={campoId('estado')} className={rotulo}>Estado</label>
                <SelectField
                    id={campoId('estado')}
                    name="estado-ala"
                    autoComplete="off"
                    value={estado}
                    onChange={e => mudar('estado', e.target.value, setEstado)}
                    disabled={salvando}
                    erro={!!erros.estado}
                    {...ligacao('estado')}
                >
                    <option value="">Escolha…</option>
                    {UFS.map(uf => (
                        <option key={uf.sigla} value={uf.sigla}>{uf.nome}</option>
                    ))}
                </SelectField>
                {erroDe('estado')}
            </div>

            <div className="flex flex-col gap-1.5">
                <label htmlFor={campoId('cidade')} className={rotulo}>Cidade</label>
                <input
                    id={campoId('cidade')}
                    name="cidade-ala"
                    type="text"
                    autoComplete="off"
                    autoCapitalize="words"
                    placeholder="Ex.: Curitiba"
                    value={cidade}
                    onChange={e => mudar('cidade', e.target.value, setCidade)}
                    disabled={salvando}
                    className={campo(!!erros.cidade)}
                    {...ligacao('cidade')}
                />
                {erroDe('cidade')}
            </div>

            {pedido && (
                <>
                    <div className="mt-2 flex flex-col gap-1 border-t border-slate-200 pt-5">
                        <h3 id={`${id}-lider`} className="text-lg font-semibold text-text">Líder responsável</h3>
                        <p className="text-base text-muted">
                            {contaLogada
                                ? 'Quem vai cuidar do calendário. Pode ser a sua conta ou uma conta nova.'
                                : 'Crie a conta de quem vai cuidar do calendário. Com este e-mail e esta senha, a pessoa entra no painel depois que o pedido for aprovado.'}
                        </p>
                    </div>

                    {contaLogada && (
                        <ChoiceGroup
                            opcoes={[{ valor: 'minha', rotulo: 'Minha conta' }, { valor: 'nova', rotulo: 'Conta nova' }]}
                            ativo={usarConta ? 'minha' : 'nova'}
                            onChange={v => { setUsarConta(v === 'minha'); setErro(''); }}
                            labelledBy={`${id}-lider`}
                        />
                    )}

                    {contaLogada && usarConta ? (
                        <div className="flex flex-col gap-3">
                            <p className="text-base text-text wrap-anywhere">
                                Você entrou como <strong>{contaLogada.nome || contaLogada.email}</strong>
                                {contaLogada.nome && <> ({contaLogada.email})</>}. O pedido vai com esta conta.
                            </p>
                            {contaLogada.ala && (
                                <p className="rounded-xl bg-accent-soft px-3 py-2.5 text-base font-semibold text-accent">
                                    Atenção: ao enviar, você perde o acesso à <strong>{contaLogada.ala}</strong>. Para
                                    manter, escolha &quot;Conta nova&quot;.
                                </p>
                            )}
                        </div>
                    ) : (
                        <AccountFields
                            modo="criar"
                            dados={conta}
                            onChange={mudarConta}
                            erros={errosConta}
                            disabled={salvando}
                            prefixo={prefixoConta}
                        />
                    )}

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
