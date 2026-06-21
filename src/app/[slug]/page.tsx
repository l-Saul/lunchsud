import type { Metadata } from 'next'
import { supabaseServer } from '@/lib/supabase/server'
import ClientPage from './ClientPage'

// Texto genérico do compartilhamento: escritura do Livro de Mórmon sobre Cristo
// (2 Néfi 31:20) — serena e centrada em Jesus Cristo, no tom do público da ala.
const ESCRITURA =
    '«Prosseguir com firmeza em Cristo, tendo um perfeito esplendor de esperança e amor a Deus e a todos os homens.» — 2 Néfi 31:20'

// Metadata por ala: ao compartilhar o link, o título é o NOME DA ALA e a descrição
// é a escritura. Assim o membro que recebe o link já entende de qual ala é.
export async function generateMetadata(
    { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
    const { slug } = await params

    const { data: ala } = await supabaseServer
        .from('ala')
        .select('nome')
        .eq('slug', slug)
        .single()

    const titulo = ala?.nome ?? 'Almoço dos Missionários'

    return {
        // absolute = ignora o template "%s · ..." do layout; o título é só o nome da ala.
        title: { absolute: titulo },
        description: ESCRITURA,
        openGraph: {
            type: 'website',
            locale: 'pt_BR',
            title: titulo,
            description: ESCRITURA,
            images: [
                { url: '/lunchsud512x512.png', width: 512, height: 512, alt: titulo },
            ],
        },
        twitter: {
            card: 'summary',
            title: titulo,
            description: ESCRITURA,
        },
    }
}

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
