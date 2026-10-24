/**
 * Contexto e regras: leia CLAUDE.md e docs/routes_api.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */

import { NextResponse } from 'next/server';
import { rodarAvisosDoDia } from '@/lib/server/notifications';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(req: Request) {
    const segredo = process.env.CRON_SECRET;
    if (!segredo || req.headers.get('authorization') !== `Bearer ${segredo}`) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    try {
        return NextResponse.json(await rodarAvisosDoDia());
    } catch (erro) {
        console.error('[cron avisos]', erro instanceof Error ? erro.message : erro);
        return NextResponse.json({ error: 'Falha ao rodar os avisos' }, { status: 500 });
    }
}
