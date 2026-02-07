import { redirect } from 'next/navigation';
import { requireAdminSession } from '@/lib/auth';
import DashboardClientGuard from './dashboardClientGuard';
import { LogoutButton } from './logoutButton';
import { supabaseServer } from '@/lib/supabase-server';
import { formatDateBR } from '@/lib/date';
import EditModal from '@/components/EditModal';

export default async function DashboardPage() {
    try {
        const session = await requireAdminSession();

        const { data: ala, error: alaError } = await supabaseServer
            .from('ala')
            .select('nome')
            .eq('id', session.alaId)
            .single();

        if (alaError) {
            throw alaError;
        }

        const { data, error } = await supabaseServer
            .from('agendamento')
            .select('id, data, nome, telefone')
            .eq('ala_id', session.alaId)
            .order('data', { ascending: true });

        if (error) {
            throw error;
        }

        return (
            <DashboardClientGuard>
                <main
                    className="min-h-screen flex items-center justify-center px-6 py-12"
                    style={{ backgroundColor: 'var(--color-primary)' }}
                >
                    <section
                        className="w-full"
                        style={{ maxWidth: 900, margin: '0 auto' }}
                    >
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
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 8,
                                }}
                            >
                                <h1
                                    className="text-3xl font-semibold"
                                    style={{ color: 'var(--color-text)' }}
                                >
                                    Painel de Controle
                                </h1>

                                <p
                                    className="text-md"
                                    style={{ color: 'var(--color-muted)' }}
                                >
                                    {ala.nome}
                                </p>
                            </div>

<div className="overflow-x-auto">
    <table className="w-full border-collapse min-w-[640px]">
        <thead>
            <tr
                className="text-left text-md"
                style={{
                    color: 'var(--color-muted)',
                    borderBottom: '1px solid rgba(15, 23, 42, 0.1)',
                }}
            >
                <th className="py-2 px-4">Data</th>
                <th className="py-2 px-4">Nome</th>
                <th className="py-2 px-4">Telefone</th>
                <th className="py-2 px-4">Ações</th>
            </tr>
        </thead>
        <tbody>
            {data.map(row => (
                <tr
                    key={row.id}
                    className="text-md"
                    style={{
                        color: 'var(--color-text)',
                        borderBottom: '1px solid rgba(15, 23, 42, 0.05)',
                    }}
                >
                    <td className="py-3 px-4 whitespace-nowrap">
                        {formatDateBR(row.data)}
                    </td>
                    <td className="py-3 px-4">
                        {row.nome}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                        {row.telefone}
                    </td>
                    <td className="py-3 px-4">
                        <EditModal {...row} />
                    </td>
                </tr>
            ))}
        </tbody>
    </table>
</div>

                            <div className="flex justify-center pt-4">
                                <LogoutButton />
                            </div>
                        </div>
                    </section>
                </main>
            </DashboardClientGuard>
        );
    } catch {
        redirect('/admin');
    }
}
