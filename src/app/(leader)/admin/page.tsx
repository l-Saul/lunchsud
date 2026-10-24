/**
 * Contexto e regras: leia CLAUDE.md e docs/routes_admin.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */

import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getUsuario } from '@/lib/server/session';
import LoginCard from './_components/LoginCard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
    title: { absolute: 'Entrar' },
    robots: { index: false, follow: false },
};

export default async function AdminLoginPage({
    searchParams,
}: {
    searchParams: Promise<{ erro?: string }>;
}) {
    const user = await getUsuario();
    if (user) redirect('/dashboard');

    const { erro } = await searchParams;
    const erroInicial =
        erro === 'link'
            ? 'Esse link expirou ou já foi usado. Para criar uma nova senha, toque em "Esqueci minha senha" e peça outro link.'
            : undefined;

    return (
        <main className="flex min-h-screen items-center justify-center px-4 py-12">
            <section className="w-full max-w-md">
                <LoginCard erroInicial={erroInicial} />
            </section>
        </main>
    );
}
