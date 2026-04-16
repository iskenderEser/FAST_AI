import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const {
      kullanici_id,
      sosyal_stil,
      konfor_alani,
      ogrenme_stili,
      tedavi_alani,
      urun,
      kullanim_sekli,
      pozoloji,
      temel_cpr,
      stil_cprlar
    } = await request.json()

    if (!kullanici_id) {
      return NextResponse.json({ error: 'Kullanıcı bilgisi gerekli' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('pdf_stock')
      .insert({
        kullanici_id,
        sosyal_stil,
        konfor_alani,
        ogrenme_stili,
        tedavi_alani,
        urun,
        kullanim_sekli,
        pozoloji,
        temel_cpr,
        stil_cprlar
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })

  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}