import ClientPage from './ClientPage'

type Props = {
  params: { slug: string }
}

export default async function Page({ params }: Props) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/agendamentos/${params.slug}`,
    { cache: 'no-store' }
  )

  const data = await res.json()
  const ocupados = Array.isArray(data) ? data.map((i: any) => i.data) : []

  return (
    <ClientPage
      slug={params.slug}
      ocupados={ocupados}
    />
  )
}
