/**
 * Contexto e regras: leia CLAUDE.md e docs/src_components.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */

import Image from 'next/image';

export function HeaderBand({ children, className = '' }: { children?: React.ReactNode; className?: string }) {
    return (
        <header className={`bg-band relative overflow-hidden px-4 text-center text-white [--focus-color:var(--color-gold)] ${className}`}>
            {children ?? (
                <div className="flex flex-col items-center gap-3 py-7">
                    <Image
                        src="/lunchsud180x180.png"
                        alt=""
                        width={56}
                        height={56}
                        className="rounded-xl"
                    />
                    <p className="font-serif text-2xl font-semibold">Almoço dos Missionários</p>
                </div>
            )}
        </header>
    );
}
