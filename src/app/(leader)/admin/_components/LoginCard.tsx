/**
 * Contexto e regras: leia CLAUDE.md e docs/routes_admin.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */

import LoginForm from './LoginForm';

export default function LoginCard({ erroInicial }: { erroInicial?: string }) {
    return (
        <div className="relative flex flex-col items-center gap-7 overflow-hidden rounded-3xl bg-background px-6 py-10 shadow-lg ring-1 ring-primary/10 sm:px-10">
            <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1.5 bg-linear-to-r from-accent via-gold to-accent" />

            <LoginForm erroInicial={erroInicial} />
        </div>
    );
}
