'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function LogoutButton() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    async function handleLogout() {
        if (loading) return;

        setLoading(true);

        try {
            await fetch('/api/admin/logout', {
                method: 'POST'
            });

            const bc = new BroadcastChannel('auth');
            bc.postMessage('logout');
            bc.close();

            router.push('/admin');
        } finally {
            setLoading(false);
        }
    }

    return (
        <button
            onClick={handleLogout}
            disabled={loading}
            className={`
                px-4 py-2 rounded-md font-medium text-white bg-primary
                transition-all duration-300 cursor-pointer
                flex items-center justify-center gap-2
                ${loading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-primary hover:bg-secondary'}
            `}
        >
            {loading && (
                <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            )}
            {loading ? 'Saindo...' : 'Sair'}
        </button>
    );
}
