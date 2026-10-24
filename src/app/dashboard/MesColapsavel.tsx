'use client';

// Seção de um mês no card de Agendamentos que recolhe/expande ao clicar no nome.
// Um mês tem ~30 dias; poder recolher o de cima evita rolar tudo para editar o de baixo.

import { useState } from 'react';

type Props = {
    label: string;        // "Junho 2026"
    total: number;        // agendados no mês
    disponiveis: number;  // dias agendáveis (sem segundas)
    defaultOpen?: boolean;
    children: React.ReactNode;
};

export function MesColapsavel({ label, total, disponiveis, defaultOpen = true, children }: Props) {
    const [open, setOpen] = useState(defaultOpen);

    return (
        <section className="py-5 first:pt-0 last:pb-0">
            {/* Cabeçalho clicável: recolhe/expande a lista de dias do mês. */}
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                aria-expanded={open}
                className="group -mx-2 flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl px-2 py-1.5 text-left transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
            >
                <span className="flex items-center gap-2">
                    {/* Seta que gira conforme aberto/fechado. */}
                    <svg
                        width="18" height="18" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                        aria-hidden="true"
                        className={`text-muted transition duration-200 group-hover:text-secondary ${open ? '' : '-rotate-90'}`}
                    >
                        <path d="M6 9l6 6 6-6" />
                    </svg>
                    <h3 className="text-base font-semibold text-text transition-colors group-hover:text-secondary">{label}</h3>
                </span>
                <span className="rounded-full bg-accent/10 px-3 py-1 text-sm font-medium text-accent whitespace-nowrap">
                    {total} de {disponiveis} dias
                </span>
            </button>

            {/* Abre/fecha animando a altura só com CSS: a linha do grid vai de 0fr a
                1fr. Fechado, o conteúdo fica `inert` (fora do Tab e do leitor de tela). */}
            <div
                className={`grid transition-[grid-template-rows,opacity] duration-200 ease-out ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
            >
                <div className="overflow-hidden" inert={!open}>
                    <div className="pt-3">{children}</div>
                </div>
            </div>
        </section>
    );
}
