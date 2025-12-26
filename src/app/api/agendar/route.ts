import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rateLimit'

type Body = {
  slug: string
  data: string
  nome: string
  telefone: string
}

export async function POST(req: Request) {
  // ✅ 1. RATE LIMIT (primeira coisa)
  const ip =
    req.headers.get('x-forwarded-for') ??
    req.headers.get('x-real-ip') ??
    'unknown'

  const limit = rateLimit(ip)

  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Muitas tentativas. Tente novamente amanhã.' },
      { status: 429 }
    )
  }

  // ✅ 2. Ler body APÓS passar no rate limit
  const body: Body = await req.json()
  const { slug, data, nome, telefone } = body

  if (!slug || !data || !nome || !telefone) {
    return NextResponse.json(
      { error: 'Dados obrigatórios ausentes' },
      { status: 400 }
    )
  }

  // 3. Buscar ala pelo slug
  const { data: ala, error: alaError } = await supabase
    .from('ala')
    .select('id')
    .eq('slug', slug)
    .single()

  if (alaError || !ala) {
    return NextResponse.json({ error: 'Ala não encontrada' }, { status: 404 })
  }

  // 4. Inserir agendamento
  const { error } = await supabase
    .from('agendamento')
    .insert({
      ala_id: ala.id,
      data,
      nome,
      telefone
    })

  // 5. Tratar conflito de data
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
