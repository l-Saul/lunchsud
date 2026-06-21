'use client';

// Sincroniza o logout entre abas: se a sessão do Supabase Auth cai (logout em
// outra aba ou token expirado), volta para o login.

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { criarSupabaseBrowser } from '@/lib/supabase/browser';

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
