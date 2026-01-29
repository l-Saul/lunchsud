export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: Request) {
    const { username, senha } = await req.json();

    if (!username || !senha) {
        return NextResponse.json(
            { error: 'Dados inválidos' },
            { status: 400 }
        );
    }

    const { data: usuario, error } = await supabaseAdmin
        .from('usuario')
        .select('id, senha_hash, ala_id, ativo')
        .eq('username', username)
        .single();

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

    const token = jwt.sign(
        { userId: usuario.id, alaId: usuario.ala_id },
        process.env.AUTH_SECRET,
        { expiresIn: '1d' }
    );

    const res = NextResponse.json({ success: true });

    res.cookies.set('admin_session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 60 * 60 * 24
    });

    return res;
}
