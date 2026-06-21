import { NextResponse } from 'next/server';

// Logout: expira o cookie de sessão (maxAge 0).
export async function POST() {
    const res = NextResponse.json({ success: true });

    res.cookies.set('admin_session', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 0
    });

    return res;
}
