// Node runtime: bcrypt depende de APIs do Node (não roda no Edge).
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { lerJson, parseLogin, ValidationError } from '@/lib/validation';
import { rateLimit, clientIp, tooManyRequests } from '@/lib/rate-limit';

// Login do líder: valida usuário/senha (bcrypt) e grava o cookie de sessão (JWT).
export async function POST(req: Request) {
    // Anti-brute-force: no máximo 5 tentativas por IP a cada 10 minutos.
    const limite = rateLimit(`login:${clientIp(req)}`, 5, 10 * 60_000);
    if (!limite.ok) return tooManyRequests(limite.retryAfter);

    // Validação estrita; erros viram "Credenciais inválidas" pra não vazar nada.
    let username: string;
    let senha: string;
    try {
        ({ username, senha } = parseLogin(await lerJson(req)));
    } catch (e) {
        const status = e instanceof ValidationError ? 401 : 400;
        return NextResponse.json({ error: 'Credenciais inválidas' }, { status });
    }

    // Busca o usuário pela coluna username (ver tabela "usuario" no README).
    const { data: usuario, error } = await supabaseAdmin
        .from('usuario')
        .select('id, senha_hash, ala_id, ativo')
        .eq('username', username)
        .single();

    // Mesma resposta para inexistente/inativo/erro: não revela qual campo falhou.
    if (error || !usuario || !usuario.ativo) {
        return NextResponse.json(
            { error: 'Credenciais inválidas' },
            { status: 401 }
        );
    }

    const senhaValida = await bcrypt.compare(
        senha,
        usuario.senha_hash
    );

    if (!senhaValida) {
        return NextResponse.json(
            { error: 'Credenciais inválidas' },
            { status: 401 }
        );
    }

    if (!process.env.AUTH_SECRET) {
        return NextResponse.json(
            { error: 'Erro de configuração' },
            { status: 500 }
        );
    }

    // Token carrega o id do usuário e da ala; expira em 1 dia.
    const token = jwt.sign(
        { userId: usuario.id, alaId: usuario.ala_id },
        process.env.AUTH_SECRET,
        { expiresIn: '1d' }
    );

    const res = NextResponse.json({ success: true });

    // Cookie httpOnly (não acessível por JS) com a sessão.
    res.cookies.set('admin_session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 60 * 60 * 24
    });

    return res;
}
