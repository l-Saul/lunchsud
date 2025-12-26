import ClientPage from './ClientPage'

type Props = {
  params: Promise<{ slug: string }>
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
