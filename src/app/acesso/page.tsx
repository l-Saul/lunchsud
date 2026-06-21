import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getContexto } from '@/lib/session';
import { supabaseServer } from '@/lib/supabase/server';
import { semAlaTesteEmProd } from '@/lib/alas';
import SolicitarAcesso from './SolicitarAcesso';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
    title: 'Acesso',
    robots: { index: false, follow: false },
};

// Tela para quem está logado mas ainda não tem ala aprovada: pede acesso a uma
// ala (member = 1 ala) ou mostra "aguardando aprovação".
export default async function AcessoPage() {
    const ctx = await getContexto();
    if (!ctx) redirect('/admin');          // não logado
    if (ctx.alaId !== null) redirect('/dashboard'); // já tem acesso

    const { data: vinculo } = await supabaseServer
        .from('ala_membro')
        .select('status, ala_id')
        .eq('user_id', ctx.userId)
        .maybeSingle();

    const { data: alas } = await supabaseServer
        .from('ala')
        .select('id, nome, slug')
        .order('nome');

    // Esconde a ala de teste em produção (visível só em desenvolvimento).
    const lista = semAlaTesteEmProd(alas ?? []);
    const pendenteEm = vinculo
        ? (lista.find(a => a.id === vinculo.ala_id)?.nome ?? 'sua ala')
        : null;

    return (
        <main className="flex min-h-screen items-center justify-center px-4 py-12">
            <section className="w-full max-w-md">
                <SolicitarAcesso nome={ctx.nome} alas={lista} pendenteEm={pendenteEm} />
            </section>
        </main>
    );
}
