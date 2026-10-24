'use client';

import { useEffect, useRef } from 'react';
import type { RealtimeChannel } from '@supabase/realtime-js';
import { realtimeClient } from '@/lib/supabase/realtime';

// Realtime via WebSocket (Supabase Realtime): assina INSERT/UPDATE/DELETE da
// tabela "agendamento" de UMA ala e entrega a mudança pronta — quem usa aplica
// direto na tela, sem ir ao servidor buscar a lista de novo.
//
// O payload só traz as colunas que o anon pode ler (id, ala_id, data, nome);
// o telefone nunca vem. Em DELETE, com RLS ligada, o Realtime manda só a PK.
// Configuração no banco: ver supabase/schema.sql (publication + replica identity full).

export type AgendamentoAoVivo = { id: number; data: string; nome: string };

// `null` = reconectou (queda de rede ou volta para a página): eventos podem ter
// se perdido no intervalo, então quem usa deve recarregar a lista uma vez.
export type MudancaAgendamento =
    | { tipo: 'INSERT' | 'UPDATE'; agendamento: AgendamentoAoVivo }
    | { tipo: 'DELETE'; id: number }
    | null;

// Página escondida (celular bloqueado, outro app) por mais que isto → solta a
// conexão. O plano Free do Supabase tem 200 conexões simultâneas: aparelho
// esquecido com a página aberta não deve ocupar a vaga de quem está agendando.
const LIBERAR_APOS_MS = 30_000;

export function useBookingsRealtime(
    alaId: number,
    onMudanca: (mudanca: MudancaAgendamento) => void
) {
    // Guarda o callback mais recente sem re-assinar o canal a cada render.
    const onMudancaRef = useRef(onMudanca);
    useEffect(() => {
        onMudancaRef.current = onMudanca;
    }, [onMudanca]);

    useEffect(() => {
        let canal: RealtimeChannel | null = null;
        // A 1ª inscrição não avisa: os dados do servidor acabaram de chegar.
        let jaInscrito = false;
        let escondidaDesde = 0;
        let timer: ReturnType<typeof setTimeout> | undefined;

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
                });
        }

        // Sai do canal. Sem canais, o realtime-js fecha o WebSocket sozinho ~50 s
        // depois (padrão: 2 × heartbeat), e a conexão volta para o limite do plano.
        function soltar() {
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
            // Celular suspende o JavaScript em segundo plano e o timer pode não ter
            // rodado: a conexão pode estar morta sem saber. Recomeça do zero.
            if (escondidaDesde && Date.now() - escondidaDesde > LIBERAR_APOS_MS) soltar();
            escondidaDesde = 0;
            assinar(); // nova inscrição → SUBSCRIBED → avisa null → ressincroniza
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
