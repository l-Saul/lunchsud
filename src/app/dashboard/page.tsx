import { redirect } from 'next/navigation';
import { requireAdminSession } from '@/lib/auth';
import DashboardClientGuard from './client';
import { LogoutButton } from './logout';

export default async function DashboardPage() {
    try {
        const session = await requireAdminSession();

        return (
            <DashboardClientGuard>
                <main>
                    <h1>Dashboard</h1>
                    <p>Ala: {session.alaId}</p>
                    <LogoutButton />
                </main>
            </DashboardClientGuard>
        );
    } catch {
        redirect('/admin');
    }
}
