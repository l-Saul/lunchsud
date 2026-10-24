/**
 * Contexto e regras: leia CLAUDE.md e docs/routes_api.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */

import { supabaseServer } from '@/lib/supabase/service-role'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
    const { data, error } = await supabaseServer
        .from('ala')
        .select('nome, slug')
        .order('nome')

    if (error) {
        return NextResponse.json({ error: 'Erro ao buscar alas' }, { status: 500 })
    }

    return NextResponse.json(data ?? [])
}
