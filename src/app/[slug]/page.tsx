import type { Metadata } from 'next'
import ClientPage from './ClientPage'

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata(
  { params }: Props
): Promise<Metadata> {
  const { slug } = await params

  const nomeAla = decodeURIComponent(slug)

  return {
    title: `Ala ${nomeAla}`,
    description: `Agendamento de almoço para a ala ${nomeAla}`,

    openGraph: {
      title: `Ala ${nomeAla}`,
      description: `Agendamento de almoço para a ala ${nomeAla}`,
      url: `https://lunchsud.vercel.app/${slug}`,
      siteName: 'Almoço dos Missionários',
      locale: 'pt_BR',
      type: 'website',
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: `Almoço dos Missionários – ${nomeAla}`,
        }
      ],
    }
  }
}

export default async function Page({ params }: Props) {
  const { slug } = await params

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/agendamentos/${slug}`,
    { cache: 'no-store' }
  )

  const data = await res.json()
  const ocupados = Array.isArray(data) ? data.map((i: any) => i.data) : []

  return (
    <ClientPage
      slug={slug}
      ocupados={ocupados}
    />
  )
}

