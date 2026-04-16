import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('firmalar')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ success: true, data })

  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const { firma_kodu, firma_adi } = await request.json()

    if (!firma_kodu || !firma_adi) {
      return NextResponse.json({ error: 'Eksik parametre' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('firmalar')
      .insert({ firma_kodu, firma_adi })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })

  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PATCH(request) {
  try {
    const { id, aktif } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'Eksik parametre' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('firmalar')
      .update({ aktif })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })

  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}