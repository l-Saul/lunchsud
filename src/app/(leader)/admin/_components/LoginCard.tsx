/**
 * Contexto e regras: leia CLAUDE.md e docs/routes_admin.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */

import LoginForm from './LoginForm';
import { Flower } from '@/components/Flower';

export default function LoginCard({ erroInicial }: { erroInicial?: string }) {
    return (
        <div className="relative flex flex-col items-center gap-7 overflow-hidden rounded-3xl bg-background px-6 py-10 shadow-2xl ring-1 ring-white/40 sm:px-10">
            <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1.5 bg-linear-to-r from-accent via-gold to-accent" />

            <div className="flex flex-col items-center gap-3 text-center">
                <h1 className="text-2xl font-semibold text-text sm:text-3xl">
                    Acesso do líder
                </h1>
                <div className="flex items-center gap-3" aria-hidden="true">
                    <span className="h-px w-8 bg-linear-to-r from-transparent to-gold/70" />
                    <Flower size={20} />
                    <span className="h-px w-8 bg-linear-to-l from-transparent to-gold/70" />
                </div>
                <p className="text-sm text-muted">
                    Entre para gerenciar os almoços da sua ala.
                </p>
            </div>

            <LoginForm erroInicial={erroInicial} />
        </div>
    );
}
