/**
 * Contexto e regras: leia CLAUDE.md e docs/routes_dashboard.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */
'use client';

import { useMemo, useState } from 'react';
import { gerarSlug, normalizarNomeAla } from '@/lib/wards';
import { FUSO_PADRAO, PAISES, UFS, fusosDasAmericas } from '@/lib/location';
import { Spinner } from '@/components/Spinner';

const campoClasse =
    'min-h-12 w-full rounded-xl border border-white/20 bg-white px-4 text-base text-text shadow-sm focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary disabled:opacity-60';

export function CreateWardForm({ onCreated }: { onCreated: (novaId: number | undefined) => Promise<void> }) {
    const [criando, setCriando] = useState(false);
    const [nome, setNome] = useState('');
    const [endereco, setEndereco] = useState('');
    const [pais, setPais] = useState('BR');
    const [estado, setEstado] = useState('PR');
    const [cidade, setCidade] = useState('');
    const [fuso, setFuso] = useState(FUSO_PADRAO);
    const [salvando, setSalvando] = useState(false);
    const [erro, setErro] = useState('');

    const nomePreview = normalizarNomeAla(nome);
    const linkPreview = gerarSlug(nomePreview);

    const fusos = useMemo(() => {
        const lista = fusosDasAmericas();
        return lista.includes(fuso) ? lista : [fuso, ...lista];
    }, [fuso]);

    function trocarPais(codigo: string) {
        setPais(codigo);
        setEstado(codigo === 'BR' ? 'PR' : '');
        setFuso(PAISES.find(p => p.codigo === codigo)?.fuso ?? FUSO_PADRAO);
        setErro('');
    }

    async function criarAla(e: React.FormEvent) {
        e.preventDefault();
        if (salvando) return;

        if (!nome.trim()) {
            setErro('Digite o nome da ala.');
            return;
        }
        if (!estado.trim()) {
            setErro(pais === 'BR' ? 'Escolha o estado.' : 'Informe o estado ou província.');
            return;
        }
        if (cidade.trim().length < 2) {
            setErro('Informe a cidade.');
            return;
        }

        setErro('');
        setSalvando(true);
        let res: Response;
        try {
            res = await fetch('/api/alas/criar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nome: nome.trim(),
                    endereco: endereco.trim(),
                    pais,
                    estado: estado.trim(),
                    cidade: cidade.trim(),
                    fuso,
                }),
            });
        } catch {
            setSalvando(false);
            setErro('Sem conexão com a internet. Verifique e tente de novo.');
            return;
        }
        const json = await res.json().catch(() => ({}));

        if (!res.ok) {
            setSalvando(false);
            setErro(json?.error ?? 'Não foi possível criar a ala.');
            return;
        }

        await onCreated(json?.ala?.id);
        resetForm();
    }

    function resetForm() {
        setSalvando(false);
        setCriando(false);
        setNome('');
        setEndereco('');
        setPais('BR');
        setEstado('PR');
        setCidade('');
        setFuso(FUSO_PADRAO);
        setErro('');
    }

    if (!criando) {
        return (
            <button
                type="button"
                onClick={() => setCriando(true)}
                className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/30 px-4 text-sm font-semibold text-white/90 transition hover:border-solid hover:border-secondary hover:bg-secondary/15 hover:text-white cursor-pointer"
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 5v14M5 12h14" />
                </svg>
                Criar nova ala
            </button>
        );
    }

    return (
        <form onSubmit={criarAla} className="flex animate-aparecer flex-col gap-3">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Nova ala</h3>
                <button
                    type="button"
                    onClick={resetForm}
                    disabled={salvando}
                    aria-label="Cancelar"
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-white/70 transition hover:bg-white/10 disabled:opacity-50 cursor-pointer"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M18 6 6 18M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <div className="flex flex-col gap-1.5">
                <label htmlFor="nova-ala-nome" className="text-sm font-medium text-white/90">
                    Nome da nova ala
                </label>
                <input
                    id="nova-ala-nome"
                    autoComplete="off"
                    type="text"
                    autoFocus
                    placeholder="Ex.: São Lourenço"
                    value={nome}
                    onChange={e => { setNome(e.target.value); setErro(''); }}
                    disabled={salvando}
                    className={campoClasse}
                />
                {nome.trim() && (
                    <p className="text-xs text-white/70">
                        Será salva como <span className="font-medium text-white">{nomePreview}</span>
                        {linkPreview && (
                            <> · link <span className="font-mono text-secondary">/{linkPreview}</span></>
                        )}
                    </p>
                )}
            </div>

            <div className="flex flex-col gap-1.5">
                <label htmlFor="nova-ala-pais" className="text-sm font-medium text-white/90">
                    País
                </label>
                <select
                    id="nova-ala-pais"
                    value={pais}
                    onChange={e => trocarPais(e.target.value)}
                    disabled={salvando}
                    className={campoClasse}
                >
                    {PAISES.map(p => (
                        <option key={p.codigo} value={p.codigo}>{p.nome}</option>
                    ))}
                </select>
            </div>

            <div className="flex flex-col gap-1.5">
                <label htmlFor="nova-ala-estado" className="text-sm font-medium text-white/90">
                    {pais === 'BR' ? 'Estado' : 'Estado ou província'}
                </label>
                {pais === 'BR' ? (
                    <select
                        id="nova-ala-estado"
                        value={estado}
                        onChange={e => { setEstado(e.target.value); setErro(''); }}
                        disabled={salvando}
                        className={campoClasse}
                    >
                        <option value="">Selecione…</option>
                        {UFS.map(uf => (
                            <option key={uf.sigla} value={uf.sigla}>{uf.nome}</option>
                        ))}
                    </select>
                ) : (
                    <input
                        id="nova-ala-estado"
                        type="text"
                        autoComplete="off"
                        placeholder="Ex.: Utah, Buenos Aires"
                        value={estado}
                        onChange={e => { setEstado(e.target.value); setErro(''); }}
                        disabled={salvando}
                        className={campoClasse}
                    />
                )}
            </div>

            <div className="flex flex-col gap-1.5">
                <label htmlFor="nova-ala-cidade" className="text-sm font-medium text-white/90">
                    Cidade
                </label>
                <input
                    id="nova-ala-cidade"
                    autoComplete="off"
                    type="text"
                    placeholder="Ex.: Curitiba"
                    value={cidade}
                    onChange={e => { setCidade(e.target.value); setErro(''); }}
                    disabled={salvando}
                    className={campoClasse}
                />
            </div>

            {pais !== 'BR' && (
                <div className="flex flex-col gap-1.5">
                    <label htmlFor="nova-ala-fuso" className="text-sm font-medium text-white/90">
                        Fuso horário
                    </label>
                    <select
                        id="nova-ala-fuso"
                        value={fuso}
                        onChange={e => { setFuso(e.target.value); setErro(''); }}
                        disabled={salvando}
                        className={campoClasse}
                    >
                        {fusos.map(f => (
                            <option key={f} value={f}>{f.replace('America/', '').replaceAll('_', ' ')}</option>
                        ))}
                    </select>
                </div>
            )}

            <div className="flex flex-col gap-1.5">
                <label htmlFor="nova-ala-endereco" className="text-sm font-medium text-white/90">
                    Endereço <span className="font-normal text-white/50">(opcional)</span>
                </label>
                <input
                    id="nova-ala-endereco"
                    autoComplete="off"
                    type="text"
                    placeholder="Ex.: Rua das Flores, 123 — Centro"
                    value={endereco}
                    onChange={e => { setEndereco(e.target.value); setErro(''); }}
                    disabled={salvando}
                    className={campoClasse}
                />
            </div>

            {erro && (
                <p role="alert" className="text-sm font-medium text-accent">{erro}</p>
            )}

            <button
                type="submit"
                disabled={salvando || !nome.trim()}
                aria-busy={salvando}
                className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-secondary px-4 text-sm font-semibold text-white transition duration-100 hover:opacity-90 enabled:active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
                {salvando && <Spinner className="h-4 w-4" />}
                {salvando ? 'Criando…' : 'Criar e entrar'}
            </button>
        </form>
    );
}
