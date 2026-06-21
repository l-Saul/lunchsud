'use client';

// Sincroniza logout entre abas: se o líder sai em uma aba, as outras voltam ao login
// (via BroadcastChannel 'auth').

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardClientGuard({
    children
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();

    useEffect(() => {
        const bc = new BroadcastChannel('auth');

        bc.onmessage = msg => {
            if (msg.data === 'logout') {
                router.push('/admin');
            }
        };

        return () => bc.close();
    }, [router]);

    return <>{children}</>;
}
