'use client';

import { useRouter } from 'next/navigation';

export function LogoutButton() {
    const router = useRouter();

    async function handleLogout() {
        await fetch('/api/admin/logout', {
            method: 'POST'
        });

        const bc = new BroadcastChannel('auth');
        bc.postMessage('logout');
        bc.close();

        router.push('/admin');
    }

    return (
        <button onClick={handleLogout}>
            Logout
        </button>
    );
}
