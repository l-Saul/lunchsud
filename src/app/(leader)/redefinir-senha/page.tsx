import type { Metadata } from 'next';
import { getUsuario } from '@/lib/server/session';
import ResetPasswordForm from './_components/ResetPasswordForm';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
    title: 'Redefinir senha',
    robots: { index: false, follow: false },
};

// Página onde o usuário chega pelo link do e-mail (após /auth/confirmar trocar o
// código pela sessão) para definir uma nova senha. O e-mail da conta vai para o
// formulário para o gerenciador de senhas saber qual senha salva atualizar.
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
