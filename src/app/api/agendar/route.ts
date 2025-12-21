import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

type Body = {
  slug: string
  data: string
  nome: string
  telefone: string
}

export async function POST(req: Request) {
  const body: Body = await req.json()
  const { slug, data, nome, telefone } = body

  if (!slug || !data || !nome || !telefone) {
    return NextResponse.json(
      { error: 'Dados obrigatórios ausentes' },
      { status: 400 }
    )
  }

  // 1. Buscar ala pelo slug
  const { data: ala, error: alaError } = await supabase
    .from('ala')
    .select('id')
    .eq('slug', slug)
    .single()

  if (alaError || !ala) {
    return NextResponse.json({ error: 'Ala não encontrada' }, { status: 404 })
  }

  // 2. Inserir agendamento
  const { error } = await supabase
    .from('agendamento')
    .insert({
      ala_id: ala.id,
      data,
      nome,
      telefone
    })

  // 3. Tratar conflito de data
  if (error) {
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'Dia já ocupado' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Erro ao salvar agendamento' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true })
}
