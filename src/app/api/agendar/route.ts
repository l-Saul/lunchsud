import { supabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

type Body = {
  slug: string
  data: string
  nome: string
  telefone: string
}

export async function POST(req: Request) {
  // 1. Ler body
  const body: Body = await req.json()
  const { slug, data, nome, telefone } = body

  if (!slug || !data || !nome || !telefone) {
    return NextResponse.json(
      { error: 'Dados obrigatórios ausentes' },
      { status: 400 }
    )
  }

  // 2. Buscar ala pelo slug
  const { data: ala, error: alaError } = await supabaseServer
    .from('ala')
    .select('id')
    .eq('slug', slug)
    .single()

  if (alaError || !ala) {
    return NextResponse.json(
      { error: 'Ala não encontrada' },
      { status: 404 }
    )
  }

  // 3. Inserir agendamento
  const { error } = await supabaseServer
    .from('agendamento')
    .insert({
      ala_id: ala.id,
      data,
      nome,
      telefone
    })

  // 4. Tratar conflito de data
  if (error) {
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'Este dia acabou de ser ocupado. Escolha outro.' },
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
