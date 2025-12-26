import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET() {
  const { data, error } = await supabase
    .from('ala')
    .select('nome, slug')
    .order('nome')

  if (error) {
    return NextResponse.json(
      { error: 'Erro ao buscar alas' },
      { status: 500 }
    )
  }

  return NextResponse.json(data)
}
