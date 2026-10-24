/**
 * Contexto e regras: leia CLAUDE.md e docs/routes_dashboard.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */
'use client';

import { useRouter } from 'next/navigation';
import { useBookingsRealtime } from '@/hooks/use-bookings-realtime';

export function DashboardRealtime({ alaId }: { alaId: number }) {
    const router = useRouter();
    useBookingsRealtime(alaId, () => router.refresh());
    return null;
}
