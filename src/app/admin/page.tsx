import { redirect } from 'next/navigation';
import { requireAdminSession } from '@/lib/auth';
import LoginClientGuard from './loginClientGuard';
import LoginForm from './loginForm';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminLoginPage() {
    try {
        await requireAdminSession();
        redirect('/dashboard');
    } catch {}

    return (
        <main
            className="min-h-screen flex items-center justify-center px-6 py-12"
            style={{ backgroundColor: 'var(--color-primary)' }}
        >
            <section className="w-full" style={{ maxWidth: 480, margin: '0 auto' }}>
                <LoginClientGuard>
                    <div
                        className="rounded-3xl shadow-xl px-10 py-12"
                        style={{
                            backgroundColor: 'var(--color-background)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 24,
                        }}
                    >
                        <div
                            className="text-center"
                            style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
                        >
                            <h1
                                className="text-3xl font-semibold"
                                style={{ color: 'var(--color-text)' }}
                            >
                                Área administrativa
                            </h1>
                        </div>

                        <LoginForm />
                    </div>
                </LoginClientGuard>
            </section>
        </main>
    );
}
