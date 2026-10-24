/**
 * Contexto e regras: leia CLAUDE.md e docs/routes_dashboard.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { criarSupabaseBrowser } from '@/lib/supabase/browser-session';

export default function DashboardClientGuard({
    children
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const [supabase] = useState(() => criarSupabaseBrowser());

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(event => {
            if (event === 'SIGNED_OUT') {
                router.replace('/admin');
            }
        });

        return () => subscription.unsubscribe();
    }, [router, supabase]);

    return <>{children}</>;
}
