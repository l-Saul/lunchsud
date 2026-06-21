'use client';

// Card de owner (renderiza só para owner — o dashboard condiciona em ctx.isOwner):
//  1. Trocar a ala em foco — <select> padrão do sistema.
//  2. Criar uma nova ala — seção separada, logo abaixo da troca. O link (slug) é
//     gerado automático do nome; "Endereço" é um campo livre (rua/número) do banco.

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { gerarSlug, normalizarNomeAla } from '@/lib/alas';

type Ala = { id: number; nome: string };

export function TrocarAla({ alas, atualId }: { alas: Ala[]; atualId: number | null }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    // Formulário de nova ala.
    const [criando, setCriando] = useState(false);
    const [nome, setNome] = useState('');
    const [endereco, setEndereco] = useState('');
    const [salvando, setSalvando] = useState(false);
    const [erro, setErro] = useState('');

    const nomePreview = normalizarNomeAla(nome);
    const linkPreview = gerarSlug(nomePreview); // slug automático (só leitura)

    async function trocar(e: React.ChangeEvent<HTMLSelectElement>) {
        const alaId = Number(e.target.value);
        if (!alaId || alaId === atualId || loading) return;

        setLoading(true);
        const res = await fetch('/api/ala-atual', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ alaId }),
        });
        setLoading(false);
        if (res.ok) router.refresh();
    }

    async function criarAla(e: React.FormEvent) {
        e.preventDefault();
        if (salvando) return;

        if (!nome.trim()) {
            setErro('Digite o nome da ala.');
            return;
        }

        setErro('');
        setSalvando(true);
        const res = await fetch('/api/alas/criar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome: nome.trim(), endereco: endereco.trim() }),
        });
        const json = await res.json().catch(() => ({}));

        if (!res.ok) {
            setSalvando(false);
            setErro(json?.error ?? 'Não foi possível criar a ala.');
            return;
        }

        // Já entra na ala recém-criada (foca ela) e recarrega o painel.
        const novaId: number | undefined = json?.ala?.id;
        if (novaId) {
            await fetch('/api/ala-atual', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ alaId: novaId }),
            });
        }

        resetForm();
        router.refresh();
    }

    function resetForm() {
        setSalvando(false);
        setCriando(false);
        setNome('');
        setEndereco('');
        setErro('');
    }

    return (
        <div className="relative rounded-2xl bg-linear-to-br from-white/15 to-white/5 p-px shadow-lg ring-1 ring-white/20">
            <div className="flex flex-col gap-3 rounded-2xl bg-primary/40 px-4 py-4 backdrop-blur-sm">
                {/* Cabeçalho — papel do usuário (owner) com ícone de pessoa */}
                <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white ring-1 ring-white/20">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                        </svg>
                    </span>
                    <div className="flex flex-col leading-tight">
                        <span className="text-sm font-semibold text-white">Acesso owner</span>
                        <span className="text-xs text-white/60">Acesso a todas as alas</span>
                    </div>
                </div>

                {/* Trocar de ala — select padrão do sistema */}
                <div className="flex flex-col gap-1.5">
                    <label htmlFor="trocar-ala" className="text-sm font-medium text-white/90">
                        Trocar de ala
                    </label>
                    <div className="relative">
                        <select
                            id="trocar-ala"
                            value={atualId ?? ''}
                            onChange={trocar}
                            disabled={loading}
                            className="min-h-12 w-full appearance-none rounded-xl border border-white/20 bg-white px-4 pr-11 text-base font-medium text-text shadow-sm transition hover:border-secondary/70 focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary disabled:opacity-60 cursor-pointer"
                        >
                            {atualId === null && <option value="">Selecione uma ala…</option>}
                            {alas.map(a => (
                                <option key={a.id} value={a.id}>{a.nome}</option>
                            ))}
                        </select>
                        {/* appearance-none tira a setinha nativa; mostramos um chevron próprio
                            (ou o spinner ao trocar) — a lista que abre continua a do sistema. */}
                        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-muted">
                            {loading ? (
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-secondary/40 border-t-secondary" />
                            ) : (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                    <path d="m6 9 6 6 6-6" />
                                </svg>
                            )}
                        </span>
                    </div>
                </div>

                {/* Seção "Criar nova ala" — abaixo da troca, separada por uma linha */}
                <div className="border-t border-white/10 pt-3">
                    {!criando ? (
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
                    ) : (
                        <motion.form
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.2 }}
                            onSubmit={criarAla}
                            className="flex flex-col gap-3"
                        >
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

                            {/* Nome */}
                            <div className="flex flex-col gap-1.5">
                                <label htmlFor="nova-ala-nome" className="text-sm font-medium text-white/90">
                                    Nome da nova ala
                                </label>
                                <input
                                    id="nova-ala-nome"
                                    type="text"
                                    autoFocus
                                    placeholder="Ex.: São Lourenço"
                                    value={nome}
                                    onChange={e => { setNome(e.target.value); setErro(''); }}
                                    disabled={salvando}
                                    className="min-h-12 w-full rounded-xl border border-white/20 bg-white px-4 text-base text-text shadow-sm focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary disabled:opacity-60"
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

                            {/* Endereço (rua/número) — campo livre, opcional */}
                            <div className="flex flex-col gap-1.5">
                                <label htmlFor="nova-ala-endereco" className="text-sm font-medium text-white/90">
                                    Endereço <span className="font-normal text-white/50">(opcional)</span>
                                </label>
                                <input
                                    id="nova-ala-endereco"
                                    type="text"
                                    placeholder="Ex.: Rua das Flores, 123 — Centro"
                                    value={endereco}
                                    onChange={e => { setEndereco(e.target.value); setErro(''); }}
                                    disabled={salvando}
                                    className="min-h-12 w-full rounded-xl border border-white/20 bg-white px-4 text-base text-text shadow-sm focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary disabled:opacity-60"
                                />
                            </div>

                            {erro && (
                                <p role="alert" className="text-sm font-medium text-accent">{erro}</p>
                            )}

                            <button
                                type="submit"
                                disabled={salvando || !nome.trim()}
                                className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-secondary px-4 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50 cursor-pointer"
                            >
                                {salvando && (
                                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                                )}
                                {salvando ? 'Criando…' : 'Criar e entrar'}
                            </button>
                        </motion.form>
                    )}
                </div>
            </div>
        </div>
    );
}
