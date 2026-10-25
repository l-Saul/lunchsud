/**
 * Contexto e regras: leia CLAUDE.md e docs/src_hooks.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */
'use client';

import { useEffect, useRef } from 'react';
import type { RealtimeChannel } from '@supabase/realtime-js';
import { realtimeClient } from '@/lib/supabase/realtime';

export type AgendamentoAoVivo = { id: number; data: string; nome: string };

export type MudancaAgendamento =
    | { tipo: 'INSERT' | 'UPDATE'; agendamento: AgendamentoAoVivo }
    | { tipo: 'DELETE'; id: number }
    | null;

const LIBERAR_APOS_MS = 30_000;
const ASSENTAR_MS = 3_000;

export function useBookingsRealtime(
    alaId: number,
    onMudanca: (mudanca: MudancaAgendamento) => void
) {
    const onMudancaRef = useRef(onMudanca);
    useEffect(() => {
        onMudancaRef.current = onMudanca;
    }, [onMudanca]);

    useEffect(() => {
        let canal: RealtimeChannel | null = null;
        let jaInscrito = false;
        let escondidaDesde = 0;
        let timer: ReturnType<typeof setTimeout> | undefined;
        let assentou: ReturnType<typeof setTimeout> | undefined;

        function assinar() {
            if (canal) return;
            canal = realtimeClient
                .channel(`agendamentos-ala-${alaId}`)
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'agendamento',
                        filter: `ala_id=eq.${alaId}`,
                    },
                    payload => {
                        if (payload.eventType === 'DELETE') {
                            onMudancaRef.current({ tipo: 'DELETE', id: Number(payload.old.id) });
                            return;
                        }
                        const { id, data, nome } = payload.new;
                        onMudancaRef.current({
                            tipo: payload.eventType,
                            agendamento: { id: Number(id), data: String(data), nome: String(nome) },
                        });
                    }
                )
                .subscribe(status => {
                    if (status !== 'SUBSCRIBED') return;
                    if (jaInscrito) onMudancaRef.current(null);
                    jaInscrito = true;
                    clearTimeout(assentou);
                    assentou = setTimeout(() => onMudancaRef.current(null), ASSENTAR_MS);
                });
        }

        function soltar() {
            clearTimeout(assentou);
            if (!canal) return;
            realtimeClient.removeChannel(canal);
            canal = null;
        }

        function aoMudarVisibilidade() {
            if (document.visibilityState === 'hidden') {
                escondidaDesde = Date.now();
                timer = setTimeout(soltar, LIBERAR_APOS_MS);
                return;
            }
            clearTimeout(timer);
            if (escondidaDesde && Date.now() - escondidaDesde > LIBERAR_APOS_MS) soltar();
            escondidaDesde = 0;
            assinar();
        }

        assinar();
        document.addEventListener('visibilitychange', aoMudarVisibilidade);

        return () => {
            clearTimeout(timer);
            document.removeEventListener('visibilitychange', aoMudarVisibilidade);
            soltar();
        };
    }, [alaId]);
}
