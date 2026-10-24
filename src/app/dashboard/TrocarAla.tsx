'use client';

// Card de owner (renderiza só para owner — o dashboard condiciona em ctx.isOwner):
//  1. Trocar a ala em foco — <select> padrão do sistema.
//  2. Criar uma nova ala — seção separada, logo abaixo da troca. O link (slug) é
//     gerado automático do nome; "Endereço" é um campo livre (rua/número) do banco.

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { gerarSlug, normalizarNomeAla } from '@/lib/alas';
import { FUSO_PADRAO, PAISES, UFS, fusosDasAmericas } from '@/lib/localizacao';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { Spinner } from '@/components/Spinner';

type Ala = { id: number; nome: string };

export function TrocarAla({ alas, atualId }: { alas: Ala[]; atualId: number | null }) {
    const router = useRouter();

    // Texto do overlay de carregamento na tela toda (trocar de ala / entrar na nova).
    const [transicao, setTransicao] = useState<string | null>(null);

    // Formulário de nova ala.
    const [criando, setCriando] = useState(false);
    const [nome, setNome] = useState('');
    const [endereco, setEndereco] = useState('');
    // Localização da nova ala. Começa no Brasil/Paraná, onde estão as alas hoje.
    const [pais, setPais] = useState('BR');
    const [estado, setEstado] = useState('PR');
    const [cidade, setCidade] = useState('');
    const [fuso, setFuso] = useState(FUSO_PADRAO);
    const [salvando, setSalvando] = useState(false);
    const [erro, setErro] = useState('');

    const nomePreview = normalizarNomeAla(nome);
    const linkPreview = gerarSlug(nomePreview); // slug automático (só leitura)

    // Fusos das Américas (só aparecem fora do Brasil). Garante que o sugerido
    // para o país esteja na lista mesmo se o navegador não listar fusos.
    const fusos = useMemo(() => {
        const lista = fusosDasAmericas();
        return lista.includes(fuso) ? lista : [fuso, ...lista];
    }, [fuso]);

    // Trocar o país zera o estado e sugere o fuso principal dele.
    function trocarPais(codigo: string) {
        setPais(codigo);
        setEstado(codigo === 'BR' ? 'PR' : '');
        setFuso(PAISES.find(p => p.codigo === codigo)?.fuso ?? FUSO_PADRAO);
        setErro('');
    }

    // Quando a ala em foco muda (após o refresh do servidor renderizar os dados
    // novos), encerra o overlay de transição.
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setTransicao(null);
    }, [atualId]);

    async function trocar(e: React.ChangeEvent<HTMLSelectElement>) {
        const alaId = Number(e.target.value);
        if (!alaId || alaId === atualId || transicao) return;

        setTransicao('Trocando de ala…');
        const res = await fetch('/api/ala-atual', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ alaId }),
        });
        if (!res.ok) {
            setTransicao(null);
            return;
        }
        // Mantém o overlay até o efeito de [atualId] limpar (dados novos na tela).
        router.refresh();
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
        const res = await fetch('/api/alas/criar', {
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
            setTransicao('Abrindo a ala…');
        }

        resetForm();
        router.refresh();
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

    const campoClasse =
        'min-h-12 w-full rounded-xl border border-white/20 bg-white px-4 text-base text-text shadow-sm focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary disabled:opacity-60';

    return (
        <>
            {/* Carregamento na tela toda durante a troca/criação de ala. */}
            {transicao && <LoadingOverlay texto={transicao} />}

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
                            disabled={transicao !== null}
                            className="min-h-12 w-full appearance-none rounded-xl border border-white/20 bg-white px-4 pr-11 text-base font-medium text-text shadow-sm transition hover:border-secondary/70 focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary disabled:opacity-60 cursor-pointer"
                        >
                            {atualId === null && <option value="">Selecione uma ala…</option>}
                            {alas.map(a => (
                                <option key={a.id} value={a.id}>{a.nome}</option>
                            ))}
                        </select>
                        {/* appearance-none tira a setinha nativa; mostramos um chevron
                            próprio — a lista que abre continua a do sistema. */}
                        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-muted">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="m6 9 6 6 6-6" />
                            </svg>
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

                            {/* Localização: país → estado → cidade (e fuso fora do Brasil).
                                O fuso define o "hoje" e a virada do mês dessa ala. */}
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
                                aria-busy={salvando}
                                className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-secondary px-4 text-sm font-semibold text-white transition duration-100 hover:opacity-90 enabled:active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                            >
                                {salvando && <Spinner className="h-4 w-4" />}
                                {salvando ? 'Criando…' : 'Criar e entrar'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
            </div>
        </>
    );
}
