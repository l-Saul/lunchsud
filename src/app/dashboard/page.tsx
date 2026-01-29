import { redirect } from 'next/navigation';
import { requireAdminSession } from '@/lib/auth';

export default async function DashboardPage() {
    try {
        const session = await requireAdminSession();

        return (
            <main>
                <h1>Dashboard</h1>
                <p>Ala: {session.alaId}</p>
            </main>
        );
    } catch {
        redirect('/admin');
    }
}
