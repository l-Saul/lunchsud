import { RealtimeClient } from '@supabase/realtime-js'

// Cliente do Realtime (WebSocket) para o navegador, com a chave pública (anon).
// Só o Realtime: o supabase-js completo trazia login, storage e functions que o
// navegador do membro não usa (~57 KB gzip a mais na página pública). URL e
// autenticação iguais às que o supabase-js monta por dentro.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const chave = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const realtimeClient = new RealtimeClient(`${url.replace(/^http/, 'ws')}/realtime/v1`, {
    params: { apikey: chave },
    accessToken: async () => chave,
})
