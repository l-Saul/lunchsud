import { requireAdminSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';

// Checagem de sessão usada pelo LoginClientGuard (200 = logado, 401/erro = não).
export async function GET() {
    const session = await requireAdminSession();

    const { data, error } = await supabaseAdmin
        .from('usuario')
        .select('id')
        .eq('ala_id', session.alaId);

    if (error) {
        return Response.json(
            { error: 'Erro interno' },
            { status: 500 }
        );
    }

    return Response.json({
        alaId: session.alaId,
        totalUsuarios: data.length
    });
}
