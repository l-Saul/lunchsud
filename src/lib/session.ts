import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { criarSupabaseServidor } from '@/lib/supabase/auth-server';
import { supabaseServer } from '@/lib/supabase/server';

// Contexto de acesso do líder logado, resolvido a partir do Supabase Auth +
// das tabelas `perfil` (is_owner) e `ala_membro` (vínculo aprovado).
//
// Regras (definidas com o dono do projeto):
//  - owner  → acessa TODAS as alas; a "ala em foco" vem do cookie `ala_atual`
//             (troca de ala) ou cai na primeira ala.
//  - member → UMA ala só (o vínculo aprovado dele).
export type Contexto = {
    userId: string;
    nome: string;
    isOwner: boolean;
    alaId: number | null; // ala atualmente em foco no painel
};

// Usuário cru do Supabase Auth (ou null se não logado).
export async function getUsuario() {
    const supabase = await criarSupabaseServidor();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    return user;
}

// Monta o contexto completo (papel + ala em foco). Leitura via service-role para
// não depender de RLS aqui no servidor. Retorna null se não houver login.
export async function getContexto(): Promise<Contexto | null> {
    const user = await getUsuario();
    if (!user) return null;

    const { data: perfil } = await supabaseServer
        .from('perfil')
        .select('nome, is_owner')
        .eq('id', user.id)
        .single();

    const isOwner = perfil?.is_owner ?? false;
    let alaId: number | null = null;

    if (isOwner) {
        // Ala em foco: a escolhida (cookie) ou a primeira cadastrada.
        const cookieStore = await cookies();
        const selecionada = Number(cookieStore.get('ala_atual')?.value);

        if (selecionada) {
            alaId = selecionada;
        } else {
            const { data: primeira } = await supabaseServer
                .from('ala')
                .select('id')
                .order('nome')
                .limit(1)
                .single();
            alaId = primeira?.id ?? null;
        }
    } else {
        // Member: a ala do vínculo aprovado (uma só).
        const { data: vinculo } = await supabaseServer
            .from('ala_membro')
            .select('ala_id')
            .eq('user_id', user.id)
            .eq('status', 'aprovado')
            .limit(1)
            .single();
        alaId = vinculo?.ala_id ?? null;
    }

    return {
        userId: user.id,
        nome: perfil?.nome ?? '',
        isOwner,
        alaId,
    };
}

// Exige acesso ao painel:
//  - sem login        → manda para o /admin (entrar);
//  - logado sem ala   → manda para o /acesso (pedir/aguardar aprovação).
export async function requireAcesso(): Promise<Contexto> {
    const ctx = await getContexto();
    if (!ctx) redirect('/admin');
    if (!ctx.isOwner && ctx.alaId === null) redirect('/acesso');
    return ctx;
}

// O usuário pode editar a ala informada? (owner sempre; member só a sua, aprovada.)
export async function podeEditarAla(userId: string, isOwner: boolean, alaId: number) {
    if (isOwner) return true;
    const { data } = await supabaseServer
        .from('ala_membro')
        .select('id')
        .eq('user_id', userId)
        .eq('ala_id', alaId)
        .eq('status', 'aprovado')
        .limit(1)
        .single();
    return Boolean(data);
}
