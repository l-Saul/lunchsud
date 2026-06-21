import { supabaseServer } from '@/lib/supabase/server'
import ClientPage from './ClientPage'

// Server Component: resolve a ala pelo slug e pré-carrega os dias ocupados (SSR),
// repassando tudo para a ClientPage interativa.
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params

    const { data: ala, error: alaError } = await supabaseServer
        .from('ala')
        .select('id')
        .eq('slug', slug)
        .single()

    if (alaError || !ala) {
        throw new Error('Ala não encontrada')
    }

    const { data: ocupados, error } = await supabaseServer
        .from('agendamento')
        .select('data, nome')
        .eq('ala_id', ala.id)

    if (error) {
        throw new Error('Erro ao carregar agendamentos')
    }

    return (
        <ClientPage
        slug={slug}
        alaId={ala.id}
        ocupados={ocupados ?? []}
        />
    )
}
