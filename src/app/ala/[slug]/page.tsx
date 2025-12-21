type Props = {
  params: {
    slug: string
  }
}

export default function AlaPage({ params }: Props) {
  return (
    <main>
      <h1>Ala: {params.slug}</h1>
      <p>Calendário será exibido aqui.</p>
    </main>
  )
}
