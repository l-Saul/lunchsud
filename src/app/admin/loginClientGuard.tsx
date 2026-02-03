'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginClientGuard({
    children
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();

    useEffect(() => {
        async function checkSession() {
            const res = await fetch('/api/admin/dashboard', {
                cache: 'no-store'
            });

            if (res.ok) {
                router.replace('/dashboard');
            }
        }

        checkSession();

        const bc = new BroadcastChannel('auth');
        bc.onmessage = msg => {
            if (msg.data === 'login') {
                router.replace('/dashboard');
            }
        };

        return () => bc.close();
    }, [router]);

    return <>{children}</>;
}
