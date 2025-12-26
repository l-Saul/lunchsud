import { supabase } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params

  const { data: ala, error: alaError } = await supabase
    .from('ala')
    .select('id')
    .eq('slug', slug)
    .single()

  if (alaError || !ala) {
    return NextResponse.json({ error: 'Ala não encontrada' }, { status: 404 })
  }

  const { data: agendamentos, error } = await supabase
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
