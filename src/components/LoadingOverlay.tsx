'use client';

// Overlay de carregamento na tela TODA (fundo desfocado + spinner). Usado em
// transições que demoram um instante — ex.: o owner trocando de ala — para deixar
// claro, visualmente, que algo está acontecendo. Renderize dentro de um
// <AnimatePresence> para o fade de saída.

import { motion } from 'framer-motion';

export function LoadingOverlay({ texto = 'Carregando…' }: { texto?: string }) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            role="status"
            aria-live="polite"
            className="fixed inset-0 z-80 flex flex-col items-center justify-center gap-4 bg-primary/45 backdrop-blur-sm"
        >
            <span className="h-12 w-12 animate-spin rounded-full border-4 border-white/30 border-t-white" />
            <span className="text-base font-medium text-white drop-shadow-sm">{texto}</span>
        </motion.div>
    );
}
