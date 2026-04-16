import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Eksik parametre: id' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('urunler')
      .select('id, atc_kodu, urun_adi, kullanim_sekli, pozoloji, ozellikler, kullanim_sekli_editable, pozoloji_editable, ozellikler_editable, avantaj_editable, fayda_editable')
      .eq('id', id)
      .eq('aktif', true)
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, urun: data })

  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}