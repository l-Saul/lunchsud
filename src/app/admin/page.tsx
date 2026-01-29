import { redirect } from 'next/navigation';
import { requireAdminSession } from '@/lib/auth';
import LoginClientGuard from './client';
import LoginForm from './login';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminLoginPage() {
    try {
        await requireAdminSession();
        redirect('/dashboard');
    } catch {
        // não logado, segue
    }

    return (
        <main>
            <LoginClientGuard>
                <h1>Login admin</h1>
                <LoginForm />
            </LoginClientGuard>
        </main>
    );
}
