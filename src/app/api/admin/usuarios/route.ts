import { requireAdminSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET() {
    const session = await requireAdminSession();

    const { data, error } = await supabaseAdmin
        .from('usuario')
        .select('id, username, ala_id')
        .eq('ala_id', session.alaId);

    if (error) {
        return Response.json(
            { error: 'Erro interno' },
            { status: 500 }
        );
    }

    return Response.json(data);
}
