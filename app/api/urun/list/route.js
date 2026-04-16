import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const firma_id = searchParams.get('firma_id')

    let query = supabase
      .from('urunler')
      .select('id, atc_kodu, urun_adi, kullanim_sekli, firma_id')
      .eq('aktif', true)
      .order('urun_adi', { ascending: true })

    if (firma_id) {
      query = query.eq('firma_id', firma_id)
    }

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({ success: true, urunler: data })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}