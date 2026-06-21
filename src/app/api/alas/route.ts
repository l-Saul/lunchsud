import { supabaseServer } from '@/lib/supabase/server'
import { rateLimit, clientIp, tooManyRequests } from '@/lib/rate-limit'
import { semAlaTesteEmProd } from '@/lib/alas'
import { NextRequest, NextResponse } from 'next/server'

// Lista as alas (nome + slug) para a home montar os botões. Consumido via SWR.
export async function GET(request: NextRequest) {
    // Rate limit por IP contra scraping/DoS (30/min).
    const limite = rateLimit(`alas:${clientIp(request)}`, 30, 60_000)
    if (!limite.ok) return tooManyRequests(limite.retryAfter)

    const { data, error } = await supabaseServer
        .from('ala')
        .select('nome, slug')
        .order('nome')

    if (error) {
        return NextResponse.json({ error: 'Erro ao buscar alas' }, { status: 500 })
    }

    // Esconde a ala de teste em produção (visível só em desenvolvimento).
    return NextResponse.json(semAlaTesteEmProd(data ?? []))
}
