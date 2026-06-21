import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getUsuario } from '@/lib/session';
import LoginCard from './LoginCard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
    // absolute = aba mostra só "Entrar" (sem o sufixo "· Almoço dos Missionários").
    title: { absolute: 'Entrar' },
    robots: { index: false, follow: false },
};

// Tela de login/cadastro. Se já houver sessão do Supabase Auth, pula pro painel
// (que por sua vez manda pro /acesso se ainda não tiver ala aprovada).
// `?erro=link` chega quando o link de redefinição de senha expirou/foi usado.
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
            ? 'O link de redefinição expirou ou já foi usado. Peça um novo em "Esqueci minha senha".'
            : undefined;

    return (
        <main className="flex min-h-screen items-center justify-center px-4 py-12">
            <section className="w-full max-w-md">
                <LoginCard erroInicial={erroInicial} />
            </section>
        </main>
    );
}
