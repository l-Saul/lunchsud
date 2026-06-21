import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { requireAdminSession } from '@/lib/auth';
import LoginClientGuard from './LoginClientGuard';
import LoginCard from './LoginCard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
    title: 'Entrar',
    robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
    try {
        await requireAdminSession();
        redirect('/dashboard');
    } catch {}

    return (
        <main className="flex min-h-screen items-center justify-center bg-primary px-4 py-12">
            <section className="w-full max-w-md">
                <LoginClientGuard>
                    <LoginCard />
                </LoginClientGuard>
            </section>
        </main>
    );
}
