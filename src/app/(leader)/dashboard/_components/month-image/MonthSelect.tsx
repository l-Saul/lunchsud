'use client';

import { useEffect, useRef, useState } from 'react';
import { formatMonthLabel } from '@/lib/date';

// Dropdown de mês customizado (o <select> nativo posicionava/dimensionava mal dentro
// dos cards animados). Recebe a lista 'YYYY-MM' e devolve a escolha por onChange.
export function MonthSelect({
    meses,
    value,
    onChange,
}: {
    meses: string[];
    value: string;
    onChange: (mes: string) => void;
}) {
    const [aberto, setAberto] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    // Fecha o menu ao clicar fora dele.
    useEffect(() => {
        if (!aberto) return;

        function onDoc(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setAberto(false);
            }
        }

        document.addEventListener('mousedown', onDoc);
        return () => document.removeEventListener('mousedown', onDoc);
    }, [aberto]);

    return (
        <div ref={ref} className="relative flex-1 sm:w-44 sm:flex-none">
            <button
                type="button"
                onClick={() => setAberto(o => !o)}
                aria-haspopup="listbox"
                aria-expanded={aberto}
                className="flex w-full items-center justify-between gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-left text-sm font-medium text-text transition hover:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary cursor-pointer"
            >
                <span>{formatMonthLabel(value)}</span>
                <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    className={`shrink-0 text-muted transition-transform ${aberto ? 'rotate-180' : ''}`}
                >
                    <path d="M6 9l6 6 6-6" />
                </svg>
            </button>

            {/* Menu ancorado logo abaixo do botão, com a largura dele. */}
            {aberto && (
                <ul
                    role="listbox"
                    className="absolute left-0 top-full z-20 mt-1 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg"
                >
                    {meses.map(m => (
                        <li key={m}>
                            <button
                                type="button"
                                role="option"
                                aria-selected={m === value}
                                onClick={() => {
                                    onChange(m);
                                    setAberto(false);
                                }}
                                className={`block w-full px-3 py-2.5 text-left text-sm transition hover:bg-secondary/10 cursor-pointer ${
                                    m === value ? 'font-semibold text-secondary' : 'text-text'
                                }`}
                            >
                                {formatMonthLabel(m)}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
