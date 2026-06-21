'use client';

import { useEffect, useRef } from 'react';
import { supabaseClient } from '@/lib/supabase/client';

// Realtime via WebSocket (Supabase Realtime, não é polling HTTP):
// assina INSERT/UPDATE/DELETE da tabela "agendamento" de UMA ala e chama onChange
// a cada mudança, para o calendário se atualizar ao vivo entre quem está com a tela aberta.
//
// Requer (no Supabase, uma vez):
//   - tabela "agendamento" na publication realtime:
//       alter publication supabase_realtime add table agendamento;
//   - RLS + policy de leitura para o papel anon (service role já ignora RLS):
//       alter table agendamento enable row level security;
//       create policy "leitura publica" on agendamento for select to anon using (true);
//   - REPLICA IDENTITY FULL para que DELETE/UPDATE tragam a linha antiga inteira;
//     sem isso o Postgres só envia a PK e o filtro ala_id não casa em remoções
//     (ou seja: apagar um agendamento NÃO atualizaria ao vivo). Uma vez:
//       alter table agendamento replica identity full;
export function useOcupadosRealtime(
    alaId: number | string,
    onChange: () => void
) {
    // Guarda o callback mais recente sem re-assinar o canal a cada render.
    const onChangeRef = useRef(onChange);
    useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);

    useEffect(() => {
        const canal = supabaseClient
            .channel(`agendamentos-ala-${alaId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'agendamento',
                    filter: `ala_id=eq.${alaId}`,
                },
                () => onChangeRef.current()
            )
            .subscribe();

        return () => {
            supabaseClient.removeChannel(canal);
        };
    }, [alaId]);
}
