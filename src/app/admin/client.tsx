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
        const bc = new BroadcastChannel('auth');

        bc.onmessage = msg => {
            if (msg.data === 'login') {
                router.push('/dashboard');
            }

            if (msg.data === 'logout') {
                router.push('/admin');
            }
        };

        return () => bc.close();
    }, [router]);

    return <>{children}</>;
}
