/**
 * Contexto e regras: leia CLAUDE.md e docs/src_components.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */

import { Flower } from '@/components/Flower';

export function HeaderBand({ title }: { title: React.ReactNode }) {
    return (
        <header className="bg-band px-4 py-8 text-white [--focus-color:var(--color-gold)] sm:px-6 sm:py-10">
            <div className="flex min-w-0 flex-col items-center gap-3 text-center">
                <h1 className="wrap-anywhere text-3xl font-semibold sm:text-4xl">{title}</h1>
                <div className="flex items-center gap-3" aria-hidden="true">
                    <span className="h-px w-12 bg-linear-to-r from-transparent to-gold/70 sm:w-20" />
                    <Flower size={26} />
                    <span className="h-px w-12 bg-linear-to-l from-transparent to-gold/70 sm:w-20" />
                </div>
            </div>
        </header>
    );
}
