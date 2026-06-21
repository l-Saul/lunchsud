'use client';

import { motion } from 'framer-motion';
import LoginForm from './LoginForm';
import { Flor } from '@/components/Flor';

export default function LoginCard() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="relative flex flex-col items-center gap-7 overflow-hidden rounded-3xl bg-background px-6 py-10 shadow-2xl ring-1 ring-white/40 sm:px-10"
        >
            {/* Fitinha de acento no topo (verde → rosa → verde). */}
            <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1.5 bg-linear-to-r from-secondary via-accent to-secondary" />

            <div className="flex flex-col items-center gap-3 text-center">
                <h1 className="text-2xl font-semibold text-text sm:text-3xl">
                    Acesso do líder
                </h1>
                {/* Divisória com florzinha — cohesão com o restante do site */}
                <div className="flex items-center gap-3" aria-hidden="true">
                    <span className="h-px w-8 bg-linear-to-r from-transparent to-secondary/70" />
                    <Flor size={20} />
                    <span className="h-px w-8 bg-linear-to-l from-transparent to-secondary/70" />
                </div>
                <p className="text-sm text-muted">
                    Entre para gerenciar os almoços da sua ala.
                </p>
            </div>

            <LoginForm />
        </motion.div>
    );
}
