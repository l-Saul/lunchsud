/**
 * Contexto e regras: leia CLAUDE.md e docs/src_components.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */
'use client';

import { nomeDoMes } from '@/lib/date';

type Props = {
    meses: string[];
    ativo: string;
    onChange: (ym: string) => void;
    label: string;
};

export function MonthTabs({ meses, ativo, onChange, label }: Props) {
    return (
        <div className="@container">
            <div role="group" aria-label={label} className="grid grid-cols-2 gap-2 @max-[15rem]:grid-cols-1">
                {meses.map(ym => {
                    const escolhido = ym === ativo;
                    return (
                        <button
                            key={ym}
                            type="button"
                            aria-pressed={escolhido}
                            onClick={() => {
                                if (!escolhido) onChange(ym);
                            }}
                            className={`flex min-h-13 items-center justify-center gap-2 rounded-xl border-2 border-secondary px-3 py-2 text-lg font-semibold transition duration-100 active:scale-[0.98] ${
                                escolhido
                                    ? 'bg-secondary text-white shadow-md cursor-default'
                                    : 'bg-white text-secondary hover:bg-secondary/10 cursor-pointer'
                            }`}
                        >
                            {escolhido && (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0">
                                    <path d="M20 6 9 17l-5-5" />
                                </svg>
                            )}
                            {nomeDoMes(ym)}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
