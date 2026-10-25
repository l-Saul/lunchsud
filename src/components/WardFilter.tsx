/**
 * Contexto e regras: leia CLAUDE.md e docs/src_components.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */
'use client';

import { useId, useState } from 'react';
import { nomeDaUf } from '@/lib/location';
import { SelectField } from '@/components/SelectField';
import { Spinner } from '@/components/Spinner';
import { rotulo } from '@/components/field-classes';

export type AlaDoFiltro = { chave: string; nome: string; estado: string; cidade: string };

type Props = {
    alas: AlaDoFiltro[];
    instrucao: string;
    onEscolher: (ala: AlaDoFiltro) => void;
    marcada?: string | null;
    ocupada?: string | null;
    textoOcupado?: string;
    desativado?: boolean;
};

const emOrdem = (a: string, b: string) => a.localeCompare(b, 'pt-BR');

const BOTAO_ALA =
    'group relative flex min-h-16 w-full items-center justify-between gap-4 overflow-hidden rounded-2xl ' +
    'px-6 py-4 text-left text-xl font-semibold shadow-md ring-1 ring-primary/10 ' +
    'transition duration-100 enabled:active:scale-[0.98] cursor-pointer disabled:cursor-default';
const ALA_AZUL = 'bg-secondary text-white';
const ALA_BRANCA = 'bg-white text-primary enabled:hover:bg-secondary enabled:hover:text-white enabled:hover:shadow-xl';

export function WardFilter({ alas, instrucao, onEscolher, marcada, ocupada, textoOcupado = 'Abrindo…', desativado = false }: Props) {
    const id = useId();
    const [estado, setEstado] = useState('');
    const [cidade, setCidade] = useState('');

    const estados = [...new Set(alas.map(a => a.estado))].sort((a, b) => emOrdem(nomeDaUf(a), nomeDaUf(b)));
    const cidades = [...new Set(alas.filter(a => a.estado === estado).map(a => a.cidade))].sort(emOrdem);

    const daCidade = alas.filter(a => a.estado === estado && a.cidade === cidade);
    const comMarca = marcada !== undefined;

    return (
        <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
                <label htmlFor={`${id}-estado`} className={rotulo}>Estado</label>
                <SelectField
                    id={`${id}-estado`}
                    autoComplete="off"
                    value={estado}
                    onChange={e => {
                        setEstado(e.target.value);
                        setCidade('');
                    }}
                >
                    <option value="">Escolha…</option>
                    {estados.map(uf => (
                        <option key={uf} value={uf}>{nomeDaUf(uf)}</option>
                    ))}
                </SelectField>
            </div>

            <div className="flex flex-col gap-1.5">
                <label htmlFor={`${id}-cidade`} className={rotulo}>Cidade</label>
                <SelectField
                    id={`${id}-cidade`}
                    autoComplete="off"
                    value={cidade}
                    onChange={e => setCidade(e.target.value)}
                    disabled={!estado}
                >
                    <option value="">Escolha…</option>
                    {cidades.map(c => (
                        <option key={c} value={c}>{c}</option>
                    ))}
                </SelectField>
            </div>

            {cidade && daCidade.length > 0 && (
                <div className="flex flex-col gap-3">
                    <p id={`${id}-instrucao`} className="text-lg text-text">{instrucao}</p>
                    <ul aria-labelledby={`${id}-instrucao`} className="flex flex-col gap-3">
                        {daCidade.map(ala => {
                            const escolhida = comMarca && ala.chave === marcada;
                            const carregando = ala.chave === ocupada;
                            const azul = escolhida || carregando;
                            return (
                                <li key={ala.chave}>
                                    <button
                                        type="button"
                                        disabled={desativado || !!ocupada}
                                        aria-pressed={comMarca ? escolhida : undefined}
                                        aria-busy={carregando || undefined}
                                        onClick={() => onEscolher(ala)}
                                        className={`${BOTAO_ALA} ${azul ? ALA_AZUL : ALA_BRANCA}`}
                                    >
                                        <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1.5 bg-linear-to-b from-accent via-gold to-accent" />
                                        <span className="min-w-0 hyphens-auto wrap-break-word">{ala.nome}</span>
                                        {carregando ? (
                                            <span className="flex shrink-0 items-center gap-2 text-base">
                                                {textoOcupado}
                                                <Spinner />
                                            </span>
                                        ) : escolhida ? (
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0">
                                                <path d="M20 6 9 17l-5-5" />
                                            </svg>
                                        ) : (
                                            <span aria-hidden="true" className="text-2xl leading-none text-secondary transition group-hover:text-white">›</span>
                                        )}
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}
        </div>
    );
}
