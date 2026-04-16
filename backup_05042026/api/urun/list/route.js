import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('urunler')
      .select('id, atc_kodu, urun_adi, kullanim_sekli')
      .eq('aktif', true)
      .order('urun_adi', { ascending: true })

    if (error) throw error

    return NextResponse.json({ success: true, urunler: data })

  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}