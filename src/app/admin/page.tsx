import { redirect } from 'next/navigation';
import { requireAdminSession } from '@/lib/auth';
import LoginClientGuard from './client';
import LoginForm from './login';

export default async function AdminLoginPage() {
    try {
        await requireAdminSession();
        redirect('/dashboard');
    } catch {}

    return (
        <main>
            <LoginClientGuard>
                <h1>Login admin</h1>
                <LoginForm />
            </LoginClientGuard>
        </main>
    );
}
