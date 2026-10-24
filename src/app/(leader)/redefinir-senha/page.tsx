/**
 * Contexto e regras: leia CLAUDE.md e docs/routes_redefinir-senha.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */

import type { Metadata } from 'next';
import { getUsuario } from '@/lib/server/session';
import ResetPasswordForm from './_components/ResetPasswordForm';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
    title: 'Redefinir senha',
    robots: { index: false, follow: false },
};

export default async function RedefinirSenhaPage() {
    const usuario = await getUsuario();

    return (
        <main className="flex min-h-screen items-center justify-center px-4 py-12">
            <section className="w-full max-w-md">
                <ResetPasswordForm email={usuario?.email ?? ''} />
            </section>
        </main>
    );
}
