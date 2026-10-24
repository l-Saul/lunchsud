/**
 * Contexto e regras: leia CLAUDE.md e docs/src_lib.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */

import { RealtimeClient } from '@supabase/realtime-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const chave = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const realtimeClient = new RealtimeClient(`${url.replace(/^http/, 'ws')}/realtime/v1`, {
    params: { apikey: chave },
    accessToken: async () => chave,
})
