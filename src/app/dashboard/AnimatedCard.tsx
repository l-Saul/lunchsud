'use client';

// Card que entra com um fade-up suave. `delay` permite escalonar a entrada de
// vários cards (ex.: o painel usa 0.05 e 0.12 para um aparecer logo após o outro).
// Só apresentação — não tem estado nem lógica; recebe estilo via `className`.

import { motion } from 'framer-motion';

export function AnimatedCard({
    children,
    delay = 0,
    className,
}: {
    children: React.ReactNode;
    delay?: number;
    className?: string;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut', delay }}
            className={className}
        >
            {children}
        </motion.div>
    );
}
