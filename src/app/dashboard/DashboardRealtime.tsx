'use client';

import { useRouter } from 'next/navigation';
import { useOcupadosRealtime } from '@/hooks/use-ocupados-realtime';

// Mantém o painel ao vivo: quando um agendamento da ala muda (WebSocket),
// re-busca os dados do Server Component com router.refresh() — sem recarregar a
// página. Aqui não dá para aplicar o payload direto: o painel mostra o telefone,
// que nunca vem pelo WebSocket. São poucos líderes, então o custo é pequeno.
export function DashboardRealtime({ alaId }: { alaId: number }) {
    const router = useRouter();
    useOcupadosRealtime(alaId, () => router.refresh());
    return null;
}
