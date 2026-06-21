'use client';

import { motion } from 'framer-motion';
import LoginForm from './LoginForm';

export default function LoginCard() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="flex flex-col items-center gap-7 rounded-3xl bg-background px-6 py-10 shadow-xl sm:px-10"
        >
            <div className="flex flex-col items-center gap-3 text-center">
                <h1 className="text-2xl font-semibold text-text sm:text-3xl">
                    Acesso do líder
                </h1>
                <span className="h-1 w-12 rounded-full bg-secondary" />
                <p className="text-sm text-muted">
                    Entre para gerenciar os almoços da sua ala.
                </p>
            </div>

            <LoginForm />
        </motion.div>
    );
}
