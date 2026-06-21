import { NextResponse } from 'next/server';

// Rate limiting em memória (janela fixa por chave IP+rota).
//
// ⚠️ ESCALA: o Map vive na memória de UMA instância serverless. Em produção na
// Vercel há várias lambdas, então o limite é aproximado (por instância), não
// global. Para o tamanho atual está ótimo. Ao escalar horizontalmente, troque
// SÓ o "store" abaixo por Upstash/Vercel KV — a interface usada nas rotas
// (`rateLimit` / `clientIp` / `tooManyRequests`) continua igual.

type Hit = { count: number; reset: number };

const store = new Map<string, Hit>();

// Limpeza preguiçosa pra o Map não crescer indefinidamente sob ataque.
function gc(now: number) {
    if (store.size < 5000) return;
    for (const [k, v] of store) {
        if (v.reset <= now) store.delete(k);
    }
}

export type RateResult = {
    ok: boolean;
    remaining: number;
    retryAfter: number; // segundos até liberar
};

// Permite `limit` requisições por `windowMs` para a `key`
// (ex.: `agendar:203.0.113.7`). Acima disso, ok=false.
export function rateLimit(key: string, limit: number, windowMs: number): RateResult {
    const now = Date.now();
    gc(now);

    const hit = store.get(key);

    // Primeira vez na janela (ou janela expirada): zera o contador.
    if (!hit || hit.reset <= now) {
        store.set(key, { count: 1, reset: now + windowMs });
        return { ok: true, remaining: limit - 1, retryAfter: 0 };
    }

    hit.count += 1;

    if (hit.count > limit) {
        return { ok: false, remaining: 0, retryAfter: Math.ceil((hit.reset - now) / 1000) };
    }

    return { ok: true, remaining: limit - hit.count, retryAfter: 0 };
}

// IP do cliente atrás do proxy da Vercel (x-forwarded-for traz a cadeia; o
// primeiro é o cliente real). Fallback para não agrupar todo mundo numa chave só.
export function clientIp(req: Request): string {
    const xff = req.headers.get('x-forwarded-for');
    if (xff) return xff.split(',')[0].trim();
    return req.headers.get('x-real-ip') ?? 'desconhecido';
}

// Resposta 429 padronizada, com Retry-After para clientes/robôs bem-comportados.
export function tooManyRequests(retryAfter: number): NextResponse {
    return NextResponse.json(
        { error: 'Muitas requisições. Tente novamente em instantes.' },
        { status: 429, headers: { 'Retry-After': String(retryAfter) } }
    );
}
