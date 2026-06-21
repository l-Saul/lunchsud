'use client';

// Seção de um mês no card de Agendamentos que recolhe/expande ao clicar no nome.
// Um mês tem ~30 dias; poder recolher o de cima evita rolar tudo para editar o de baixo.

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
                className="flex w-full items-center justify-between gap-2 rounded-xl text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
            >
                <span className="flex items-center gap-2">
                    {/* Seta que gira conforme aberto/fechado. */}
                    <motion.svg
                        width="18" height="18" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                        aria-hidden="true" className="text-muted"
                        animate={{ rotate: open ? 0 : -90 }}
                        transition={{ duration: 0.2 }}
                    >
                        <path d="M6 9l6 6 6-6" />
                    </motion.svg>
                    <h3 className="text-base font-semibold text-text">{label}</h3>
                </span>
                <span className="rounded-full bg-accent/10 px-3 py-1 text-sm font-medium text-accent whitespace-nowrap">
                    {total} de {disponiveis} dias
                </span>
            </button>

            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        key="conteudo"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                        className="overflow-hidden"
                    >
                        <div className="pt-3">{children}</div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
}
