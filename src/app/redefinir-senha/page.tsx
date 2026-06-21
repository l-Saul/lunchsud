import type { Metadata } from 'next';
import RedefinirSenhaForm from './RedefinirSenhaForm';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
    title: 'Redefinir senha',
    robots: { index: false, follow: false },
};

// Página onde o usuário chega pelo link do e-mail (após /auth/confirmar trocar o
// código pela sessão) para definir uma nova senha.
export default function RedefinirSenhaPage() {
    return (
        <main className="flex min-h-screen items-center justify-center px-4 py-12">
            <section className="w-full max-w-md">
                <RedefinirSenhaForm />
            </section>
        </main>
    );
}
