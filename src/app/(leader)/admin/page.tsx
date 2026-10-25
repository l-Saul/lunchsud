/**
 * Contexto e regras: leia CLAUDE.md e docs/routes_admin.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */

import type { Metadata } from 'next';
import { HeaderBand } from '@/components/HeaderBand';
import { redirect } from 'next/navigation';
import { getUsuario } from '@/lib/server/session';
import LoginCard from './_components/LoginCard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
    title: 'Entrar',
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
        <>
            <HeaderBand title="Acesso do líder" />
            <main className="flex justify-center px-4 py-10">
                <section className="w-full max-w-md">
                    <LoginCard erroInicial={erroInicial} />
                </section>
            </main>
        </>
    );
}
