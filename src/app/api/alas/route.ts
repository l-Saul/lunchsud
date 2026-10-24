import { supabaseServer } from '@/lib/supabase/service-role'
import { NextResponse } from 'next/server'

// Sempre consulta o banco: sem isto o Next poderia congelar a lista no build.
export const dynamic = 'force-dynamic'

// Lista as alas (nome + slug) para a home montar os botões. Consumido via SWR.
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
