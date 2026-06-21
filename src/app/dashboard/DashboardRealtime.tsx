'use client';

import { useRouter } from 'next/navigation';
import { useOcupadosRealtime } from '@/hooks/use-ocupados-realtime';

// Mantém o painel ao vivo: quando um agendamento da ala muda (WebSocket),
// re-busca os dados do Server Component com router.refresh() — sem recarregar a página.
export function DashboardRealtime({ alaId }: { alaId: number }) {
    const router = useRouter();
    useOcupadosRealtime(alaId, () => router.refresh());
    return null;
}
