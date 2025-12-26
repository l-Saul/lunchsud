import { supabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET(
  _: Request,
  { params }: { params: { slug: string } }
) {
  const { slug } = params

  const { data: ala, error: alaError } = await supabaseServer
    .from('ala')
    .select('id')
    .eq('slug', slug)
    .single()

  if (alaError || !ala) {
    return NextResponse.json({ error: 'Ala não encontrada' }, { status: 404 })
  }

  const { data: agendamentos, error } = await supabaseServer
    .from('agendamento')
    .select('data')
    .eq('ala_id', ala.id)

  if (error) {
    return NextResponse.json(
      { error: 'Erro ao buscar agendamentos' },
      { status: 500 }
    )
  }

  return NextResponse.json(agendamentos)
}
