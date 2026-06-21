import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { supabaseServer } from '@/lib/supabase/server'
import ClientPage from './ClientPage'

// Metadata por ala:
//  - título da ABA do navegador = só o nome da ala (curto, não estoura a aba);
//  - preview de COMPARTILHAMENTO = "Calendário de almoços da <ala>" + convite
//    (só texto, sem imagem), pra quem recebe já saber de qual ala é e o que fazer.
export async function generateMetadata(
    { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
    const { slug } = await params

    const { data: ala } = await supabaseServer
        .from('ala')
        .select('nome')
        .eq('slug', slug)
        .single()

    // Usa o nome (legível) da ala; o slug cru ficaria minúsculo/com hífen no título.
    const nome = ala?.nome ?? 'sua ala'
    const tituloCompartilhar = `Calendário de almoços da ${nome}`
    const descricao = 'Agende seu almoço para nossos missionários ❤️'

    return {
        // absolute = ignora o template "%s · ..." do layout. Aba = só o nome da ala.
        title: { absolute: nome },
        description: descricao,
        // Sem `images`: o compartilhamento mostra apenas texto (título + descrição).
        openGraph: {
            type: 'website',
            locale: 'pt_BR',
            title: tituloCompartilhar,
            description: descricao,
        },
        twitter: {
            card: 'summary',
            title: tituloCompartilhar,
            description: descricao,
        },
    }
}

// Server Component: resolve a ala pelo slug e pré-carrega os dias ocupados (SSR),
// repassando tudo para a ClientPage interativa.
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params

    // Busca o nome real da ala (não dá pra derivar do slug — ele perde acentos e
    // troca espaços por "_"). Slug inexistente → 404 (e não erro 500).
    const { data: ala } = await supabaseServer
        .from('ala')
        .select('id, nome')
        .eq('slug', slug)
        .single()

    if (!ala) {
        notFound()
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
            nomeAla={ala.nome}
            ocupados={ocupados ?? []}
        />
    )
}
