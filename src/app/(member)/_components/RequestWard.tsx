/**
 * Contexto e regras: leia CLAUDE.md e docs/routes_home.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */
'use client';

import { useEffect, useState } from 'react';
import { WardRequestModal } from '@/components/WardRequestModal';
import { botao } from '@/components/button-classes';

export function RequestWard() {
    const [aberto, setAberto] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (window.location.hash === '#nova-ala') setAberto(true);
    }, []);

    return (
        <section id="nova-ala" aria-labelledby="nova-ala-titulo" className="scroll-mt-6">
            <div className="flex flex-col gap-4 rounded-2xl bg-background p-5 shadow-md ring-1 ring-primary/10 sm:p-6">
                <div>
                    <h2 id="nova-ala-titulo" className="text-xl font-semibold text-text">
                        Sua ala ou ramo ainda não usa o calendário?
                    </h2>
                    <p className="mt-2 text-base text-muted">
                        Quem faz parte da presidência pode pedir. Quando o pedido for aprovado, a ala
                        aparece aqui e chega um e-mail.
                    </p>
                </div>
                <button type="button" onClick={() => setAberto(true)} aria-haspopup="dialog" className={`${botao('secundario')} w-full`}>
                    Pedir para usar o calendário
                </button>
            </div>

            {aberto && <WardRequestModal onClose={() => setAberto(false)} />}
        </section>
    );
}
