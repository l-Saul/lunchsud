import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { buscarAlaPorSlug, buscarOcupados } from '@/lib/ala-publica'
import { getDashboardRange } from '@/lib/date'
import ClientPage from './ClientPage'

// Metadata por ala:
//  - título da ABA do navegador = só o nome da ala (curto, não estoura a aba);
//  - preview de COMPARTILHAMENTO = "Calendário de almoços da <ala>" + convite
//    (só texto, sem imagem), pra quem recebe já saber de qual ala é e o que fazer.
export async function generateMetadata(
    { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
    const { slug } = await params
    const ala = await buscarAlaPorSlug(slug)

    if (!ala) {
        return { title: 'Ala não encontrada', robots: { index: false, follow: false } }
    }

    const tituloCompartilhar = `Calendário de almoços da ${ala.nome}`
    const descricao = 'Agende seu almoço para nossos missionários ❤️'

    return {
        // absolute = ignora o template "%s · ..." do layout. Aba = só o nome da ala.
        title: { absolute: ala.nome },
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
    const ala = await buscarAlaPorSlug(slug)
    if (!ala) {
        notFound()
    }

    const ocupados = await buscarOcupados(ala.id)
    if (!ocupados) {
        throw new Error('Erro ao carregar agendamentos')
    }

    // Hoje e o mês base vêm do servidor (fuso de São Paulo), os mesmos usados
    // pelo /api/agendar. Calcular no aparelho podia mostrar outro dia/mês na
    // virada (fuso/relógio do celular) e dar erro na hora de agendar.
    const { hoje, mesAtual } = getDashboardRange()

    return (
        <ClientPage
            slug={ala.slug}
            alaId={ala.id}
            nomeAla={ala.nome}
            ocupados={ocupados}
            hoje={hoje}
            mesAtual={mesAtual}
        />
    )
}
