/**
 * Contexto e regras: leia CLAUDE.md e docs/routes_acesso.md antes de alterar.
 * Mudou o comportamento? Atualize o doc na mesma mudança.
 */

import type { Metadata } from 'next';
import { HeaderBand } from '@/components/HeaderBand';
import { redirect } from 'next/navigation';
import { getContexto } from '@/lib/server/session';
import { supabaseServer } from '@/lib/supabase/service-role';
import RequestAccess from './_components/RequestAccess';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
    title: 'Acesso',
    robots: { index: false, follow: false },
};

export default async function AcessoPage() {
    const ctx = await getContexto();
    if (!ctx) redirect('/admin');
    if (ctx.alaId !== null) redirect('/dashboard');

    const { data: vinculo } = await supabaseServer
        .from('ala_membro')
        .select('status, ala_id')
        .eq('user_id', ctx.userId)
        .maybeSingle();

    const { data: alas } = await supabaseServer
        .from('ala')
        .select('id, nome, slug')
        .order('nome');

    const lista = alas ?? [];
    const pendenteEm = vinculo
        ? (lista.find(a => a.id === vinculo.ala_id)?.nome ?? 'sua ala')
        : null;

    return (
        <>
            <HeaderBand />
            <main className="flex justify-center px-4 py-10">
                <section className="w-full max-w-md">
                    <RequestAccess nome={ctx.nome} alas={lista} pendenteEm={pendenteEm} />
                </section>
            </main>
        </>
    );
}
