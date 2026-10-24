'use client';

import { useEffect, useRef } from 'react';
import { realtimeClient } from '@/lib/supabase/client';

// Realtime via WebSocket (Supabase Realtime): assina INSERT/UPDATE/DELETE da
// tabela "agendamento" de UMA ala e entrega a mudança pronta — quem usa aplica
// direto na tela, sem ir ao servidor buscar a lista de novo.
//
// O payload só traz as colunas que o anon pode ler (id, ala_id, data, nome);
// o telefone nunca vem. Em DELETE, com RLS ligada, o Realtime manda só a PK.
// Configuração no banco: ver supabase/schema.sql (publication + replica identity full).

export type AgendamentoAoVivo = { id: number; data: string; nome: string };

// `null` = reconectou depois de uma queda: eventos podem ter se perdido no
// intervalo, então quem usa deve recarregar a lista uma vez.
export type MudancaAgendamento =
    | { tipo: 'INSERT' | 'UPDATE'; agendamento: AgendamentoAoVivo }
    | { tipo: 'DELETE'; id: number }
    | null;

export function useOcupadosRealtime(
    alaId: number,
    onMudanca: (mudanca: MudancaAgendamento) => void
) {
    // Guarda o callback mais recente sem re-assinar o canal a cada render.
    const onMudancaRef = useRef(onMudanca);
    useEffect(() => {
        onMudancaRef.current = onMudanca;
    }, [onMudanca]);

    useEffect(() => {
        // A 1ª inscrição não avisa: os dados do servidor acabaram de chegar.
        let jaInscrito = false;

        const canal = realtimeClient
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
            });

        return () => {
            realtimeClient.removeChannel(canal);
        };
    }, [alaId]);
}
