/**
 * Contexto e regras: leia CLAUDE.md e docs/routes_api.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */

import { NextResponse, after } from 'next/server';
import { lerJson, parsePedidoAla, ValidationError, type PedidoAlaInput } from '@/lib/server/validation';
import { pedirAla } from '@/lib/server/ward-request';
import { avisarPedidoDeAla } from '@/lib/server/notifications';

export async function POST(req: Request) {
    let entrada: PedidoAlaInput;
    try {
        entrada = parsePedidoAla(await lerJson(req));
    } catch (e) {
        if (e instanceof ValidationError) {
            return NextResponse.json({ error: e.message }, { status: 400 });
        }
        return NextResponse.json({ error: 'Não foi possível enviar o pedido. Tente de novo.' }, { status: 400 });
    }

    if (entrada.pareceRobo) {
        return NextResponse.json({ ok: true });
    }
    if (entrada.rapidoDemais) {
        return NextResponse.json(
            { error: 'Confira os dados e toque em Enviar pedido de novo.' },
            { status: 400 }
        );
    }

    const resultado = await pedirAla(entrada);
    if (!resultado.ok) {
        return NextResponse.json({ error: resultado.erro }, { status: resultado.status });
    }

    after(() => avisarPedidoDeAla(resultado.alaId));
    return NextResponse.json({ ok: true });
}
